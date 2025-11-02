import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';

import { B3Upload } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import { useBlockPendingAccountViewPrice, useFeatureFlags } from '@/hooks';
import useMobile from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { activeCurrencyInfoSelector, useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';

import {
  QuickOrderListItem,
  QuickOrderSelection,
  buildQuickOrderItemsFromSelections,
} from '../utils';

import QuickAdd from './QuickAdd';
import SearchProduct from './SearchProduct';

type OptionSelection = { optionId: number | string; optionValue: string | number | null };

type CsvProduct = {
  productId: number;
  variantId: number;
  variantSku?: string;
  quantity: number;
  optionSelections?: OptionSelection[];
};

interface QuickOrderPadProps {
  onAddProducts: (items: QuickOrderListItem[]) => void;
}

const dividerStyles = {
  borderColor: '#000000',
  borderWidth: '0 0 0.5px 0',
  borderStyle: 'solid',
  opacity: 1,
} as const;

const normalizeOptionSelections = (options: CustomFieldItems = []) =>
  options.map((option: CustomFieldItems) => ({
    optionId:
      option.optionId ?? option.option_id ?? option.id ?? option.product_option_id ?? option.option_id ?? '',
    optionValue:
      option.optionValue ??
      option.value ??
      option.value_id ??
      (option.id !== undefined ? option.id : option.optionValue ?? null),
  }));

const buildSelectionFromProduct = (product: CustomFieldItems): QuickOrderSelection | null => {
  const productId = Number(product.id || product.productId);
  const variantId = Number(product.variantId || product.variant_id || product?.variants?.[0]?.variant_id);
  const quantity = Number(product.quantity) || 1;

  if (!productId || !variantId) {
    return null;
  }

  return {
    productId,
    variantId,
    variantSku: product.variantSku || product.sku || '',
    quantity,
    optionSelections: normalizeOptionSelections(product.newSelectOptionList || []),
  };
};

const buildSelectionsFromQuickAdd = (products: CustomFieldItems[]): QuickOrderSelection[] =>
  products
    .map((item) => {
      const productId = Number(item.productId || item.products?.productId);
      const variantId = Number(item.variantId || item.products?.variantId);
      const quantity = Number(item.quantity) || Number(item.qty) || 1;

      if (!productId || !variantId) {
        return null;
      }

      return {
        productId,
        variantId,
        variantSku: item.variantSku || item.products?.variantSku || '',
        quantity,
        optionSelections: normalizeOptionSelections(
          item.newSelectOptionList || item.optionSelections || [],
        ),
      };
    })
    .filter(Boolean) as QuickOrderSelection[];

const buildSelectionsFromCsv = (products: CsvProduct[]): QuickOrderSelection[] =>
  products
    .map(({ productId, variantId, variantSku = '', quantity, optionSelections = [] }) => {
      if (!productId || !variantId) return null;

      return {
        productId: Number(productId),
        variantId: Number(variantId),
        variantSku,
        quantity: Number(quantity) || 1,
        optionSelections: normalizeOptionSelections(optionSelections),
      };
    })
    .filter(Boolean) as QuickOrderSelection[];

export default function QuickOrderPad({ onAddProducts }: QuickOrderPadProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false);
  const [productData, setProductData] = useState<CustomFieldItems>([]);
  const [addBtnText, setAddBtnText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();
  const featureFlags = useFeatureFlags();
  const backendValidationEnabled =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'];

  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);

  const companyId = companyInfoId || salesRepCompanyId;

  const getValidProducts = (products: CustomFieldItems) => {
    const notPurchaseSku: string[] = [];
    const productItems: CsvProduct[] = [];
    const limitProduct: CustomFieldItems[] = [];
    const minLimitQuantity: CustomFieldItems[] = [];
    const maxLimitQuantity: CustomFieldItems[] = [];
    const outOfStock: string[] = [];

    products.forEach((item: CustomFieldItems) => {
      const { products: currentProduct, qty } = item;
      const {
        option,
        isStock,
        stock,
        purchasingDisabled,
        maxQuantity,
        minQuantity,
        variantSku,
        variantId,
        productId,
        modifiers,
      } = currentProduct;
      if (purchasingDisabled === '1' || purchasingDisabled) {
        notPurchaseSku.push(variantSku);
        return;
      }

      if (isStock === '1' && stock === 0) {
        outOfStock.push(variantSku);
        return;
      }

      if (isStock === '1' && stock > 0 && stock < Number(qty)) {
        limitProduct.push({
          variantSku,
          AvailableAmount: stock,
        });
        return;
      }

      if (Number(minQuantity) > 0 && Number(qty) < Number(minQuantity)) {
        minLimitQuantity.push({
          variantSku,
          minQuantity,
        });

        return;
      }

      if (Number(maxQuantity) > 0 && Number(qty) > Number(maxQuantity)) {
        maxLimitQuantity.push({
          variantSku,
          maxQuantity,
        });

        return;
      }

      const optionsList = option.map((optionItem: CustomFieldItems) => ({
        optionId: optionItem.option_id,
        optionValue: optionItem.id,
      }));

      productItems.push({
        productId: parseInt(productId, 10) || 0,
        variantId: parseInt(variantId, 10) || 0,
        quantity: Number(qty),
        optionSelections: optionsList,
        variantSku,
      });
    });

    return {
      notPurchaseSku,
      productItems,
      limitProduct,
      minLimitQuantity,
      maxLimitQuantity,
      outOfStock,
    };
  };

  const addSelectionsToQuickOrderList = async (selections: QuickOrderSelection[]) => {
    if (!selections.length) return;

    try {
      const items = await buildQuickOrderItemsFromSelections(selections, {
        companyId: Number(companyId) || 0,
        customerGroupId,
        currencyCode,
      });

      onAddProducts(items);
      snackbar.success(b3Lang('purchasedProducts.quickOrderPad.productsAdded'));
    } catch (error) {
      if (error instanceof Error) {
        snackbar.error(error.message);
      } else {
        snackbar.error('Error has occurred');
      }
      b2bLogger.error(error);
    }
  };

  const handleSearchAdditions = async (products: CustomFieldItems[]) => {
    const selections = products
      .map((product) => buildSelectionFromProduct(product))
      .filter(Boolean) as QuickOrderSelection[];

    await addSelectionsToQuickOrderList(selections);
  };

  const handleQuickAddToList = async (products: CustomFieldItems[]) => {
    const selections = buildSelectionsFromQuickAdd(products);

    await addSelectionsToQuickOrderList(selections);
  };

  const handleUploadAdditions = async (productsData: CustomFieldItems) => {
    setIsLoading(true);
    try {
      const { stockErrorFile, validProduct } = productsData;

      const {
        notPurchaseSku,
        productItems,
        limitProduct,
        minLimitQuantity,
        maxLimitQuantity,
        outOfStock,
      } = getValidProducts(validProduct);

      if (productItems.length > 0) {
        await addSelectionsToQuickOrderList(buildSelectionsFromCsv(productItems));
        setIsOpenBulkLoadCSV(false);
      }

      if (limitProduct.length > 0) {
        limitProduct.forEach((data: CustomFieldItems) => {
          snackbar.warning(
            b3Lang('purchasedProducts.quickOrderPad.notEnoughStock', {
              variantSku: data.variantSku,
            }),
            {
              description: b3Lang('purchasedProducts.quickOrderPad.availableAmount', {
                availableAmount: data.AvailableAmount,
              }),
            },
          );
        });
      }

      if (notPurchaseSku.length > 0) {
        snackbar.error(
          b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
            notPurchaseSku: notPurchaseSku.join(','),
          }),
        );
      }

      if (outOfStock.length > 0 && stockErrorFile) {
        snackbar.error(
          b3Lang('purchasedProducts.quickOrderPad.outOfStockSku', {
            outOfStock: outOfStock.join(','),
          }),
          {
            action: {
              label: b3Lang('purchasedProducts.quickOrderPad.downloadErrorsCSV'),
              onClick: () => {
                window.location.href = stockErrorFile;
              },
            },
          },
        );
      }

      if (minLimitQuantity.length > 0) {
        minLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(
            b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
              minQuantity: data.minQuantity,
              sku: data.variantSku,
            }),
          );
        });
      }

      if (maxLimitQuantity.length > 0) {
        maxLimitQuantity.forEach((data: CustomFieldItems) => {
          snackbar.error(
            b3Lang('purchasedProducts.quickOrderPad.maxQuantityMessage', {
              maxQuantity: data.maxQuantity,
              sku: data.variantSku,
            }),
          );
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackendUploadAdditions = async (productsData: CustomFieldItems) => {
    setIsLoading(true);
    try {
      const { validProduct } = productsData;

      const selections = buildSelectionsFromCsv(
        (validProduct || []).map((item: CustomFieldItems) => ({
          productId: Number(item.products?.productId) || 0,
          variantId: Number(item.products?.variantId) || 0,
          variantSku: item.products?.variantSku || '',
          quantity: Number(item.qty) || 0,
          optionSelections: normalizeOptionSelections(item.products?.option || []),
        })),
      );

      if (selections.length > 0) {
        await addSelectionsToQuickOrderList(selections);
        setIsOpenBulkLoadCSV(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        const { stockErrorFile } = productsData;
        const isOutOfStock =
          errorMessage.toLowerCase().includes('out of stock') ||
          errorMessage.toLowerCase().includes('insufficient stock');

        if (isOutOfStock && stockErrorFile) {
          snackbar.error(errorMessage, {
            action: {
              label: b3Lang('purchasedProducts.quickOrderPad.downloadErrorsCSV'),
              onClick: () => {
                window.location.href = stockErrorFile;
              },
            },
          });
        } else {
          snackbar.error(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUploadDiag = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(b3Lang('purchasedProducts.quickOrderPad.addNProductsToCart'));
    } else {
      setIsOpenBulkLoadCSV(true);
    }
  };

  useEffect(() => {
    if (productData?.length > 0) {
      setAddBtnText(
        b3Lang('purchasedProducts.quickOrderPad.addNProductsToCart', {
          quantity: productData.length,
        }),
      );
    } else {
      setAddBtnText(b3Lang('purchasedProducts.quickOrderPad.addToCart'));
    }
  }, [b3Lang, productData]);

  return (
    <Card
      sx={{
        marginBottom: isMobile ? '8.5rem' : '50px',
        boxShadow: 'none',
        borderStyle: 'solid',
        borderColor: '#000000',
        borderWidth: '0px 0.3px 0.3px 0px',
        backgroundColor: '#ffffff',
        borderRadius: '0px',
        mt: { lg: '36px' },
      }}
    >
      <CardContent sx={{ padding: '16px' }}>
        <Box>
          <Typography
            sx={{
              fontFamily: 'Lato, sans-serif',
              fontWeight: isMobile ? 400 : 600,
              fontSize: isMobile ? '20px' : '24px',
              lineHeight: '28px',
              color: '#000000',
              textAlign: isMobile ? 'center' : 'left',
              marginBottom: isMobile ? '16px' : '24px',
            }}
          >
            {b3Lang('purchasedProducts.quickOrderPad.quickOrderPad')}
          </Typography>

          <SearchProduct addToList={handleSearchAdditions} />

          <Divider sx={dividerStyles} />

          <QuickAdd quickAddToList={handleQuickAddToList} />

          <Divider sx={{ ...dividerStyles, marginTop: isMobile ? '24px' : '32px' }} />

          <Box
            sx={{
              margin: '20px 0 0',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <CustomButton
              variant="text"
              onClick={() => handleOpenUploadDiag()}
              sx={{
                textTransform: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#0067A0',
                width: '100%',
                padding: 0,
              }}
            >
              <Box
                component="svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 16V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V16M16 8L12 4M12 4L8 8M12 4V16"
                  stroke="#0067A0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Box>
              {b3Lang('purchasedProducts.quickOrderPad.bulkUploadCSV')}
            </CustomButton>
          </Box>
        </Box>
      </CardContent>

      <B3Upload
        isOpen={isOpenBulkLoadCSV}
        setIsOpen={setIsOpenBulkLoadCSV}
        handleAddToList={backendValidationEnabled ? handleBackendUploadAdditions : handleUploadAdditions}
        setProductData={setProductData}
        addBtnText={addBtnText}
        isLoading={isLoading}
      />
    </Card>
  );
}
