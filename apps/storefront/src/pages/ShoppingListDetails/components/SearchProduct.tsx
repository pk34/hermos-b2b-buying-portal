import { ChangeEvent, KeyboardEvent, useState } from 'react';
import { Box, InputBase, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { useBlockPendingAccountViewPrice } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { searchProducts } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import { calculateProductListPrice } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';

import { ShoppingListProductItem } from '../../../types';

import ChooseOptionsDialog from './ChooseOptionsDialog';
import ProductListDialog from './ProductListDialog';

interface SearchProductProps {
  updateList?: () => void;
  addToList: (products: CustomFieldItems[]) => Promise<void>;
  searchDialogTitle?: string;
  addButtonText?: string;
  type?: string;
}

export default function SearchProduct({
  updateList = () => {},
  addToList,
  searchDialogTitle,
  addButtonText,
  type,
}: SearchProductProps) {
  const b3Lang = useB3Lang();
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector((state) => state.company.customer.customerGroupId);
  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const companyId = companyInfoId || salesRepCompanyId;
  const [isLoading, setIsLoading] = useState(false);
  const [productListOpen, setProductListOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [productList, setProductList] = useState<ShoppingListProductItem[]>([]);
  const [chooseOptionsOpen, setChooseOptionsOpen] = useState(false);
  const [optionsProduct, setOptionsProduct] = useState<ShoppingListProductItem>();

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const handleSearchTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const searchProduct = async () => {
    if (!searchText || isLoading) {
      return;
    }

    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(b3Lang('global.searchProductAddProduct.businessAccountPendingApproval'));
      return;
    }

    setIsLoading(true);
    try {
      const { productsSearch } = await searchProducts({
        search: searchText,
        companyId,
        customerGroupId,
        categoryFilter: true,
      });

      const product = conversionProductsList(productsSearch);

      setProductList(product);
      setProductListOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchTextKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProduct();
    }
  };

  const handleSearchButtonClicked = () => {
    searchProduct();
  };

  const clearProductInfo = () => {
    setProductList([]);
  };

  const handleProductListDialogCancel = () => {
    setChooseOptionsOpen(false);
    setProductListOpen(false);

    if (isAdded) {
      setIsAdded(false);
      updateList();
    }

    clearProductInfo();
  };

  const handleProductQuantityChange = (id: number, newQuantity: number) => {
    const product = productList.find((product) => product.id === id);
    if (product) {
      product.quantity = newQuantity;
    }

    setProductList([...productList]);
  };

  const handleAddToListClick = async (products: CustomFieldItems[]) => {
    try {
      setIsLoading(true);
      await calculateProductListPrice(products);
      await addToList(products);

      updateList();
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductListAddToList = async (products: CustomFieldItems[]) => {
    await handleAddToListClick(products);
  };

  const handleChangeOptionsClick = (productId: number) => {
    const product = productList.find((product) => product.id === productId);
    if (product) {
      setOptionsProduct({
        ...product,
      });
    }
    setProductListOpen(false);
    setChooseOptionsOpen(true);
  };

  const handleChooseOptionsDialogCancel = () => {
    setChooseOptionsOpen(false);
    setProductListOpen(true);
  };

  const handleChooseOptionsDialogConfirm = async (products: CustomFieldItems[]) => {
    try {
      setIsLoading(true);
      await calculateProductListPrice(products);
      await handleAddToListClick(products);
      setChooseOptionsOpen(false);
      setProductListOpen(true);
    } catch (error) {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        margin: '24px 0',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Lato, sans-serif',
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          color: '#000000',
        }}
      >
        {b3Lang('shoppingList.addToShoppingList.searchBySku')}
      </Typography>
      <Box
        sx={{
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#EFEFEF',
            borderBottom: '2px solid #000000',
            borderRadius: '5px',
            width: '100%',
            maxWidth: '327px',
            height: '44px',
            padding: '0 10px',
            boxSizing: 'border-box',
            alignSelf: 'flex-start',
          }}
        >
          <Box
            component="svg"
            width="20"
            height="22"
            viewBox="0 0 20 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            sx={{ flexShrink: 0, width: '20px', height: '20px' }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 4.95472C5.79086 4.95472 4 6.75925 4 8.98525C4 11.2112 5.79086 13.0158 8 13.0158C10.2091 13.0158 12 11.2112 12 8.98525C12 6.75925 10.2091 4.95472 8 4.95472ZM2 8.98525C2 5.64625 4.68629 2.93945 8 2.93945C11.3137 2.93945 14 5.64625 14 8.98525C14 10.291 13.5892 11.5 12.8907 12.4883L17.7071 17.3414C18.0976 17.7349 18.0976 18.3729 17.7071 18.7664C17.3166 19.16 16.6834 19.16 16.2929 18.7664L11.4765 13.9133C10.4957 14.6171 9.29583 15.031 8 15.031C4.68629 15.031 2 12.3242 2 8.98525Z"
              fill="#0A0A0A"
            />
          </Box>
          <InputBase
            placeholder={b3Lang(`global.searchProduct.placeholder.${type}`)}
            value={searchText}
            onChange={handleSearchTextChange}
            onKeyDown={handleSearchTextKeyDown}
            sx={{
              flex: 1,
              height: '100%',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#231F20',
              '& .MuiInputBase-input': {
                padding: 0,
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#231F20',
                '&::placeholder': {
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#231F20',
                  opacity: 1,
                },
              },
            }}
          />
        </Box>
        <CustomButton
          variant="contained"
          disabled={isLoading}
          onClick={handleSearchButtonClicked}
          sx={{
            width: '100%',
            maxWidth: '327px',
            height: '44px',
            borderRadius: '5px',
            padding: '10px',
            backgroundColor: '#0067A0',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#FFFFFF',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#00965E',
              boxShadow: 'none',
            },
            '&:disabled': {
              backgroundColor: '#0067A0',
              opacity: 0.5,
              color: '#FFFFFF',
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
                color: '#FFFFFF',
              }}
            >
              {b3Lang('global.searchProductAddProduct.searchProduct')}
            </Box>
          </B3Spin>
        </CustomButton>
      </Box>

      <ProductListDialog
        isOpen={productListOpen}
        isLoading={isLoading}
        productList={productList}
        searchText={searchText}
        type={type}
        onSearchTextChange={handleSearchTextChange}
        onSearch={handleSearchButtonClicked}
        onCancel={handleProductListDialogCancel}
        onProductQuantityChange={handleProductQuantityChange}
        onChooseOptionsClick={handleChangeOptionsClick}
        onAddToListClick={handleProductListAddToList}
        searchDialogTitle={searchDialogTitle}
        addButtonText={addButtonText}
      />

      <ChooseOptionsDialog
        isOpen={chooseOptionsOpen}
        isLoading={isLoading}
        type={type}
        setIsLoading={setIsLoading}
        product={optionsProduct}
        onCancel={handleChooseOptionsDialogCancel}
        onConfirm={handleChooseOptionsDialogConfirm}
        addButtonText={addButtonText}
      />
    </Box>
  );
}
