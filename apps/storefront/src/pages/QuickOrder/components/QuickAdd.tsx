import { KeyboardEventHandler, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';

import { B3CustomForm } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { useBlockPendingAccountViewPrice, useFeatureFlags } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { getVariantInfoBySkus } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import { getQuickAddRowFields } from '@/utils/b3Product/shared/config';
import { validateProducts } from '@/utils/validateProducts';

import { ShoppingListAddProductOption, SimpleObject } from '../../../types';
import { getCartProductInfo } from '../utils';

interface AddToListContentProps {
  quickAddToList: (products: CustomFieldItems[]) => CustomFieldItems;
}

const LEVEL = 3;

const parseOptionList = (options: string[] | undefined): ShoppingListAddProductOption[] => {
  return (options || []).reduce((arr: ShoppingListAddProductOption[], optionStr: string) => {
    try {
      const option = typeof optionStr === 'string' ? JSON.parse(optionStr) : optionStr;
      arr.push({
        optionId: `attribute[${option.option_id}]`,
        optionValue: `${option.id}`,
      });
      return arr;
    } catch (error) {
      return arr;
    }
  }, []);
};

export default function QuickAdd(props: AddToListContentProps) {
  const b3Lang = useB3Lang();
  const { quickAddToList } = props;
  const buttonText = b3Lang('purchasedProducts.quickOrderPad.addProductsToCart');
  const featureFlags = useFeatureFlags();

  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const [rows, setRows] = useState(LEVEL);
  const [formFields, setFormFields] = useState<CustomFieldItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loopRows = (rows: number, fn: (index: number) => void) => {
    new Array(rows).fill(1).forEach((_, index) => fn(index));
  };

  useEffect(() => {
    let formFields: CustomFieldItems[] = [];
    loopRows(rows, (index) => {
      formFields = [...formFields, ...getQuickAddRowFields(index, b3Lang)];
    });
    setFormFields(formFields);
  }, [b3Lang, rows]);

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const handleAddRowsClick = () => {
    setRows(rows + LEVEL);
  };

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    mode: 'all',
  });

  const validateSkuInput = (index: number, sku: string, qty: string) => {
    if (!sku && !qty) {
      return true;
    }

    let isValid = true;
    const quantity = parseInt(qty, 10) || 0;

    if (!sku) {
      setError(`sku-${index}`, {
        type: 'manual',
        message: b3Lang('global.validate.required', {
          label: b3Lang('purchasedProducts.quickAdd.sku'),
        }),
      });
      isValid = false;
    }

    if (!qty) {
      setError(`qty-${index}`, {
        type: 'manual',
        message: b3Lang('global.validate.required', {
          label: b3Lang('purchasedProducts.quickAdd.qty'),
        }),
      });
      isValid = false;
    } else if (quantity <= 0) {
      setError(`qty-${index}`, {
        type: 'manual',
        message: 'incorrect number',
      });
      isValid = false;
    }

    return isValid;
  };

  const getProductData = (value: CustomFieldItems) => {
    const skuValue: SimpleObject = {};
    let isValid = true;
    loopRows(rows, (index) => {
      const sku = value[`sku-${index}`];
      const qty = value[`qty-${index}`];

      isValid = validateSkuInput(index, sku, qty) === false ? false : isValid;

      if (isValid && sku) {
        const quantity = parseInt(qty, 10) || 0;
        skuValue[sku] = skuValue[sku] ? (skuValue[sku] as number) + quantity : quantity;
      }
    });

    return {
      skuValue,
      isValid,
      skus: Object.keys(skuValue),
    };
  };

  const getProductItems = async (
    variantInfoList: CustomFieldItems,
    skuValue: SimpleObject,
    skus: string[],
  ) => {
    const notFoundSku: string[] = [];
    const notPurchaseSku: string[] = [];
    const productItems: CustomFieldItems[] = [];
    const passSku: string[] = [];
    const notStockSku: {
      sku: string;
      stock: number;
    }[] = [];
    const orderLimitSku: {
      sku: string;
      min: number;
      max: number;
    }[] = [];

    const cartProducts = await getCartProductInfo();

    skus.forEach((sku) => {
      const variantInfo: CustomFieldItems | null = (variantInfoList || []).find(
        (variant: CustomFieldItems) => variant.variantSku.toUpperCase() === sku.toUpperCase(),
      );

      if (!variantInfo) {
        notFoundSku.push(sku);
        return;
      }

      const {
        productId,
        variantId,
        option: options,
        purchasingDisabled = '1',
        stock,
        isStock,
        maxQuantity,
        minQuantity,
        variantSku,
      } = variantInfo;

      const num =
        cartProducts.find(
          (item) =>
            item.sku === variantSku &&
            Number(item?.variantEntityId || 0) === Number(variantId || 0),
        )?.quantity || 0;

      const quantity = (skuValue[sku] as number) || 0;

      const allQuantity = (skuValue[sku] as number) + num || 0;

      if (purchasingDisabled === '1') {
        notPurchaseSku.push(sku);
        return;
      }

      if (isStock === '1' && allQuantity > Number(stock)) {
        notStockSku.push({
          sku,
          stock: Number(stock),
        });

        return;
      }

      if (
        maxQuantity !== 0 &&
        minQuantity !== 0 &&
        allQuantity > 0 &&
        (allQuantity > maxQuantity || allQuantity < minQuantity)
      ) {
        orderLimitSku.push({
          sku,
          min: allQuantity < minQuantity ? minQuantity : 0,
          max: allQuantity > maxQuantity ? maxQuantity : 0,
        });

        return;
      }

      const optionList = parseOptionList(options);

      passSku.push(sku);

      productItems.push({
        ...variantInfo,
        newSelectOptionList: optionList,
        productId: parseInt(productId, 10) || 0,
        quantity,
        variantId: parseInt(variantId, 10) || 0,
      });
    });

    return {
      notFoundSku,
      notPurchaseSku,
      notStockSku,
      productItems,
      passSku,
      orderLimitSku,
    };
  };

  const showErrors = (
    value: CustomFieldItems,
    skus: string[],
    inputType: 'sku' | 'qty',
    message: string,
  ) => {
    skus.forEach((sku) => {
      const skuFieldName = Object.keys(value).find((name) => value[name] === sku) || '';

      if (skuFieldName) {
        setError(skuFieldName.replace('sku', inputType), {
          type: 'manual',
          message,
        });
      }
    });
  };

  const clearInputValue = (value: CustomFieldItems, skus: string[]) => {
    skus.forEach((sku) => {
      const skuFieldName = Object.keys(value).find((name) => value[name] === sku) || '';

      if (skuFieldName) {
        setValue(skuFieldName, '');
        setValue(skuFieldName.replace('sku', 'qty'), '');
      }
    });
  };

  const getVariantList = async (skus: string[]) => {
    try {
      const { variantSku: variantInfoList } = await getVariantInfoBySkus(skus);

      return variantInfoList;
    } catch (error) {
      return [];
    }
  };

  const handleFrontendValidation = async (
    value: CustomFieldItems,
    variantInfoList: CustomFieldItems[],
    skuValue: SimpleObject,
    skus: string[],
  ) => {
    const { notFoundSku, notPurchaseSku, productItems, passSku, notStockSku, orderLimitSku } =
      await getProductItems(variantInfoList, skuValue, skus);

    if (notFoundSku.length > 0) {
      showErrors(value, notFoundSku, 'sku', '');
      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.notFoundSku', {
          notFoundSku: notFoundSku.join(','),
        }),
      );
    }

    if (notPurchaseSku.length > 0) {
      showErrors(value, notPurchaseSku, 'sku', '');
      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.notPurchaseableSku', {
          notPurchaseSku: notPurchaseSku.join(','),
        }),
      );
    }

    if (notStockSku.length > 0) {
      const stockSku = notStockSku.map((item) => item.sku);

      notStockSku.forEach((item) => {
        const { sku, stock } = item;

        showErrors(value, [sku], 'qty', `${stock} in stock`);
      });

      snackbar.error(
        b3Lang('purchasedProducts.quickAdd.insufficientStockSku', {
          stockSku: stockSku.join(','),
        }),
      );
    }

    if (orderLimitSku.length > 0) {
      orderLimitSku.forEach((item) => {
        const { min, max, sku } = item;

        const type = min === 0 ? 'Max' : 'Min';
        const limit = min === 0 ? max : min;
        showErrors(value, [sku], 'qty', `${type} is ${limit}`);

        const typeText = min === 0 ? 'maximum' : 'minimum';
        snackbar.error(
          b3Lang('purchasedProducts.quickAdd.purchaseQuantityLimitMessage', {
            typeText,
            limit,
            sku,
          }),
        );
      });
    }

    return { productItems, passSku };
  };

  const handleAddToList = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(
        'Your business account is pending approval. This feature is currently disabled.',
      );
      return;
    }

    handleSubmit(async (value) => {
      try {
        setIsLoading(true);
        const { skuValue, isValid, skus } = getProductData(value);

        if (!isValid || skus.length <= 0) {
          return;
        }

        const variantInfoList = await getVariantList(skus);
        let productItems: CustomFieldItems[] = [];
        let passSku: string[] = [];

        if (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend']) {
          if (variantInfoList.length <= 0) {
            snackbar.error(
              b3Lang('purchasedProducts.quickAdd.notFoundSku', {
                notFoundSku: skus.join(','),
              }),
            );
            return;
          }
          // Map catalog products to format expected by backend validation
          const productsToValidate = variantInfoList.map((catalogProduct: CustomFieldItems) => {
            const matchingSkuFromInput = Object.keys(skuValue).find(
              (inputSku) => inputSku.toUpperCase() === catalogProduct.variantSku.toUpperCase(),
            );
            const requestedQuantity = matchingSkuFromInput
              ? (skuValue[matchingSkuFromInput] as number)
              : 0;
            return {
              node: {
                productId: parseInt(catalogProduct.productId, 10) || 0,
                quantity: requestedQuantity,
                productsSearch: {
                  variantId: parseInt(catalogProduct.variantId, 10) || 0,
                  newSelectOptionList: parseOptionList(catalogProduct.option),
                },
              },
            };
          });

          const backendValidatedProducts = await validateProducts(productsToValidate, b3Lang);

          productItems = backendValidatedProducts.map(
            ({ node: validatedProduct }: CustomFieldItems) => {
              const originalProductInfo = variantInfoList.find(
                (catalogProduct: CustomFieldItems) =>
                  parseInt(catalogProduct.productId, 10) === validatedProduct.productId,
              );
              return {
                ...originalProductInfo,
                newSelectOptionList: validatedProduct.productsSearch.newSelectOptionList,
                productId: validatedProduct.productId,
                quantity: validatedProduct.quantity,
                variantId: validatedProduct.productsSearch.variantId,
              };
            },
          );

          passSku = backendValidatedProducts
            .map(({ node: validatedProduct }: CustomFieldItems) => {
              const originalProductInfo = variantInfoList.find(
                (catalogProduct: CustomFieldItems) =>
                  parseInt(catalogProduct.productId, 10) === validatedProduct.productId,
              );
              return originalProductInfo?.variantSku || '';
            })
            .filter(Boolean);
        } else {
          ({ productItems, passSku } = await handleFrontendValidation(
            value,
            variantInfoList,
            skuValue,
            skus,
          ));
        }
        if (productItems.length > 0) {
          await quickAddToList(productItems);
          clearInputValue(value, passSku);
        }
      } catch (e) {
        if (e instanceof Error) {
          snackbar.error(e.message);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter') {
      handleAddToList();
    }
  };

  return (
    <B3Spin isSpinning={isLoading} spinningHeight="auto">
      <Box sx={{ width: '100%' }}>
        <Grid
          container
          sx={{
            margin: '24px 0',
          }}
        >
          <Grid
            item
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 400,
                fontSize: '20px',
                lineHeight: '28px',
                color: '#000000',
              }}
            >
              {b3Lang('purchasedProducts.quickAdd.title')}
            </Typography>
          </Grid>
          <Grid item>
            <CustomButton
              variant="text"
              sx={{
                textTransform: 'none',
                ml: '-8px',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#000000',
                textDecoration: 'underline',
                textDecorationStyle: 'solid',
                textDecorationOffset: '0px',
                textDecorationThickness: '1px',
                textDecorationSkipInk: 'auto',
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={handleAddRowsClick}
            >
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                }}
              >
                <Box component="span">
                  {b3Lang('purchasedProducts.quickAdd.showMoreRowsButton')}
                </Box>
                <Box
                  component="svg"
                  width={20}
                  height={21}
                  viewBox="0 0 20 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.29289 14.8203C6.90237 14.4268 6.90237 13.7888 7.29289 13.3953L10.5858 10.0772L7.29289 6.7592C6.90237 6.3657 6.90237 5.7277 7.29289 5.33419C7.68342 4.94069 8.31658 4.94069 8.70711 5.33419L12.7071 9.36473C13.0976 9.75824 13.0976 10.3962 12.7071 10.7897L8.70711 14.8203C8.31658 15.2138 7.68342 15.2138 7.29289 14.8203Z"
                    fill="#0A0A0A"
                  />
                </Box>
              </Box>
            </CustomButton>
          </Grid>
        </Grid>

        <Box
          onKeyDown={handleKeyDown}
          sx={{
            '& label': {
              zIndex: 0,
            },
          }}
        >
          <B3CustomForm
            formFields={formFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>

        <CustomButton
          variant="contained"
          fullWidth
          disabled={isLoading}
          onClick={handleAddToList}
          sx={{
            margin: '20px 0',
            height: '44px',
            borderRadius: '5px',
            padding: '10px',
            backgroundColor: '#0067A0',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#FFFFFF',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#0067A0',
            },
          }}
        >
          <B3Spin isSpinning={isLoading} tip="" size={16}>
            <Box
              sx={{
                flex: 1,
                textAlign: 'center',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              {buttonText}
            </Box>
          </B3Spin>
        </CustomButton>
      </Box>
    </B3Spin>
  );
}
