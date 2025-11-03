import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { Box, styled, Typography } from '@mui/material';

import B3Spin from '@/components/spin/B3Spin';
import {
  B3PaginationTable,
  GetRequestList,
  TableRefreshConfig,
} from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile, useSort } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import {
  currencyFormat,
  displayFormat,
  distanceDay,
  getProductPriceIncTaxOrExTaxBySetting,
} from '@/utils';
import b2bGetVariantImageByVariantInfo from '@/utils/b2bGetVariantImageByVariantInfo';
import { getDisplayPrice } from '@/utils/b3Product/b3Product';

import B3FilterSearch from '../../../components/filter/B3FilterSearch';
import B3Picker from '../../../components/ui/B3Picker';
import { CheckedProduct, QuickOrderListItem } from '../utils';

import QuickOrderCard from './QuickOrderCard';
import QuickOrderQuantitySelector from './QuickOrderQuantitySelector';

interface SearchProps {
  q: string;
  first?: number;
  offset?: number;
  beginDateAt?: Date | string | number;
  endDateAt?: Date | string | number;
  orderBy: string;
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => QuickOrderListItem[];
  getCacheList: () => QuickOrderListItem[];
  setCacheAllList: (items?: QuickOrderListItem[]) => void;
  setList: (items?: QuickOrderListItem[]) => void;
  getSelectedValue: () => void;
  refresh?: (config?: TableRefreshConfig) => void;
}

const StyledImage = styled('img')(() => ({
  width: '85px',
  height: '85px',
  objectFit: 'cover',
  marginRight: '16px',
}));

const StyleQuickOrderTable = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',

  '& thead': {
    '& th': {
      fontFamily: 'Lato, sans-serif',
      fontWeight: 300,
      fontSize: '16px',
      lineHeight: '100%',
      color: '#000000',
    },
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
    },
  },
}));

const tableDataTypographySx = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#000000',
} as const;

const tableOptionTextSx = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '16px',
  color: '#000000',
} as const;

interface QuickOrderTableProps {
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>;
  setCheckedArr: (values: CheckedProduct[]) => void;
  isRequestLoading: boolean;
  manualProducts: QuickOrderListItem[];
}

const defaultSortKey = 'lastOrderedAt';

const sortKeys = {
  product: 'productName',
  lastOrderedAt: 'lastOrderedAt',
};

function QuickOrderTable({
  setIsRequestLoading,
  setCheckedArr,
  isRequestLoading,
  manualProducts,
}: QuickOrderTableProps) {
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null);

  const [search, setSearch] = useState<SearchProps>({
    q: '',
    beginDateAt: distanceDay(90),
    endDateAt: distanceDay(0),
    orderBy: `-${sortKeys[defaultSortKey]}`,
  });

  const [handleSetOrderBy, order, orderBy] = useSort(sortKeys, defaultSortKey, search, setSearch);

  const [fetchedTotal, setFetchedTotal] = useState<number>(0);
  const manualProductsRef = useRef<QuickOrderListItem[]>([]);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const normalizeTimestamp = useCallback((value: number | string | undefined) => {
    if (value === undefined || value === null) return null;

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return null;

    const timestamp = numericValue < 1e12 ? numericValue * 1000 : numericValue;

    return new Date(timestamp);
  }, []);

  const filterManualProducts = useCallback(
    (items: QuickOrderListItem[], params: SearchProps) => {
      const { q = '', beginDateAt, endDateAt, orderBy: orderByParam } = params;

      const searchTerm = q.trim().toLowerCase();
      const beginDate = beginDateAt ? new Date(`${beginDateAt}T00:00:00`) : null;
      const endDate = endDateAt ? new Date(`${endDateAt}T23:59:59`) : null;

      const filteredItems = items.filter(({ node }) => {
        const productName = node.productName?.toLowerCase() || '';
        const sku = node.variantSku?.toLowerCase() || '';

        const matchesSearch = !searchTerm || productName.includes(searchTerm) || sku.includes(searchTerm);

        if (!matchesSearch) {
          return false;
        }

        const lastOrderedDate = normalizeTimestamp(node.lastOrderedAt);

        if (!lastOrderedDate) {
          return beginDate === null && endDate === null;
        }

        if (beginDate && lastOrderedDate < beginDate) {
          return false;
        }

        if (endDate && lastOrderedDate > endDate) {
          return false;
        }

        return true;
      });

      const orderKey = orderByParam || `-${sortKeys[defaultSortKey]}`;
      const direction = orderKey.startsWith('-') ? 'desc' : 'asc';
      const key = orderKey.replace(/^[-+]/, '');

      const sortedItems = [...filteredItems].sort((a, b) => {
        const aValue = (a.node as CustomFieldItems)[key];
        const bValue = (b.node as CustomFieldItems)[key];

        if (key === sortKeys.product) {
          const aString = (aValue || '').toString().toLowerCase();
          const bString = (bValue || '').toString().toLowerCase();

          if (aString < bString) return direction === 'asc' ? -1 : 1;
          if (aString > bString) return direction === 'asc' ? 1 : -1;

          return 0;
        }

        const aNumber = Number(aValue) || 0;
        const bNumber = Number(bValue) || 0;

        if (aNumber < bNumber) return direction === 'asc' ? -1 : 1;
        if (aNumber > bNumber) return direction === 'asc' ? 1 : -1;

        return 0;
      });

      return sortedItems;
    },
    [normalizeTimestamp],
  );

  const getList: GetRequestList<SearchProps, QuickOrderListItem['node']> = async (params) => {
    const sortedItems = filterManualProducts(manualProductsRef.current, params);
    const totalCount = sortedItems.length;

    const offset = params.offset || 0;
    const first = params.first || totalCount;
    const paginatedItems = sortedItems.slice(offset, offset + first);

    setFetchedTotal(totalCount);

    return {
      edges: paginatedItems,
      totalCount,
    };
  };

  const handleSearchProduct = async (q: string) => {
    setSearch({
      ...search,
      q,
    });
  };

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getCacheList() || [];
      const checkedItems = selectCheckbox.reduce<QuickOrderListItem[]>((pre, item: number | string) => {
        const newItems = productList.find((product: QuickOrderListItem) => {
          const { node } = product;

          return node.id === item;
        });

        if (newItems) pre.push(newItems);

        return pre;
      }, []);

      setCheckedArr([...checkedItems]);
    } else {
      setCheckedArr([]);
    }
  };

  const handlePickerChange = (key: string, value: Date | string | number) => {
    const params = {
      ...search,
    };
    if (key === 'start') {
      params.beginDateAt = value || distanceDay(90);
    } else {
      params.endDateAt = value || distanceDay(0);
    }

    setSearch(params);
  };

  const handleUpdateProductQty = (id: number | string, value: number | string) => {
    if (value !== '' && Number(value) <= 0) return;
    const listItems = paginationTableRef.current?.getList() || [];
    const listCacheItems = paginationTableRef.current?.getCacheList() || [];

    const newListItems = listItems?.map((item: QuickOrderListItem) => {
      const { node } = item;
      if (node?.id === id) {
        node.quantity = value === '' ? '' : Number(value);
      }

      return item;
    });
    const newListCacheItems = listCacheItems?.map((item: QuickOrderListItem) => {
      const { node } = item;
      if (node?.id === id) {
        node.quantity = value === '' ? '' : Number(value);
      }

      return item;
    });
    paginationTableRef.current?.setList([...newListItems]);
    paginationTableRef.current?.setCacheAllList([...newListCacheItems]);
  };

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

  const handleSetCheckedQty = (row: CustomFieldItems) => {
    const cacheProductList: CustomFieldItems = paginationTableRef.current?.getCacheList() || [];

    let qty = row.quantity;
    if (cacheProductList.length > 0) {
      const currentProduct = cacheProductList.find(
        (item: CustomFieldItems) =>
          item.node.variantId === row.variantId &&
          item.node.productId === row.productId &&
          item.node.id === row.id,
      );

      if (currentProduct && currentProduct.node) {
        qty = currentProduct.node.quantity || qty;
      }
    }

    return qty;
  };

  const totalProducts = fetchedTotal;

  const columnItems: TableColumnItem<QuickOrderListItem['node']>[] = [
    {
      key: 'product',
      title: b3Lang('purchasedProducts.product'),
      render: (row: CustomFieldItems) => {
        const { optionList, productsSearch, variantId } = row;
        const currentVariants = productsSearch.variants || [];

        const currentImage =
          b2bGetVariantImageByVariantInfo(currentVariants, { variantId }) || row.imageUrl;
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <StyledImage
              src={currentImage || PRODUCT_DEFAULT_IMAGE}
              alt="Product-img"
              loading="lazy"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography sx={tableDataTypographySx}>{row.productName}</Typography>
              <Typography sx={tableDataTypographySx}>{row.variantSku}</Typography>
              {optionList.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {optionList.map((option: any) => (
                    <Typography sx={tableOptionTextSx} key={option.id}>
                      {`${option.display_name}: ${option.display_value}`}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        );
      },
      width: '40%',
      isSortable: true,
    },
    {
      key: 'price',
      title: b3Lang('purchasedProducts.price'),
      render: (row: CustomFieldItems) => {
        const {
          productsSearch: { variants },
          variantId,
          basePrice,
        } = row;
        let priceIncTax = Number(basePrice);
        if (variants?.length) {
          priceIncTax =
            getProductPriceIncTaxOrExTaxBySetting(variants, Number(variantId)) || Number(basePrice);
        }

        const qty = handleSetCheckedQty(row);
        const withTaxPrice = priceIncTax || Number(basePrice);
        const price = withTaxPrice * Number(qty);

        return (
          <Typography sx={{ ...tableDataTypographySx, textAlign: 'right', width: '100%' }}>
            {showPrice(currencyFormat(price), row)}
          </Typography>
        );
      },
      width: '15%',
      style: {
        textAlign: 'right',
      },
    },
    {
      key: 'qty',
      title: b3Lang('purchasedProducts.qty'),
      render: (row) => {
        const qty = handleSetCheckedQty(row);

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <QuickOrderQuantitySelector
              value={qty}
              onChange={(value) => {
                handleUpdateProductQty(row.id, value);
              }}
            />
          </Box>
        );
      },
      width: '15%',
      style: {
        textAlign: 'center',
      },
    },
    {
      key: 'lastOrderedAt',
      title: b3Lang('purchasedProducts.lastOrdered'),
      render: (row: CustomFieldItems) => (
        <Box>
          <Typography sx={{ ...tableDataTypographySx, textAlign: 'right', width: '100%' }}>
            {`${displayFormat(Number(row.lastOrderedAt))}`}
          </Typography>
        </Box>
      ),
      width: '15%',
      style: {
        textAlign: 'right',
      },
      isSortable: true,
    },
  ];

  useEffect(() => {
    manualProductsRef.current = manualProducts;
    paginationTableRef.current?.setCacheAllList([...manualProducts]);
    paginationTableRef.current?.refresh?.({ keepCheckedItems: true });
  }, [manualProducts]);

  return (
    <B3Spin isSpinning={isRequestLoading}>
      <StyleQuickOrderTable>
        <Typography
          sx={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 600,
            fontSize: isMobile ? '14px' : '24px',
            lineHeight: isMobile ? '20px' : '28px',
            color: '#000000',
            textAlign: isMobile ? 'center' : 'left',
            marginTop: isMobile ? '24px' : '32px',
            marginBottom: isMobile ? '16px' : '24px',
            width: '100%',
          }}
        >
          {b3Lang('purchasedProducts.totalProducts', { total: totalProducts })}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-end',
            justifyContent: isMobile ? 'center' : 'flex-start',
            gap: isMobile ? '16px' : '10px',
            width: '100%',
            marginBottom: isMobile ? '24px' : '32px',
          }}
        >
          <Box
            sx={{
              width: isMobile ? '100%' : '225px',
              maxWidth: isMobile ? '100%' : '225px',
              minWidth: isMobile ? '100%' : '225px',
              margin: isMobile ? '0 auto' : 0,
            }}
          >
            <B3FilterSearch
              w={isMobile ? '100%' : 225}
              h={44}
              searchBGColor="#EFEFEF"
              inputSx={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#000000',
                '& .MuiInputBase-input': {
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#000000',
                  '&::placeholder': {
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                    opacity: 1,
                  },
                },
              }}
              handleChange={(e) => {
                handleSearchProduct(e);
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: isMobile ? '10%' : '10px',
              justifyContent: isMobile ? 'space-between' : 'flex-start',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Box
              sx={{
                width: isMobile ? '45%' : '167px',
                minWidth: isMobile ? '45%' : '167px',
              }}
            >
              <B3Picker
                variant="filled"
                label={b3Lang('purchasedProducts.from')}
                value={search?.beginDateAt || distanceDay(90)}
                textFieldSx={{
                  width: '100%',
                  '& .MuiFilledInput-root': {
                    height: '44px',
                    borderRadius: '5px',
                    backgroundColor: '#EFEFEF',
                    '&:before': {
                      borderBottomWidth: '2px',
                      borderBottomColor: '#000000',
                    },
                    '&:after': {
                      borderBottomWidth: '2px',
                      borderBottomColor: '#000000',
                    },
                    '&:hover': {
                      backgroundColor: '#EFEFEF',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#EFEFEF',
                    },
                  },
                  '& .MuiFilledInput-input': {
                    padding: '10px',
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(12px, 0px) scale(0.75)',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#000000',
                  },
                }}
                onChange={(value) => handlePickerChange('start', value)}
              />
            </Box>
            <Box
              sx={{
                width: isMobile ? '45%' : '167px',
                minWidth: isMobile ? '45%' : '167px',
              }}
            >
              <B3Picker
                variant="filled"
                label={b3Lang('purchasedProducts.to')}
                value={search?.endDateAt || distanceDay()}
                textFieldSx={{
                  width: '100%',
                  '& .MuiFilledInput-root': {
                    height: '44px',
                    borderRadius: '5px',
                    backgroundColor: '#EFEFEF',
                    '&:before': {
                      borderBottomWidth: '2px',
                      borderBottomColor: '#000000',
                    },
                    '&:after': {
                      borderBottomWidth: '2px',
                      borderBottomColor: '#000000',
                    },
                    '&:hover': {
                      backgroundColor: '#EFEFEF',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#EFEFEF',
                    },
                  },
                  '& .MuiFilledInput-input': {
                    padding: '10px',
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(12px, 0px) scale(0.75)',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#000000',
                  },
                }}
                onChange={(value) => handlePickerChange('end', value)}
              />
            </Box>
          </Box>
        </Box>

        <B3PaginationTable
          ref={paginationTableRef}
          columnItems={columnItems as TableColumnItem<QuickOrderListItem['node']>[]}
          rowsPerPageOptions={[12, 24, 36]}
          getRequestList={getList}
          searchParams={search}
          isCustomRender={false}
          showCheckbox
          showSelectAllCheckbox
          disableCheckbox={false}
          hover
          labelRowsPerPage={b3Lang('purchasedProducts.itemsPerPage')}
          showBorder={false}
          requestLoading={setIsRequestLoading}
          getSelectCheckbox={getSelectCheckbox}
          itemIsMobileSpacing={0}
          isSelectOtherPageCheckbox
          noDataText={b3Lang('purchasedProducts.noProductsFound')}
          sortDirection={order}
          orderBy={orderBy}
          sortByFn={handleSetOrderBy}
          renderItem={(row, _, checkBox) => (
            <QuickOrderCard
              item={row}
              checkBox={checkBox}
              handleUpdateProductQty={handleUpdateProductQty}
            />
          )}
        />
      </StyleQuickOrderTable>
    </B3Spin>
  );
}

export default QuickOrderTable;
