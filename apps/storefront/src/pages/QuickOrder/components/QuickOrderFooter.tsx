import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Menu, MenuItem, SvgIcon, Typography, useMediaQuery } from '@mui/material';
import uniq from 'lodash-es/uniq';
import { v1 as uuid } from 'uuid';

import CustomButton from '@/components/button/CustomButton';
import { CART_URL, PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useFeatureFlags, useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchProducts,
} from '@/shared/service/b2b';
import { activeCurrencyInfoSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { Product } from '@/types';
import { currencyFormat, getProductPriceIncTaxOrExTaxBySetting, snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import {
  addQuoteDraftProducts,
  calculateProductListPrice,
  getValidOptionsList,
  validProductQty,
} from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { createOrUpdateExistingCart } from '@/utils/cartUtils';
import { validateProducts } from '@/utils/validateProducts';

import CreateShoppingList from '../../OrderDetail/components/CreateShoppingList';
import OrderShoppingList from '../../OrderDetail/components/OrderShoppingList';
import { addCartProductToVerify, CheckedProduct } from '../utils';

interface QuickOrderFooterProps {
  checkedArr: CheckedProduct[];
  isAgenting: boolean;
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>;
  isB2BUser: boolean;
}

const transformToCartLineItems = (productsSearch: Product[], checkedArr: CheckedProduct[]) => {
  const lineItems: CustomFieldItems[] = [];

  checkedArr.forEach((item: CheckedProduct) => {
    const { node } = item;

    const currentProduct: CustomFieldItems | undefined = productsSearch.find(
      (inventory: CustomFieldItems) => Number(node.productId) === inventory.id,
    );
    if (currentProduct) {
      const { variants }: CustomFieldItems = currentProduct;

      if (variants.length > 0) {
        const currentInventoryInfo: CustomFieldItems | undefined = variants.find(
          (variant: CustomFieldItems) =>
            node.variantSku === variant.sku &&
            Number(node.variantId) === Number(variant.variant_id),
        );

        if (currentInventoryInfo) {
          const { optionList, quantity } = node;

          const options = optionList.map((option: CustomFieldItems) => ({
            optionId: option.product_option_id,
            optionValue: option.value,
          }));

          lineItems.push({
            optionSelections: options,
            allOptions: optionList,
            productId: parseInt(currentInventoryInfo.product_id, 10) || 0,
            quantity,
            variantId: parseInt(currentInventoryInfo.variant_id, 10) || 0,
          });
        }
      }
    }
  });

  return lineItems;
};

const QuickOrderFooterArrowIcon = () => (
  <SvgIcon viewBox="0 0 20 21" sx={{ width: 20, height: 21 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.29289 7.34786C5.68342 6.95436 6.31658 6.95436 6.70711 7.34786L10 10.6659L13.2929 7.34786C13.6834 6.95436 14.3166 6.95436 14.7071 7.34786C15.0976 7.74137 15.0976 8.37937 14.7071 8.77288L10.7071 12.8034C10.3166 13.1969 9.68342 13.1969 9.29289 12.8034L5.29289 8.77288C4.90237 8.37937 4.90237 7.74137 5.29289 7.34786Z"
      fill="white"
    />
  </SvgIcon>
);

function QuickOrderFooter(props: QuickOrderFooterProps) {
  const { checkedArr, isAgenting, setIsRequestLoading, isB2BUser } = props;
  const {
    state: { productQuoteEnabled = false, shoppingListEnabled = false },
  } = useContext(GlobalContext);
  const b3Lang = useB3Lang();
  const featureFlags = useFeatureFlags();

  const companyInfoId = useAppSelector((state) => state.company.companyInfo.id);
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);
  const backendValidationEnabled =
    featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'];

  const isShowCartAction = isB2BUser ? purchasabilityPermission : true;

  const isDesktopLimit = useMediaQuery('(min-width:1775px)');
  const [isMobile] = useMobile();
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubTotal, setSelectedSubTotal] = useState(0.0);
  const [openShoppingList, setOpenShoppingList] = useState(false);
  const [isOpenCreateShopping, setIsOpenCreateShopping] = useState(false);
  const [isShoppingListLoading, setIisShoppingListLoading] = useState(false);

  const customerGroupId = useAppSelector((state) => state.company.customer.customerGroupId);

  const navigate = useNavigate();

  const handleOpenBtnList = () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('purchasedProducts.error.selectOneItem'));
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const showAddToCartSuccessMessage = () => {
    snackbar.success(b3Lang('purchasedProducts.footer.productsAdded'), {
      action: {
        label: b3Lang('purchasedProducts.footer.viewCart'),
        onClick: () => {
          if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
            window.location.href = CART_URL;
          }
        },
      },
    });
  };

  const getProductsSearchInfo = async () => {
    const { productsSearch } = await searchProducts({
      productIds: uniq(checkedArr.map(({ node }) => Number(node.productId))),
      companyId: companyInfoId,
      customerGroupId,
    });

    return transformToCartLineItems(productsSearch || [], checkedArr);
  };

  const handleFrontedAddSelectedToCart = async () => {
    try {
      const isPassVerify = await addCartProductToVerify(checkedArr, b3Lang);

      if (!isPassVerify) return;

      const lineItems = await getProductsSearchInfo();

      const res = await createOrUpdateExistingCart(lineItems);

      if (res && !res.errors) {
        showAddToCartSuccessMessage();
      } else if (res && res.errors) {
        snackbar.error(res.errors[0].message);
      } else {
        snackbar.error('Error has occurred');
      }
    } finally {
      b3TriggerCartNumber();
      setIsRequestLoading(false);
    }
  };

  const handleBackendAddSelectedToCart = async () => {
    try {
      const lineItems = await getProductsSearchInfo();
      await createOrUpdateExistingCart(lineItems);
      showAddToCartSuccessMessage();
    } catch (e) {
      if (e instanceof Error) {
        snackbar.error(e.message);
      }
    } finally {
      b3TriggerCartNumber();
      setIsRequestLoading(false);
    }
  };

  const handleAddSelectedToCart = async () => {
    setIsRequestLoading(true);
    handleClose();

    if (backendValidationEnabled) {
      handleBackendAddSelectedToCart();
    } else {
      handleFrontedAddSelectedToCart();
    }
  };

  const getOptionsList = (options: CustomFieldItems) => {
    if (options?.length === 0) return [];

    const option = options.map(
      ({
        product_option_id: optionId,
        value,
      }: {
        product_option_id: number | string;
        value: string | number;
      }) => ({
        optionId: `attribute[${optionId}]`,
        optionValue: value,
      }),
    );

    return option;
  };

  const addToQuote = async (products: CustomFieldItems[]) => {
    if (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend']) {
      const validatedProducts = await validateProducts(products, b3Lang);

      addQuoteDraftProducts(validatedProducts);

      return validatedProducts.length > 0;
    }

    addQuoteDraftProducts(products);

    return true;
  };

  const handleAddSelectedToQuote = async () => {
    setIsRequestLoading(true);
    handleClose();
    try {
      const productsWithSku = checkedArr.filter((checkedItem: CheckedProduct) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return variantSku !== '' && variantSku !== null && variantSku !== undefined;
      });

      const noSkuProducts = checkedArr.filter((checkedItem: CheckedProduct) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return !variantSku;
      });
      if (noSkuProducts.length > 0) {
        snackbar.error(b3Lang('purchasedProducts.footer.cantAddProductsNoSku'));
      }
      if (noSkuProducts.length === checkedArr.length) return;

      const productIds: number[] = [];
      productsWithSku.forEach((product: CheckedProduct) => {
        const { node } = product;

        if (!productIds.includes(Number(node.productId))) {
          productIds.push(Number(node.productId));
        }
      });

      const { productsSearch } = await searchProducts({
        productIds,
        companyId: companyInfoId,
        customerGroupId,
        currencyCode,
      });

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch);
      let errorMessage = '';
      let isFondVariant = true;

      const newProducts: CustomFieldItems[] = [];
      productsWithSku.forEach((product: CheckedProduct) => {
        const {
          node: {
            basePrice,
            optionList,
            variantSku,
            productId,
            productName,
            quantity,
            variantId,
            tax,
          },
        } = product;

        const optionsList = getOptionsList(optionList);

        const currentProductSearch = newProductInfo.find(
          (product: CustomFieldItems) => Number(product.id) === Number(productId),
        );

        const variantItem = currentProductSearch?.variants.find(
          (item: CustomFieldItems) => item.sku === variantSku,
        );

        if (!variantItem) {
          errorMessage = b3Lang('purchasedProducts.footer.notFoundSku', {
            sku: variantSku as string,
          });
          isFondVariant = false;
        }

        const quoteListitem = {
          node: {
            id: uuid(),
            variantSku: variantItem?.sku || variantSku,
            variantId,
            productsSearch: {
              ...currentProductSearch,
              newSelectOptionList: optionsList,
              variantId,
            },
            primaryImage: variantItem?.image_url || PRODUCT_DEFAULT_IMAGE,
            productName,
            quantity: Number(quantity) || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice,
            tax,
          },
        };

        newProducts.push(quoteListitem);
      });

      const isValidQty = validProductQty(newProducts);

      if (!isFondVariant) {
        snackbar.error(errorMessage);

        return;
      }

      if (isValidQty) {
        await calculateProductListPrice(newProducts, '2');

        const success = await addToQuote(newProducts);
        if (success) {
          snackbar.success(b3Lang('purchasedProducts.footer.productsAddedToQuote'), {
            action: {
              label: b3Lang('purchasedProducts.footer.viewQuote'),
              onClick: () => {
                navigate('/quoteDraft');
              },
            },
          });
        }
      } else {
        snackbar.error(b3Lang('purchasedProducts.footer.productsLimit'), {
          action: {
            label: b3Lang('purchasedProducts.footer.viewQuote'),
            onClick: () => {
              navigate('/quoteDraft');
            },
          },
        });
      }
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const gotoShoppingDetail = (id: string | number) => {
    navigate(`/shoppingList/${id}`);
  };

  const handleShoppingClose = (isTrue?: boolean) => {
    if (isTrue) {
      setOpenShoppingList(false);
      setIsOpenCreateShopping(false);
    } else {
      setOpenShoppingList(false);
      setIsOpenCreateShopping(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false);
    setIsOpenCreateShopping(true);
  };

  const handleCloseShoppingClick = () => {
    setIsOpenCreateShopping(false);
    setOpenShoppingList(true);
  };

  const handleCreateShoppingClick = () => {
    handleClose();
    handleCloseShoppingClick();
    setOpenShoppingList(true);
  };

  const handleAddSelectedToShoppingList = async (shoppingListId: string | number) => {
    setIisShoppingListLoading(true);
    try {
      const productIds: number[] = [];
      checkedArr.forEach((product: CheckedProduct) => {
        const { node } = product;

        if (!productIds.includes(Number(node.productId))) {
          productIds.push(Number(node.productId));
        }
      });

      const items: CustomFieldItems = [];

      checkedArr.forEach((product: CheckedProduct) => {
        const {
          node: { optionList, productId, quantity, variantId, productsSearch },
        } = product;

        const optionsList = getOptionsList(optionList);

        const newOptionLists = getValidOptionsList(optionsList, productsSearch);
        items.push({
          productId: Number(productId),
          variantId: Number(variantId),
          quantity: Number(quantity),
          optionList: newOptionLists,
        });
      });

      const addToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList;
      await addToShoppingList({
        shoppingListId: Number(shoppingListId),
        items,
      });

      snackbar.success(b3Lang('purchasedProducts.footer.productsAddedToShoppingList'), {
        action: {
          label: b3Lang('pdp.notification.viewShoppingList'),
          onClick: () => gotoShoppingDetail(shoppingListId),
        },
      });
      handleShoppingClose(true);
    } catch (err) {
      b2bLogger.error(err);
    } finally {
      setIisShoppingListLoading(false);
    }
  };

  const buttonList = [
    // {
    //   name: b3Lang('purchasedProducts.footer.addToCart'),
    //   key: 'add-selected-to-cart',
    //   handleClick: handleAddSelectedToCart,
    //   isDisabled: !isShowCartAction,
    // },
    {
      name: b3Lang('purchasedProducts.footer.addToQuote'),
      key: 'add-selected-to-quote',
      handleClick: handleAddSelectedToQuote,
      isDisabled: !productQuoteEnabled,
    },
    // {
    //   name: b3Lang('purchasedProducts.footer.addSelectedProductsToShoppingList'),
    //   key: 'add-selected-to-shoppingList',
    //   handleClick: handleCreateShoppingClick,
    //   isDisabled: !shoppingListEnabled,
    // },
  ];

  // Preserve hidden handlers for potential future reactivation of cart and shopping list options.
  void handleAddSelectedToCart;

  const hasAvailableActions = buttonList.some((button) => !button.isDisabled);

  useEffect(() => {
    if (checkedArr.length > 0) {
      let total = 0.0;

      checkedArr.forEach((item: CheckedProduct) => {
        const {
          node: {
            variantId,
            productsSearch: { variants },
            quantity,
            basePrice,
          },
        } = item;

        if (variants?.length) {
          const priceIncTax =
            getProductPriceIncTaxOrExTaxBySetting(variants, Number(variantId)) ||
            Number(basePrice || 0);
          total += priceIncTax * Number(quantity);
        } else {
          total += Number(basePrice || 0) * Number(quantity);
        }
      });

      setSelectedSubTotal((1000 * total) / 1000);
    } else {
      setSelectedSubTotal(0.0);
    }
  }, [checkedArr]);

  return (
    <>
      {isShowCartAction || productQuoteEnabled || shoppingListEnabled ? (
        <Box
          sx={{
            position: 'fixed',
            bottom: isMobile && isAgenting ? '52px' : 0,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: 0,
            backgroundColor: '#FFFFFF',
            zIndex: '1000',
          }}
        >
          <Box
            sx={{
              width: isMobile ? '100vw' : 'calc(66.6667% + 32px)',
              maxWidth: isMobile ? '100vw' : isDesktopLimit ? '1775px' : 'calc(66.6667% + 32px)',
              borderStyle: 'solid',
              borderColor: '#000000',
              borderWidth: '0px 0.3px 0.3px 0px',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'space-between',
                gap: isMobile ? '16px' : '32px',
                height: isMobile ? 'auto' : '59px',
                padding: isMobile ? '16px 20px' : '10px 32px',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: isMobile ? '20px' : '24px',
                  color: '#000000',
                  textAlign: isMobile ? 'center' : 'left',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {b3Lang('purchasedProducts.footer.selectedProducts', {
                  quantity: checkedArr.length,
                })}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: isMobile ? 600 : 700,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#000000',
                  textAlign: 'center',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {b3Lang('purchasedProducts.footer.subtotal', {
                  subtotal: currencyFormat(selectedSubTotal),
                })}
              </Typography>
              <Box
                sx={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'flex',
                  justifyContent: isMobile ? 'center' : 'flex-end',
                }}
              >
                <CustomButton
                  id="quick-order-footer-button"
                  variant="contained"
                  ref={ref}
                  onClick={handleOpenBtnList}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '5px',
                    padding: '10px 20px',
                    minHeight: '40px',
                    backgroundColor: '#0067A0',
                    textTransform: 'none',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#FFFFFF',
                    '&:hover': {
                      backgroundColor: '#00965E',
                    },
                  }}
                  disabled={!hasAvailableActions}
                  endIcon={<QuickOrderFooterArrowIcon />}
                >
                  {b3Lang('purchasedProducts.footer.addSelectedTo')}
                </CustomButton>
                <Menu
                  id="quick-order-footer-menu"
                  anchorEl={ref.current}
                  open={isOpen && hasAvailableActions}
                  onClose={handleClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  MenuListProps={{
                    'aria-labelledby': 'quick-order-footer-button',
                  }}
                  PaperProps={{
                    sx: {
                      width: isMobile ? '100vw' : '352px',
                      maxWidth: isMobile ? '100vw' : '352px',
                      backgroundColor: '#F5F5F5',
                      borderRadius: '5px',
                      boxShadow: 'none',
                      left: isMobile ? '0 !important' : undefined,
                      right: isMobile ? '0 !important' : undefined,
                    },
                  }}
                >
                  {buttonList.length > 0 &&
                    buttonList.map((button) => {
                      if (button.isDisabled) return null;

                      return (
                        <MenuItem
                          key={button.key}
                          onClick={() => {
                            button.handleClick();
                          }}
                          sx={{
                            fontFamily: 'Lato, sans-serif',
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#000000',
                          }}
                        >
                          {button.name}
                        </MenuItem>
                      );
                    })}
                </Menu>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}

      <OrderShoppingList
        isOpen={openShoppingList}
        dialogTitle={b3Lang('purchasedProducts.footer.addToShoppingList')}
        onClose={handleShoppingClose}
        onConfirm={handleAddSelectedToShoppingList}
        onCreate={handleOpenCreateDialog}
        isLoading={isShoppingListLoading}
        setLoading={setIisShoppingListLoading}
      />

      <CreateShoppingList
        open={isOpenCreateShopping}
        onChange={handleCreateShoppingClick}
        onClose={handleCloseShoppingClick}
      />
    </>
  );
}

export default QuickOrderFooter;
