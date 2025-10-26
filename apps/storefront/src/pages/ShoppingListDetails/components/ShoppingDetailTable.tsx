import {
  Dispatch,
  forwardRef,
  Ref,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Delete, Edit, StickyNote2 } from '@mui/icons-material';
import { Box, Grid, styled, Typography } from '@mui/material';
import cloneDeep from 'lodash-es/cloneDeep';

import {
  B3PaginationTable,
  GetRequestList,
  TableRefreshConfig,
} from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { SectionTitle } from '@/components';
import { useMobile, useSort } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { updateB2BShoppingListsItem, updateBcShoppingListsItem } from '@/shared/service/b2b';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { currencyFormat, snackbar } from '@/utils';
import b2bGetVariantImageByVariantInfo from '@/utils/b2bGetVariantImageByVariantInfo';
import { getBCPrice, getDisplayPrice, getValidOptionsList } from '@/utils/b3Product/b3Product';
import { getProductOptionsFields } from '@/utils/b3Product/shared/config';

import B3FilterSearch from '../../../components/filter/B3FilterSearch';

import ChooseOptionsDialog from './ChooseOptionsDialog';
import ShoppingDetailAddNotes from './ShoppingDetailAddNotes';
import ShoppingDetailCard from './ShoppingDetailCard';

interface ListItem {
  [key: string]: string;
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
  productNote: string;
  disableCurrentCheckbox?: boolean;
}

interface ListItemProps {
  node: ProductInfoProps;
}

interface ShoppingDetailTableProps {
  shoppingListInfo: any;
  isRequestLoading: boolean;
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>;
  shoppingListId: number | string;
  getShoppingListDetails: GetRequestList<SearchProps, CustomFieldItems>;
  setCheckedArr: (values: CustomFieldItems) => void;
  isReadForApprove: boolean;
  isJuniorApprove: boolean;
  allowJuniorPlaceOrder: boolean;
  setDeleteItemId: (itemId: number | string) => void;
  setDeleteOpen: (open: boolean) => void;
  isB2BUser: boolean;
  productQuoteEnabled: boolean;
  isCanEditShoppingList: boolean;
  role: number | string;
}

interface SearchProps {
  search?: string;
  first?: number;
  offset?: number;
  orderBy: string;
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void;
  setList: (items?: ListItemProps[]) => void;
  getSelectedValue: () => void;
  refresh: (type?: TableRefreshConfig) => void;
}

const StyledShoppingListTableContainer = styled('div')(() => ({
  backgroundColor: '#FFFFFF',
  padding: '1rem',
  borderRadius: '4px',
  borderWidth: '0px 0.3px 0.3px 0px',
  borderStyle: 'solid',
  borderColor: '#000000',
  '& thead th': {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  },
  '& tbody': {
    '& tr': {
      '& td': {
        verticalAlign: 'top',
        fontFamily: 'Lato, sans-serif',
        fontWeight: 600,
        fontSize: '14px',
        lineHeight: '20px',
        color: '#000000',
      },
      '& td:first-of-type': {
        paddingTop: '25px',
      },
    },
    '& tr: hover': {
      '& #shoppingList-actionList': {
        opacity: 1,
      },
    },
  },
}));

const StyledImage = styled('img')(() => ({
  maxWidth: '85px',
  maxHeight: '85px',
  height: 'auto',
  marginRight: '0.5rem',
}));

const QuantityControlsContainer = styled('div')(() => ({
  display: 'inline-flex',
  alignItems: 'stretch',
  height: '40px',
}));

const quantityButtonBaseStyles = {
  width: '27px',
  backgroundColor: '#E6E6E6',
  borderTop: '0.2px solid #000000',
  borderBottom: '0.2px solid #000000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
  position: 'relative',
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
} as const;

const QuantityMinusButton = styled('button')(() => ({
  ...quantityButtonBaseStyles,
  borderLeft: '0.2px solid #000000',
  borderRight: '0px',
}));

const QuantityPlusButton = styled('button')(() => ({
  ...quantityButtonBaseStyles,
  borderLeft: '0px',
  borderRight: '0.2px solid #000000',
}));

const MinusSign = styled('span')(() => ({
  width: '14px',
  height: '2px',
  backgroundColor: '#0067A0',
  position: 'absolute',
  top: 'calc(50% - 1px)',
  left: 'calc(50% - 7px)',
}));

const PlusSign = styled('span')(() => ({
  position: 'absolute',
  width: '14px',
  height: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: "''",
    position: 'absolute',
    width: '14px',
    height: '2px',
    backgroundColor: '#0067A0',
  },
  '&::after': {
    content: "''",
    position: 'absolute',
    width: '2px',
    height: '14px',
    backgroundColor: '#0067A0',
  },
}));

const QuantityInput = styled('input')(() => ({
  width: '64px',
  backgroundColor: '#E6E6E6',
  borderLeft: '0px',
  borderRight: '0px',
  borderTop: '0.2px solid #000000',
  borderBottom: '0.2px solid #000000',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '20px',
  lineHeight: '28px',
  textAlign: 'center',
  verticalAlign: 'middle',
  color: '#000000',
  height: '40px',
  outline: 'none',
  padding: 0,
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  '&::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '&::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '&[type=number]': {
    MozAppearance: 'textfield',
  },
}));

const defaultSortKey = 'updatedAt';

const sortKeys = {
  Product: 'productName',
  updatedAt: 'updatedAt',
  Qty: 'quantity',
};

function ShoppingDetailTable(props: ShoppingDetailTableProps, ref: Ref<unknown>) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const {
    shoppingListInfo,
    isRequestLoading,
    setIsRequestLoading,
    shoppingListId,
    getShoppingListDetails,
    setCheckedArr,
    isReadForApprove,
    setDeleteItemId,
    setDeleteOpen,
    isJuniorApprove,
    isB2BUser,
    allowJuniorPlaceOrder,
    productQuoteEnabled,
    isCanEditShoppingList,
    role,
  } = props;

  const showInclusiveTaxPrice = useAppSelector(({ global }) => global.showInclusiveTaxPrice);

  const { shoppingListCreateActionsPermission, submitShoppingListPermission } =
    useAppSelector(rolePermissionSelector);

  const canShoppingListActions = isB2BUser
    ? shoppingListCreateActionsPermission && isCanEditShoppingList
    : true;
  const b2bAndBcShoppingListActionsPermissions = isB2BUser ? canShoppingListActions : true;
  const b2bSubmitShoppingListPermission = isB2BUser
    ? submitShoppingListPermission
    : Number(role) === 2;

  const paginationTableRef = useRef<PaginationTableRefProps | null>(null);

  const [chooseOptionsOpen, setSelectedOptionsOpen] = useState(false);
  const [optionsProduct, setOptionsProduct] = useState<any>(null);
  const [editProductItemId, setEditProductItemId] = useState<number | string | null>(null);
  const [search, setSearch] = useState<SearchProps>({
    orderBy: `-${sortKeys[defaultSortKey]}`,
  });
  const [qtyNotChangeFlag, setQtyNotChangeFlag] = useState<boolean>(true);
  const [originProducts, setOriginProducts] = useState<ListItemProps[]>([]);
  const [shoppingListTotalPrice, setShoppingListTotalPrice] = useState<number>(0.0);

  const [addNoteOpen, setAddNoteOpen] = useState<boolean>(false);
  const [addNoteItemId, setAddNoteItemId] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');
  const [disabledSelectAll, setDisabledSelectAll] = useState<boolean>(false);

  const [priceHidden, setPriceHidden] = useState<boolean>(false);

  const [handleSetOrderBy, order, orderBy] = useSort(sortKeys, defaultSortKey, search, setSearch);

  const handleUpdateProductQty = (id: number | string, value: number | string) => {
    if (Number(value) < 0) return false;
    const currentItem = originProducts.find((item: ListItemProps) => {
      const { node } = item;

      return node.id === id;
    });

    const currentQty = currentItem?.node?.quantity || '';
    const isSameQuantity = Number(currentQty) === Number(value);
    setQtyNotChangeFlag(isSameQuantity);

    const listItems: ListItemProps[] = paginationTableRef.current?.getList() || [];
    const newListItems = listItems?.map((item: ListItemProps) => {
      const { node } = item;
      if (node?.id === id) {
        node.quantity = `${Number(value)}`;
        node.disableCurrentCheckbox = Number(value) === 0;
      }

      return item;
    });

    const nonNumberProducts = newListItems.filter(
      (item: ListItemProps) => Number(item.node.quantity) === 0,
    );
    setDisabledSelectAll(nonNumberProducts.length === newListItems.length);
    paginationTableRef.current?.setList([...newListItems]);

    return !isSameQuantity;
  };

  const initSearch = (type?: TableRefreshConfig) => {
    paginationTableRef.current?.refresh(type);
  };

  useImperativeHandle(ref, () => ({
    initSearch,
    getList: () => paginationTableRef.current?.getList(),
    setList: () => paginationTableRef.current?.setList(),
    getSelectedValue: () => paginationTableRef.current?.getSelectedValue(),
  }));

  const handleSearchProduct = async (q: string) => {
    setSearch({
      ...search,
      search: q,
    });
  };

  const handleChooseOptionsDialogCancel = () => {
    setEditProductItemId('');
    setSelectedOptionsOpen(false);
  };

  const handleOpenProductEdit = (product: any, _: number | string, itemId: number | string) => {
    setEditProductItemId(itemId);
    setOptionsProduct(product);
    setSelectedOptionsOpen(true);
  };

  const handleChooseOptionsDialogConfirm = async (products: CustomFieldItems[]) => {
    setIsRequestLoading(true);
    const updateShoppingListItem = isB2BUser
      ? updateB2BShoppingListsItem
      : updateBcShoppingListsItem;
    try {
      const newOptionLists = getValidOptionsList(products[0].newSelectOptionList, products[0]);
      const data = {
        itemId: editProductItemId,
        shoppingListId,
        itemData: {
          variantId: products[0].variantId,
          quantity: products[0].quantity,
          optionList: newOptionLists || [],
        },
      };

      await updateShoppingListItem(data);
      setSelectedOptionsOpen(false);
      setEditProductItemId('');
      snackbar.success(b3Lang('shoppingList.table.productUpdated'));
      initSearch({ keepCheckedItems: true });
    } finally {
      setIsRequestLoading(false);
    }
  };

  const handleUpdateShoppingListItem = async (itemId: number | string) => {
    const listItems: ListItemProps[] = paginationTableRef.current?.getList() || [];
    const currentItem = listItems.find((item: ListItemProps) => {
      const { node } = item;

      return node.itemId === itemId;
    });
    let currentNode;

    if (currentItem) {
      currentNode = currentItem.node;
    }

    const options = JSON.parse(currentNode?.optionList || '[]');

    const optionsList = options.map(
      (option: { option_id: number | string; option_value: number | string }) => ({
        optionId: option.option_id,
        optionValue: option.option_value,
      }),
    );

    const itemData: CustomFieldItems = {
      variantId: currentNode?.variantId,
      quantity: currentNode?.quantity ? Number(currentNode.quantity) : 0,
      optionList: optionsList || [],
      productNote: notes,
    };

    const data = {
      itemId,
      shoppingListId,
      itemData,
    };

    const updateShoppingListItem = isB2BUser
      ? updateB2BShoppingListsItem
      : updateBcShoppingListsItem;

    await updateShoppingListItem(data);
  };

  const handleUpdateShoppingListItemQty = async (
    itemId: number | string,
    options?: { force?: boolean },
  ) => {
    if (!options?.force && qtyNotChangeFlag) return;
    setIsRequestLoading(true);
    try {
      await handleUpdateShoppingListItem(itemId);
      snackbar.success(b3Lang('shoppingList.table.quantityUpdated'));
      setQtyNotChangeFlag(true);
      initSearch({ keepCheckedItems: true });
    } finally {
      setIsRequestLoading(false);
    }
  };

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getList() || [];
      const checkedItems: CustomFieldItems[] = [];
      selectCheckbox.forEach((item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const { node } = product;

          return node.id === item;
        });

        if (newItems) checkedItems.push(newItems);
      });

      setCheckedArr([...checkedItems]);
    } else {
      setCheckedArr([]);
    }
  };

  const handleCancelAddNotesClick = () => {
    setAddNoteOpen(false);
    setAddNoteItemId('');
    setNotes('');
  };

  const handleAddItemNotesClick = async () => {
    setIsRequestLoading(true);
    try {
      handleCancelAddNotesClick();
      await handleUpdateShoppingListItem(addNoteItemId);
      snackbar.success(b3Lang('shoppingList.table.productNotesUpdated'));
      initSearch({ keepCheckedItems: true });
    } finally {
      setIsRequestLoading(false);
    }
  };

  useEffect(() => {
    if (shoppingListInfo) {
      const {
        products: { edges },
        grandTotal,
        totalTax,
      } = shoppingListInfo;

      const NewShoppingListTotalPrice = showInclusiveTaxPrice
        ? Number(grandTotal)
        : Number(grandTotal) - Number(totalTax) || 0.0;

      const isPriceHidden = edges.some((item: CustomFieldItems) => {
        if (item?.node?.productsSearch) {
          return item.node.productsSearch?.isPriceHidden || false;
        }

        return false;
      });

      setPriceHidden(isPriceHidden);
      setOriginProducts(cloneDeep(edges));
      setShoppingListTotalPrice(NewShoppingListTotalPrice);
    }
  }, [shoppingListInfo, showInclusiveTaxPrice]);

  useEffect(() => {
    if (shoppingListInfo) {
      const {
        products: { edges },
      } = shoppingListInfo;
      const nonNumberProducts = edges.filter((item: ListItemProps) => item.node.quantity === 0);
      setDisabledSelectAll(nonNumberProducts.length === edges.length);
    }
  }, [shoppingListInfo]);

  const showPrice = (price: string, row: CustomFieldItems): string | number => {
    const {
      productsSearch: { isPriceHidden },
    } = row;
    if (isPriceHidden) return '';
    return getDisplayPrice({
      price,
      productInfo: row,
      showText: isPriceHidden ? '' : price,
      forcedSkip: true,
    });
  };

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: b3Lang('shoppingList.table.product'),
      render: (row: CustomFieldItems) => {
        const product: any = {
          ...row.productsSearch,
          selectOptions: row.optionList,
        };
        const productFields = getProductOptionsFields(product, {});

        const optionList = JSON.parse(row.optionList);
        const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText);

        const currentVariants = product.variants || [];
        const currentImage =
          b2bGetVariantImageByVariantInfo(currentVariants, {
            variantId: row.variantId,
            variantSku: row.variantSku,
          }) || row.primaryImage;

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={currentImage || PRODUCT_DEFAULT_IMAGE}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography
                variant="body1"
                onClick={() => {
                  const {
                    location: { origin },
                  } = window;

                  window.location.href = `${origin}${row.productUrl}`;
                }}
                sx={{
                  cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#000000',
                }}
              >
                {row.productName}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#000000',
                }}
              >
                {row.variantSku}
              </Typography>
              {optionList.length > 0 && optionsValue.length > 0 && (
                <Box>
                  {optionsValue.map((option: any) => (
                    <Typography
                      sx={{
                        fontFamily: 'Lato, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#000000',
                      }}
                      key={option.valueLabel}
                    >
                      {`${option.valueLabel}: ${option.valueText}`}
                    </Typography>
                  ))}
                </Box>
              )}

              {row?.productNote && row?.productNote.trim().length > 0 && (
                <Typography
                  sx={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 600,
                    color: '#ED6C02',
                    marginTop: '0.3rem',
                  }}
                >
                  {row.productNote}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
      width: '45%',
      isSortable: true,
    },
    {
      key: 'Price',
      title: b3Lang('shoppingList.table.price'),
      render: (row: CustomFieldItems) => {
        const { basePrice, taxPrice = 0 } = row;
        const inTaxPrice = getBCPrice(Number(basePrice), Number(taxPrice));

        return (
          <Typography
            sx={{
              padding: '12px 0',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#000000',
            }}
          >
            {showPrice(currencyFormat(inTaxPrice), row)}
          </Typography>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'Qty',
      title: b3Lang('shoppingList.table.quantity'),
      render: (row) => {
        const isQuantityDisabled = b2bAndBcShoppingListActionsPermissions
          ? isReadForApprove || isJuniorApprove
          : true;
        const numericQuantity = Number(row.quantity) || 0;

        return (
          <QuantityControlsContainer>
            <QuantityMinusButton
              type="button"
              disabled={isQuantityDisabled || numericQuantity <= 0}
              onClick={() => {
                const nextValue = numericQuantity - 1;
                if (nextValue < 0) return;
                const hasChanged = handleUpdateProductQty(row.id, nextValue);
                if (hasChanged) {
                  void handleUpdateShoppingListItemQty(row.itemId, { force: true });
                }
              }}
            >
              <MinusSign />
            </QuantityMinusButton>
            <QuantityInput
              type="number"
              disabled={isQuantityDisabled}
              value={row.quantity}
              onChange={(event) => {
                handleUpdateProductQty(row.id, event.target.value);
              }}
              onBlur={() => {
                void handleUpdateShoppingListItemQty(row.itemId);
              }}
            />
            <QuantityPlusButton
              type="button"
              disabled={isQuantityDisabled}
              onClick={() => {
                const nextValue = numericQuantity + 1;
                const hasChanged = handleUpdateProductQty(row.id, nextValue);
                if (hasChanged) {
                  void handleUpdateShoppingListItemQty(row.itemId, { force: true });
                }
              }}
            >
              <PlusSign />
            </QuantityPlusButton>
          </QuantityControlsContainer>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
      isSortable: true,
    },
    {
      key: 'Total',
      title: b3Lang('shoppingList.table.total'),
      render: (row: CustomFieldItems) => {
        const {
          basePrice,
          quantity,
          itemId,
          productsSearch: { options },
          taxPrice = 0,
        } = row;

        const inTaxPrice = getBCPrice(Number(basePrice), Number(taxPrice));

        const totalPrice = inTaxPrice * Number(quantity);

        const optionList = options || JSON.parse(row.optionList);

        const canChangeOption =
          optionList.length > 0 &&
          !isReadForApprove &&
          !isJuniorApprove &&
          b2bAndBcShoppingListActionsPermissions;

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#000000',
              }}
            >
              {showPrice(currencyFormat(totalPrice), row)}
            </Typography>
            <Box
              sx={{
                marginTop: '1rem',
                opacity: 0,
                textAlign: isMobile ? 'end' : 'start',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
              id="shoppingList-actionList"
            >
              {canShoppingListActions && (
                <>
                  <Grid
                    item
                    sx={{
                      marginRight: '0.5rem',
                      minWidth: '32px',
                    }}
                  >
                    <StickyNote2
                      sx={{
                        cursor: 'pointer',
                        color: 'rgba(0, 0, 0, 0.54)',
                      }}
                      onClick={() => {
                        setAddNoteOpen(true);
                        setAddNoteItemId(Number(itemId));

                        if (row.productNote) {
                          setNotes(row.productNote);
                        }
                      }}
                    />
                  </Grid>

                  <Grid
                    item
                    sx={{
                      marginRight: canChangeOption ? '0.5rem' : '',
                      marginLeft: canChangeOption ? '0.3rem' : '',
                    }}
                  >
                    {canChangeOption && (
                      <Edit
                        sx={{
                          cursor: 'pointer',
                          color: 'rgba(0, 0, 0, 0.54)',
                        }}
                        onClick={() => {
                          const { productsSearch, variantId, itemId, optionList, quantity } = row;

                          handleOpenProductEdit(
                            {
                              ...productsSearch,
                              selectOptions: optionList,
                              quantity,
                            },
                            variantId,
                            itemId,
                          );
                        }}
                      />
                    )}
                  </Grid>
                  <Grid
                    item
                    sx={{
                      marginLeft: '0.3rem',
                    }}
                  >
                    {b2bAndBcShoppingListActionsPermissions &&
                      !isReadForApprove &&
                      !isJuniorApprove && (
                        <Delete
                          sx={{
                            cursor: 'pointer',
                            color: 'rgba(0, 0, 0, 0.54)',
                          }}
                          onClick={() => {
                            setDeleteOpen(true);
                            setDeleteItemId(Number(itemId));
                          }}
                        />
                      )}
                  </Grid>
                </>
              )}
            </Box>
          </Box>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
  ];

  return (
    <StyledShoppingListTableContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 1rem 0',
        }}
      >
        <SectionTitle
          component="h2"
          sx={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 400,
            fontSize: '20px',
            lineHeight: '28px',
            color: '#000000',
          }}
        >
          {b3Lang('shoppingList.table.totalProductCount', {
            quantity: shoppingListInfo?.products?.totalCount || 0,
          })}
        </SectionTitle>
        <Typography
          sx={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 400,
            fontSize: '20px',
            lineHeight: '28px',
            color: '#000000',
          }}
        >
          {priceHidden ? '' : currencyFormat(shoppingListTotalPrice || 0.0)}
        </Typography>
      </Box>
      <Box
        sx={{
          marginBottom: '16px',
          '& .MuiPaper-root': {
            width: '100%',
            minWidth: '100%',
            maxWidth: '100%',
            borderBottom: '0.2px solid #000000',
            borderRadius: '5px',
            backgroundColor: '#E6E6E6',
          },
          '& .MuiInputBase-root': {
            fontFamily: 'Lato, sans-serif !important',
            fontWeight: '600 !important',
            fontSize: '16px !important',
            lineHeight: '24px !important',
            color: '#000000 !important',
          },
          '& .MuiInputBase-input': {
            fontFamily: 'Lato, sans-serif !important',
            fontWeight: '600 !important',
            fontSize: '16px !important',
            lineHeight: '24px !important',
            color: '#000000 !important',
            '&::placeholder': {
              fontFamily: 'Lato, sans-serif !important',
              fontWeight: '600 !important',
              fontSize: '16px !important',
              lineHeight: '24px !important',
              color: '#000000 !important',
              opacity: 1,
            },
          },
        }}
      >
        <B3FilterSearch
          w="100%"
          searchBGColor="rgba(0, 0, 0, 0.06)"
          handleChange={(e) => {
            handleSearchProduct(e);
          }}
        />
      </Box>

      <B3PaginationTable
        ref={paginationTableRef}
        columnItems={columnItems}
        rowsPerPageOptions={[10, 20, 50]}
        getRequestList={getShoppingListDetails}
        searchParams={search}
        isCustomRender={false}
        showCheckbox
        showSelectAllCheckbox
        applyAllDisableCheckbox={false}
        disableCheckbox={
          disabledSelectAll ||
          (b2bSubmitShoppingListPermission
            ? !(allowJuniorPlaceOrder || productQuoteEnabled)
            : (isReadForApprove || isJuniorApprove) && b2bAndBcShoppingListActionsPermissions)
        }
        hover
        labelRowsPerPage={b3Lang('shoppingList.table.itemsPerPage')}
        showBorder={false}
        requestLoading={setIsRequestLoading}
        getSelectCheckbox={getSelectCheckbox}
        itemIsMobileSpacing={0}
        noDataText={b3Lang('shoppingList.table.noProductsFound')}
        sortDirection={order}
        orderBy={orderBy}
        sortByFn={handleSetOrderBy}
        pageType="shoppingListDetailsTable"
        renderItem={(row, index, checkBox) => (
          <ShoppingDetailCard
            len={shoppingListInfo?.products?.edges.length || 0}
            item={row}
            itemIndex={index}
            showPrice={showPrice}
            onEdit={handleOpenProductEdit}
            onDelete={setDeleteItemId}
            checkBox={checkBox}
            setDeleteOpen={setDeleteOpen}
            setAddNoteOpen={setAddNoteOpen}
            setAddNoteItemId={setAddNoteItemId}
            setNotes={setNotes}
            handleUpdateProductQty={handleUpdateProductQty}
            handleUpdateShoppingListItem={handleUpdateShoppingListItemQty}
            isReadForApprove={isReadForApprove || isJuniorApprove}
            b2bAndBcShoppingListActionsPermissions={b2bAndBcShoppingListActionsPermissions}
          />
        )}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        isLoading={isRequestLoading}
        setIsLoading={setIsRequestLoading}
        product={optionsProduct}
        type="shoppingList"
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        isEdit
      />

      <ShoppingDetailAddNotes
        open={addNoteOpen}
        notes={notes}
        setNotes={setNotes}
        handleCancelAddNotesClick={handleCancelAddNotesClick}
        handleAddItemNotesClick={handleAddItemNotesClick}
      />
    </StyledShoppingListTableContainer>
  );
}

export default forwardRef(ShoppingDetailTable);
