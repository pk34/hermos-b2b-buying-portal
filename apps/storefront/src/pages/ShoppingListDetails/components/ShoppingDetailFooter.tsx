import { useContext, useRef, useState } from 'react';
import type { SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Menu, MenuItem, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import Cookies from 'js-cookie';
import { v1 as uuid } from 'uuid';

import CustomButton from '@/components/button/CustomButton';
import { CART_URL, CHECKOUT_URL, PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useFeatureFlags, useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import { getVariantInfoBySkus, searchProducts } from '@/shared/service/b2b/graphql/product';
import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';
import { currencyFormat, snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import {
  addQuoteDraftProducts,
  calculateProductListPrice,
  validProductQty,
} from '@/utils/b3Product/b3Product';
import {
  addLineItems,
  conversionProductsList,
  ProductsProps,
} from '@/utils/b3Product/shared/config';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { createOrUpdateExistingCart, deleteCartData, updateCart } from '@/utils/cartUtils';
import { validateProducts } from '@/utils/validateProducts';

interface ShoppingDetailFooterProps {
  shoppingListInfo: any;
  allowJuniorPlaceOrder: boolean;
  checkedArr: any;
  selectedSubTotal: number;
  setLoading: (val: boolean) => void;
  setDeleteOpen: (val: boolean) => void;
  setValidateFailureProducts: (arr: ProductsProps[]) => void;
  setValidateSuccessProducts: (arr: ProductsProps[]) => void;
  isB2BUser: boolean;
  isCanEditShoppingList: boolean;
  role: string | number;
  backendValidationEnabled: boolean;
}

interface ProductInfoProps {
  basePrice: number | string;
  baseSku: string;
  createdAt: number;
  discount: number | string;
  enteredInclusive: boolean;
  id: number | string;
  itemId: number;
  optionList: string;
  primaryImage: string;
  productId: number;
  productName: string;
  productUrl: string;
  quantity: number | string;
  tax: number | string;
  updatedAt: number;
  variantId: number;
  variantSku: string;
  productsSearch: CustomFieldItems;
}

interface ListItemProps {
  node: ProductInfoProps;
}

const mapToProductsFailedArray = (items: ProductsProps[]) => {
  return items.map((item: ProductsProps) => {
    return {
      ...item,
      isStock: item.node.productsSearch.inventoryTracking === 'none' ? '0' : '1',
      minQuantity: item.node.productsSearch.orderQuantityMinimum,
      maxQuantity: item.node.productsSearch.orderQuantityMaximum,
      stock: item.node.productsSearch.availableToSell,
    };
  });
};

const TrashCanIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={24} height={24} viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19 7.05397L18.1327 19.2892C18.0579 20.3438 17.187 21.1608 16.1378 21.1608H7.86224C6.81296 21.1608 5.94208 20.3438 5.86732 19.2892L5 7.05397M10 11.0845V17.1303M14 11.0845V17.1303M15 7.05397V4.03107C15 3.47457 14.5523 3.02344 14 3.02344H10C9.44772 3.02344 9 3.47457 9 4.03107V7.05397M4 7.05397H20"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DropdownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={20} height={20} viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.29289 7.34786C5.68342 6.95436 6.31658 6.95436 6.70711 7.34786L10 10.6659L13.2929 7.34786C13.6834 6.95436 14.3166 6.95436 14.7071 7.34786C15.0976 7.74137 15.0976 8.37937 14.7071 8.77288L10.7071 12.8034C10.3166 13.1969 9.68342 13.1969 9.29289 12.8034L5.29289 8.77288C4.90237 8.37937 4.90237 7.74137 5.29289 7.34786Z"
      fill="white"
    />
  </svg>
);

function ShoppingDetailFooter(props: ShoppingDetailFooterProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const navigate = useNavigate();
  const featureFlags = useFeatureFlags();

  const {
    state: { productQuoteEnabled = false },
  } = useContext(GlobalContext);
  const companyId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);
  const {
    shoppingListCreateActionsPermission,
    purchasabilityPermission,
    submitShoppingListPermission,
  } = useAppSelector(rolePermissionSelector);
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const cartEntityId = Cookies.get('cartId');

  const {
    shoppingListInfo,
    allowJuniorPlaceOrder,
    checkedArr,
    selectedSubTotal,
    setLoading,
    setDeleteOpen,
    setValidateFailureProducts,
    setValidateSuccessProducts,
    isB2BUser,
    isCanEditShoppingList,
    role,
    backendValidationEnabled,
  } = props;

  const b2bShoppingListActionsPermission = isB2BUser ? shoppingListCreateActionsPermission : true;
  const isCanAddToCart = isB2BUser ? purchasabilityPermission : true;
  const b2bSubmitShoppingListPermission = isB2BUser
    ? submitShoppingListPermission
    : Number(role) === 2;

  const handleOpenBtnList = () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const verifyInventory = (inventoryInfos: ProductsProps[]) => {
    const validateFailureArr: ProductsProps[] = [];
    const validateSuccessArr: ProductsProps[] = [];

    checkedArr.forEach((item: ProductsProps) => {
      const { node } = item;

      const inventoryInfo: CustomFieldItems =
        inventoryInfos.find((option: CustomFieldItems) => option.variantSku === node.variantSku) ||
        {};

      if (inventoryInfo) {
        let isPassVerify = true;
        if (
          inventoryInfo.isStock === '1' &&
          (node?.quantity ? Number(node.quantity) : 0) > inventoryInfo.stock
        )
          isPassVerify = false;

        if (
          inventoryInfo.minQuantity !== 0 &&
          (node?.quantity ? Number(node.quantity) : 0) < inventoryInfo.minQuantity
        )
          isPassVerify = false;

        if (
          inventoryInfo.maxQuantity !== 0 &&
          (node?.quantity ? Number(node.quantity) : 0) > inventoryInfo.maxQuantity
        )
          isPassVerify = false;

        if (isPassVerify) {
          validateSuccessArr.push({
            node,
          });
        } else {
          validateFailureArr.push({
            node: {
              ...node,
            },
            stock: inventoryInfo.stock,
            isStock: inventoryInfo.isStock,
            maxQuantity: inventoryInfo.maxQuantity,
            minQuantity: inventoryInfo.minQuantity,
          });
        }
      }
    });

    return {
      validateFailureArr,
      validateSuccessArr,
    };
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

  const shouldRedirectCheckout = () => {
    if (
      allowJuniorPlaceOrder &&
      b2bSubmitShoppingListPermission &&
      shoppingListInfo?.status === ShoppingListStatus.Approved
    ) {
      window.location.href = CHECKOUT_URL;
    } else {
      snackbar.success(b3Lang('shoppingList.footer.productsAddedToCart'), {
        action: {
          label: b3Lang('shoppingList.reAddToCart.viewCart'),
          onClick: () => {
            if (window.b2b.callbacks.dispatchEvent('on-click-cart-button')) {
              window.location.href = CART_URL;
            }
          },
        },
      });
      b3TriggerCartNumber();
    }
  };

  const handleAddToCartOnFrontend = async () => {
    try {
      const skus: string[] = [];

      let cantPurchase = '';

      checkedArr.forEach((item: ProductsProps) => {
        const { node } = item;

        if (node.productsSearch.availability === 'disabled') {
          cantPurchase += `${node.variantSku},`;
        }

        skus.push(node.variantSku);
      });

      if (cantPurchase) {
        snackbar.error(
          b3Lang('shoppingList.footer.unavailableProducts', {
            skus: cantPurchase.slice(0, -1),
          }),
        );
        return;
      }

      if (skus.length === 0) {
        snackbar.error(
          allowJuniorPlaceOrder
            ? b3Lang('shoppingList.footer.selectItemsToCheckout')
            : b3Lang('shoppingList.footer.selectItemsToAddToCart'),
        );
        return;
      }

      const getInventoryInfos = await getVariantInfoBySkus(skus);

      const { validateFailureArr, validateSuccessArr } = verifyInventory(
        getInventoryInfos?.variantSku || [],
      );

      if (validateSuccessArr.length !== 0) {
        const lineItems = addLineItems(validateSuccessArr);
        const deleteCartObject = deleteCartData(cartEntityId);
        const cartInfo = await getCart();
        let res = null;
        // @ts-expect-error Keeping it like this to avoid breaking changes, will fix in a following commit.
        if (allowJuniorPlaceOrder && cartInfo.length) {
          await deleteCart(deleteCartObject);
          res = await updateCart(cartInfo, lineItems);
        } else {
          res = await createOrUpdateExistingCart(lineItems);
          b3TriggerCartNumber();
        }
        if (res && res.errors) {
          snackbar.error(res.errors[0].message);
        } else if (validateFailureArr.length === 0) {
          shouldRedirectCheckout();
        }
      }

      setValidateFailureProducts(validateFailureArr);
      setValidateSuccessProducts(validateSuccessArr);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartBackend = async () => {
    const items = checkedArr.map(({ node }: ProductsProps) => {
      return { node };
    });

    try {
      const skus = items.map(({ node }: ProductsProps) => node.variantSku);

      if (skus.length === 0) {
        snackbar.error(
          allowJuniorPlaceOrder
            ? b3Lang('shoppingList.footer.selectItemsToCheckout')
            : b3Lang('shoppingList.footer.selectItemsToAddToCart'),
        );
        return;
      }

      const lineItems = addLineItems(items);
      const deleteCartObject = deleteCartData(items);
      const cartInfo = await getCart();
      if (allowJuniorPlaceOrder && cartInfo.data.site.cart) {
        await deleteCart(deleteCartObject);
        await updateCart(cartInfo, lineItems);
      } else {
        await createOrUpdateExistingCart(lineItems);
        b3TriggerCartNumber();
      }
      shouldRedirectCheckout();
      setValidateSuccessProducts(items);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setValidateFailureProducts(mapToProductsFailedArray(items));
        snackbar.error(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add selected product to cart
  const handleAddProductsToCart = async () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
      return;
    }

    handleClose();

    setLoading(true);

    if (backendValidationEnabled) {
      await handleAddToCartBackend();
    } else {
      await handleAddToCartOnFrontend();
    }
  };

  // Add selected to quote
  const getOptionsList = (options: []) => {
    if (options?.length === 0) return [];

    const option = options.map(
      ({
        option_id: optionId,
        option_value: optionValue,
      }: {
        option_id: string | number;
        option_value: string | number;
      }) => ({
        optionId,
        optionValue,
      }),
    );

    return option;
  };

  const handleAddSelectedToQuote = async () => {
    if (checkedArr.length === 0) {
      snackbar.error(b3Lang('shoppingList.footer.selectOneItem'));
      return;
    }
    setLoading(true);
    handleClose();
    try {
      const productsWithSku = checkedArr.filter((checkedItem: ListItemProps) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return variantSku !== '' && variantSku !== null && variantSku !== undefined;
      });

      const noSkuProducts = checkedArr.filter((checkedItem: ListItemProps) => {
        const {
          node: { variantSku },
        } = checkedItem;

        return !variantSku;
      });
      if (noSkuProducts.length > 0) {
        snackbar.error(b3Lang('shoppingList.footer.cantAddProductsNoSku'));
      }
      if (noSkuProducts.length === checkedArr.length) return;

      const productIds: number[] = [];
      productsWithSku.forEach((product: ListItemProps) => {
        const { node } = product;

        if (!productIds.includes(Number(node.productId))) {
          productIds.push(Number(node.productId));
        }
      });

      const { productsSearch } = await searchProducts({
        productIds,
        companyId,
        customerGroupId,
      });

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch);
      let errorMessage = '';
      let isFondVariant = true;

      const newProducts: CustomFieldItems[] = [];
      productsWithSku.forEach((product: ListItemProps) => {
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

        const optionsList = getOptionsList(JSON.parse(optionList));

        const currentProductSearch = newProductInfo.find(
          (product: CustomFieldItems) => Number(product.id) === Number(productId),
        );

        const variantItem = currentProductSearch?.variants.find(
          (item: CustomFieldItems) => item.sku === variantSku,
        );

        if (!variantItem) {
          errorMessage = b3Lang('shoppingList.footer.notFoundSku', {
            sku: variantSku,
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
          snackbar.success(b3Lang('shoppingList.footer.productsAddedToQuote'), {
            action: {
              label: b3Lang('shoppingList.footer.viewQuote'),
              onClick: () => {
                navigate('/quoteDraft');
              },
            },
          });
        }
      } else {
        snackbar.error(b3Lang('shoppingList.footer.productsLimit'), {
          action: {
            label: b3Lang('shoppingList.footer.viewQuote'),
            onClick: () => {
              navigate('/quoteDraft');
            },
          },
        });
      }
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      setLoading(false);
    }
  };

  const buttons = {
    adSelectedToCart: {
      name: b3Lang('shoppingList.footer.addToCart'),
      key: 'add-selected-to-cart',
      handleClick: handleAddProductsToCart,
      isDisabled: false,
    },
    proceedToCheckout: {
      name: b3Lang('shoppingList.footer.proceedToCheckout'),
      key: 'add-select-to-checkout',
      handleClick: handleAddProductsToCart,
      isDisabled: false,
    },
    addSelectedToQuote: {
      name: b3Lang('shoppingList.footer.addToQuote'),
      key: 'add-selected-to-quote',
      handleClick: handleAddSelectedToQuote,
      isDisabled: false,
    },
  };

  const allowButtonList = () => {
    if (!(shoppingListInfo?.status === ShoppingListStatus.Approved || !isB2BUser)) return [];

    if (!isCanAddToCart && isB2BUser)
      return productQuoteEnabled ? [buttons.addSelectedToQuote] : [];

    if (b2bSubmitShoppingListPermission) {
      if (allowJuniorPlaceOrder && productQuoteEnabled) {
        return [buttons.proceedToCheckout, buttons.addSelectedToQuote];
      }

      if (allowJuniorPlaceOrder) return [buttons.proceedToCheckout];
      if (productQuoteEnabled) {
        return [buttons.addSelectedToQuote];
      }
      return [];
    }

    return productQuoteEnabled
      ? [buttons.adSelectedToCart, buttons.addSelectedToQuote]
      : [buttons.adSelectedToCart];
  };

  const buttonList = allowButtonList();

  const showDeleteButton =
    !allowJuniorPlaceOrder && isCanEditShoppingList && b2bShoppingListActionsPermission;
  const isDeleteDisabled = shoppingListInfo?.status === ShoppingListStatus.ReadyForApproval;
  const sharedActionButtonStyles: SxProps<Theme> = {
    width: isMobile ? '100%' : 'auto',
    height: '40px',
    borderRadius: '5px',
    padding: '10px',
    backgroundColor: '#0067A0',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '20px',
    color: '#FFFFFF',
    textTransform: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: 'none',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: '#00965E',
    },
    '&:focus-visible': {
      backgroundColor: '#00965E',
    },
    '&:active': {
      backgroundColor: '#00965E',
    },
    '& .MuiButton-endIcon': {
      marginLeft: '10px',
      '& svg': {
        width: '20px',
        height: '20px',
      },
    },
  };
  const menuItemStyles: SxProps<Theme> = {
    width: '352px',
    height: '44px',
    padding: '10px',
    backgroundColor: '#F5F5F5',
    boxShadow: '0px 4px 22px 5px #0000001A',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 4px 22px 5px #0000001A',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
        padding: isMobile ? '12px 16px' : '0 24px',
        minHeight: '59px',
        height: isMobile ? 'auto' : '59px',
        gap: isMobile ? '12px' : 0,
        marginTop: 0,
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Lato, sans-serif',
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          color: '#000000',
          flexShrink: 0,
          width: isMobile ? '100%' : 'auto',
        }}
      >
        {b3Lang('shoppingList.footer.selectedProducts', {
          quantity: checkedArr.length,
        })}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: isMobile ? 0 : 'auto',
          marginRight: isMobile ? 0 : 'auto',
          flex: isMobile ? '1 1 100%' : '0 1 auto',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#000000',
            textAlign: 'center',
          }}
        >
          {b3Lang('shoppingList.footer.subtotal', {
            subtotal: currencyFormat(selectedSubTotal),
          })}
        </Typography>
        {showDeleteButton && (
          <Box
            component="button"
            type="button"
            disabled={isDeleteDisabled}
            onClick={() => {
              if (!isDeleteDisabled) {
                setDeleteOpen(true);
              }
            }}
            sx={{
              marginLeft: '18px',
              border: 0,
              padding: 0,
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
              opacity: isDeleteDisabled ? 0.4 : 1,
              color: '#F70000',
              transition: 'color 0.2s ease-in-out',
              '&:not(:disabled):hover': {
                color: '#B00000',
              },
              '&:focus-visible': {
                outline: '2px solid #B00000',
                outlineOffset: '2px',
              },
            }}
          >
            <TrashCanIcon />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'flex-end',
          width: isMobile ? '100%' : 'auto',
          marginLeft: isMobile ? 0 : '16px',
          gap: isMobile ? '12px' : '16px',
          flexShrink: 0,
        }}
      >
        {buttonList.length ? (
          <>
            {buttonList.length === 1 && buttonList[0] && (
              <CustomButton
                variant="contained"
                onClick={buttonList[0].handleClick}
                disabled={buttonList[0].isDisabled}
                sx={sharedActionButtonStyles}
              >
                {buttonList[0].name}
              </CustomButton>
            )}
            {buttonList.length > 1 && (
              <>
                <CustomButton
                  variant="contained"
                  onClick={handleOpenBtnList}
                  ref={ref}
                  sx={sharedActionButtonStyles}
                  endIcon={<DropdownIcon />}
                >
                  {b3Lang('shoppingList.footer.addSelectedTo')}
                </CustomButton>
                <Menu
                  id="basic-menu"
                  anchorEl={ref.current}
                  open={isOpen}
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                >
                  {buttonList.length > 1 &&
                    buttonList
                      .filter((button) => {
                        if (button.key === 'add-selected-to-cart') {
                          // Temporarily hide "Add selected to cart" option until design confirms usage.
                          return false;
                        }

                        return true;
                      })
                      .map((button) => (
                        <MenuItem
                          key={button.key}
                          onClick={() => {
                            handleClose();
                            button.handleClick();
                          }}
                          sx={menuItemStyles}
                        >
                          {button.name}
                        </MenuItem>
                      ))}
                </Menu>
              </>
            )}
          </>
        ) : null}
      </Box>
    </Box>
  );
}

export default ShoppingDetailFooter;
