import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { createQuote } from '@/shared/service/b2b';
import { createOrUpdateExistingCart } from '@/utils/cartUtils';
import { channelId, getActiveCurrencyInfo, storeHash } from '@/utils';
import { getCurrentCustomerInfo, loginInfo } from '@/utils/loginInfo';
import { store, useAppSelector } from '@/store';

import { PageProps } from '../PageProps';

const QUOTE_ITEMS_KEY = 'buyerPortalQuoteItems';
const QUOTE_ITEMS_CACHE_KEY = 'buyerPortalQuoteItemsCache';

interface StoredQuoteOption {
  id: number | string;
  value: number | string;
}

interface StoredQuoteItem {
  productId: number;
  variantId?: number;
  quantity: number;
  sku?: string;
  imageUrl?: string;
  productName?: string;
  options?: StoredQuoteOption[];
}

const ensureArray = (items: unknown): StoredQuoteItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return undefined;
      const { productId, variantId, quantity, options, sku, imageUrl, productName } = item as StoredQuoteItem;
      if (!productId || !quantity) return undefined;
      return {
        productId: Number(productId),
        variantId: variantId ? Number(variantId) : undefined,
        quantity: Number(quantity),
        sku: sku || '',
        imageUrl: imageUrl || '',
        productName: productName || '',
        options: Array.isArray(options)
          ? options.map((option) => ({
            id: option.id,
            value: option.value,
          }))
          : [],
      };
    })
    .filter(Boolean) as StoredQuoteItem[];
};

export default function CreateQuoteFromStorefront({ setOpenPage }: PageProps) {
  const b2bToken = useAppSelector(({ company }) => company.tokens.B2BToken);
  const customerId = useAppSelector(({ company }) => company.customer.id);

  const [quoteItems, setQuoteItems] = useState<StoredQuoteItem[]>([]);
  const [awaitingLogin, setAwaitingLogin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const capturedItems = useMemo(() => {
    const storedItems =
      sessionStorage.getItem(QUOTE_ITEMS_KEY) || sessionStorage.getItem(QUOTE_ITEMS_CACHE_KEY);

    if (!storedItems) return [];

    try {
      const parsedItems = ensureArray(JSON.parse(storedItems));
      sessionStorage.removeItem(QUOTE_ITEMS_KEY);
      sessionStorage.setItem(QUOTE_ITEMS_CACHE_KEY, JSON.stringify(parsedItems));
      return parsedItems;
    } catch (error) {
      console.error('[CreateQuoteFromStorefront] Failed to parse quote items', error);
      sessionStorage.removeItem(QUOTE_ITEMS_KEY);
      sessionStorage.removeItem(QUOTE_ITEMS_CACHE_KEY);
      return [];
    }
  }, []);

  const clearCapturedItems = () => {
    sessionStorage.removeItem(QUOTE_ITEMS_KEY);
    sessionStorage.removeItem(QUOTE_ITEMS_CACHE_KEY);
  };

  const ensureAuthenticated = async () => {
    try {
      const state = store.getState();
      let { B2BToken, bcGraphqlToken } = state.company.tokens;

      if (!B2BToken || !state.company.customer.id) {
        const customerInfo = await getCurrentCustomerInfo();
        if (!customerInfo) return false;
        B2BToken = store.getState().company.tokens.B2BToken;
      }

      if (!bcGraphqlToken) {
        await loginInfo();
        bcGraphqlToken = store.getState().company.tokens.bcGraphqlToken;
      }

      return Boolean(B2BToken && bcGraphqlToken);
    } catch (error) {
      console.error('[CreateQuoteFromStorefront] Authentication failed', error);
      return false;
    }
  };

  const addItemsToCart = async (items: StoredQuoteItem[]) => {
    await createOrUpdateExistingCart(
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        optionSelections: (item.options || []).map((option) => ({
          optionId: option.id,
          optionValue: option.value,
        })),
      })),
    );
  };

  const buildQuotePayload = (items: StoredQuoteItem[]) => {
    const state = store.getState();
    const {
      customer: { emailAddress = '', firstName = '', lastName = '', phoneNumber = '' },
      companyInfo,
    } = state.company;
    const { id: masqueradeCompanyId } = state.b2bFeatures.masqueradeCompany;
    const currencyInfo = getActiveCurrencyInfo();
    const decimalPlaces = currencyInfo?.decimal_places ?? 2;
    const toPriceString = (value: number) => value.toFixed(decimalPlaces);

    const productList = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      sku: item.sku || '',
      imageUrl: item.imageUrl || '',
      productName: item.productName || '',
      options: (item.options || []).map((option) => ({
        optionId: option.id,
        optionValue: option.value,
      })),
      basePrice: toPriceString(0),
      offeredPrice: toPriceString(0),
      discount: toPriceString(0),
      itemId: uuid(),
    }));

    return {
      message: '',
      legalTerms: '',
      totalAmount: toPriceString(0),
      grandTotal: toPriceString(0),
      subtotal: toPriceString(0),
      taxTotal: toPriceString(0),
      companyId: companyInfo.id || masqueradeCompanyId || '',
      storeHash,
      quoteTitle: 'Quote request',
      discount: toPriceString(0),
      channelId: window.B3?.setting?.channel_id || channelId,
      userEmail: emailAddress,
      shippingAddress: {},
      billingAddress: {},
      contactInfo: {
        name: `${firstName} ${lastName}`.trim() || emailAddress,
        email: emailAddress,
        companyName: companyInfo.companyName || '',
        phoneNumber,
      },
      productList,
      fileList: [],
      currency: {
        currencyExchangeRate: currencyInfo?.currency_exchange_rate?.toString() || '1',
        token: currencyInfo?.token || '',
        location: currencyInfo?.token_location || '',
        decimalToken: currencyInfo?.decimal_token || '.',
        decimalPlaces,
        thousandsToken: currencyInfo?.thousands_token || ',',
        currencyCode: currencyInfo?.currency_code || '',
      },
      referenceNumber: '',
      extraFields: [],
      recipients: [],
    };
  };

  const createQuoteFromItems = async (items: StoredQuoteItem[]) => {
    try {
      const payload = buildQuotePayload(items);
      const response = await createQuote(payload);
      const quoteId = response?.quoteCreate?.quote?.id;

      if (quoteId) {
        clearCapturedItems();
        window.location.replace(`#/quotes/${quoteId}`);
        return;
      }

      throw new Error('Quote ID missing in response');
    } catch (error) {
      console.error('[CreateQuoteFromStorefront] Quote creation failed, adding items to cart', error);
      clearCapturedItems();
      await addItemsToCart(items);
      window.location.replace('/cart.php');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!capturedItems.length) return;
    setQuoteItems(capturedItems);
  }, [capturedItems]);

  useEffect(() => {
    const processQuote = async () => {
      if (!quoteItems.length || isProcessing || awaitingLogin) return;
      setIsProcessing(true);

      const isAuthenticated = await ensureAuthenticated();

      if (!isAuthenticated) {
        setAwaitingLogin(true);
        sessionStorage.setItem(QUOTE_ITEMS_CACHE_KEY, JSON.stringify(quoteItems));
        setOpenPage({ isOpen: true, openUrl: '/login?loginFlag=loggedOutLogin&&closeIsLogout=1' });
        return;
      }

      await createQuoteFromItems(quoteItems);
    };

    processQuote();
  }, [quoteItems, isProcessing, awaitingLogin, setOpenPage]);

  useEffect(() => {
    if (!awaitingLogin) return;

    if (customerId && b2bToken) {
      window.location.reload();
    }
  }, [awaitingLogin, b2bToken, customerId]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 4,
      }}
    >
      <CircularProgress size={60} sx={{ marginBottom: 3 }} />
      <Typography variant="h5" component="h1" gutterBottom>
        Creating quote...
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        We are creating your quote in the background. This page will redirect you once complete.
      </Typography>
    </Box>
  );
}
