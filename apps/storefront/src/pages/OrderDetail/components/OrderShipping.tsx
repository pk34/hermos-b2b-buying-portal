import { useContext, useMemo } from 'react';
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import { Box, Stack } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { currencyFormat, ordersCurrencyFormat } from '@/utils';

import { OrderDetailsContext } from '../context/OrderDetailsContext';
import OrderHistory from './OrderHistory';

import { MoneyFormat, OrderProductItem, OrderShippingsItem } from '../../../types';

const CardBaseStyles: CSSObject = {
  width: '100%',
  backgroundColor: '#FFFFFF',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: 'column',
};

const SHIPPED_STATUSES = new Set(['Shipped', 'Partially Shipped', 'Completed', 'Refunded', 'Partially Refunded']);

const ClientInfoCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})<{ isMobile: boolean }>(({ isMobile }): CSSObject => ({
  ...CardBaseStyles,
  padding: isMobile ? '15px' : '20px',
  border: 'none',
  gap: '6px',
}));

const ProductsCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})<{ isMobile: boolean }>(({ isMobile }): CSSObject => ({
  ...CardBaseStyles,
  padding: isMobile ? '15px' : '20px',
  borderWidth: '0px 0.3px 0.3px 0px',
  borderStyle: 'solid',
  borderColor: '#000000',
  gap: '20px',
}));

const ProductsTableContainer = styled('div')((): CSSObject => ({
  width: '100%',
  overflowX: 'hidden',
}));

const ClientInfoLine = styled('div')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  wordBreak: 'break-word',
}));

const MobileProductsList = styled('div')((): CSSObject => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}));

const MobileProductRow = styled('div')((): CSSObject => ({
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
}));

const MobileProductImage = styled('img')((): CSSObject => ({
  width: '85px',
  height: '85px',
  borderRadius: '4px',
  objectFit: 'contain',
  flexShrink: 0,
}));

const MobileProductDetails = styled('div')((): CSSObject => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
}));

const MobileProductLine = styled('span')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  wordBreak: 'break-word',
}));

const StyledTable = styled('table')((): CSSObject => ({
  width: '100%',
  borderCollapse: 'collapse',
}));

const HeaderCell = styled('th')<{ align?: 'left' | 'right'; width?: string }>(
  ({ align = 'left', width }): CSSObject => ({
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    textAlign: align,
    padding: '8px 0',
    width,
  }),
);

const TableRow = styled('tr')((): CSSObject => ({
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',

  '&:last-of-type': {
    borderBottom: 'none',
  },
}));

const BodyCell = styled('td')<{ align?: 'left' | 'right'; width?: string }>(
  ({ align = 'left', width }): CSSObject => ({
    fontFamily: 'Lato, sans-serif',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    textAlign: align,
    padding: '12px 0',
    verticalAlign: 'top',
    width,
  }),
);

const ProductInfo = styled('div')((): CSSObject => ({
  display: 'flex',
  gap: '16px',
  width: '100%',
}));

const ProductImage = styled('img')((): CSSObject => ({
  width: '85px',
  height: '85px',
  borderRadius: '4px',
  objectFit: 'contain',
  alignSelf: 'flex-start',
}));

const ProductDetails = styled('div')((): CSSObject => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}));

const ProductName = styled('span')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
}));

const ProductMeta = styled('span')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
}));

type OrderShippingProps = {
  isCurrentCompany: boolean;
};

export default function OrderShipping({ isCurrentCompany: _isCurrentCompany }: OrderShippingProps) {
  const {
    state: {
      shippings = [],
      addressLabelPermission,
      money,
      orderSummary,
      payment = {},
      products = [],
      billingAddress,
      history = [],
      poNumber = '',
      status = '',
    },
  } = useContext(OrderDetailsContext);

  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();
  const showInclusiveTaxPrice = useAppSelector(({ global }) => global.showInclusiveTaxPrice);

  const shippingInfo = shippings[0];

  const getCompanyName = (company: string) => {
    if (addressLabelPermission) {
      return company;
    }

    const index = company.indexOf('/');

    return index !== -1 ? company.substring(index + 1) : company;
  };

  const getShippingName = (shipping?: OrderShippingsItem) => {
    if (shipping) {
      const { first_name: firstName = '', last_name: lastName = '' } = shipping;
      return `${firstName} ${lastName}`.trim();
    }

    if (billingAddress) {
      const { first_name: firstName = '', last_name: lastName = '' } = billingAddress;
      return `${firstName} ${lastName}`.trim();
    }

    return '';
  };

  const getShippingAddress = (shipping?: OrderShippingsItem) => {
    if (shipping) {
      const { street_1: street1, city, state, zip, country } = shipping;
      return `${street1}, ${city}, ${state} ${zip}, ${country}`;
    }

    if (billingAddress) {
      const { street_1: street1, city, state, zip, country } = billingAddress;
      return `${street1}, ${city}, ${state} ${zip}, ${country}`;
    }

    return '';
  };

  const companyName = shippingInfo?.company || billingAddress?.company || '';
  const displayCompanyName = companyName ? getCompanyName(companyName) : '';
  const displayName = getShippingName(shippingInfo);
  const displayAddress = getShippingAddress(shippingInfo);

  const grandTotal = useMemo(() => {
    const priceData = orderSummary?.priceData || {};
    const priceSymbol = orderSummary?.priceSymbol || {};
    const grandTotalKey = Object.entries(priceSymbol).find(([, symbol]) => symbol === 'grandTotal')?.[0];

    if (!grandTotalKey) {
      return '';
    }

    const totalValue = priceData[grandTotalKey];

    if (!totalValue) {
      return '';
    }

    const numericValue = typeof totalValue === 'number' ? totalValue : parseFloat(totalValue);

    if (Number.isNaN(numericValue)) {
      return '';
    }

    return money ? ordersCurrencyFormat(money, numericValue) : currencyFormat(numericValue);
  }, [money, orderSummary]);

  const paymentMethod = payment?.paymentMethod;
  const paymentLabel = paymentMethod ? `${paymentMethod}` : '';
  const totalLabel = grandTotal ? b3Lang('orderDetail.totalLabel', { total: grandTotal }) : '';

  const hasProducts = products.length > 0;
  const isFullyShipped = hasProducts
    ? products.every((product) => Number(product.quantity_shipped || 0) >= Number(product.quantity || 0))
    : false;

  const shipments = shippingInfo?.shipmentItems || [];
  const trackingNumber = shipments.find((shipment) => shipment.tracking_number)?.tracking_number || '';

  const isShippedStatus = status ? SHIPPED_STATUSES.has(status) : false;
  const shouldShowShippedStatus = hasProducts && (isFullyShipped || isShippedStatus);
  const formattedTrackingNumber = trackingNumber
    ? trackingNumber.trim().startsWith('#')
      ? trackingNumber.trim()
      : `#${trackingNumber.trim()}`
    : '';
  const statusText = hasProducts
    ? shouldShowShippedStatus
      ? formattedTrackingNumber
        ? b3Lang('orderDetail.shippingStatus.shippedWithTracking', {
            trackingNumber: formattedTrackingNumber,
          })
        : b3Lang('orderDetail.shippingStatus.shipped')
      : b3Lang('orderDetail.shippingStatus.notShippedYet')
    : '';

  const productList = products;

  const nameLine = displayName
    ? `${displayName}${displayCompanyName ? ` – ${displayCompanyName}` : ''}`
    : '';
  const poReference = poNumber ? `P.O.: ${poNumber}` : '';

  const clientInfoLines = [
    nameLine,
    displayAddress,
    poReference,
    paymentLabel,
    totalLabel,
    statusText,
  ].filter((line) => Boolean(line));

  return (
    <Stack spacing={3}>
      {clientInfoLines.length > 0 && (
        <ClientInfoCard isMobile={isMobile}>
          {clientInfoLines.map((line, index) => (
            <ClientInfoLine key={`${line}-${index}`}>{line}</ClientInfoLine>
          ))}
        </ClientInfoCard>
      )}
      {productList.length > 0 && (
        <ProductsCard isMobile={isMobile}>
          <ProductsTable
            products={productList}
            money={money}
            showInclusiveTaxPrice={showInclusiveTaxPrice}
          />
        </ProductsCard>
      )}
      {history.length > 0 && <OrderHistory variant="orderDetail" />}
    </Stack>
  );
}

interface ProductsTableProps {
  products: OrderProductItem[];
  money?: MoneyFormat;
  showInclusiveTaxPrice: boolean;
}

function ProductsTable({ products, money, showInclusiveTaxPrice }: ProductsTableProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const formatPrice = (value: number | string | undefined) => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    const numericValue = typeof value === 'number' ? value : parseFloat(value);

    if (Number.isNaN(numericValue)) {
      return '-';
    }

    return money ? ordersCurrencyFormat(money, numericValue) : currencyFormat(numericValue);
  };

  const getBatchNumber = (product: OrderProductItem) => {
    const batchOption = (product.product_options || []).find((option) =>
      option.display_name?.toLowerCase().includes('batch'),
    );

    return batchOption?.display_value || '';
  };

  if (isMobile) {
    const priceLabel = b3Lang('global.searchProduct.price');
    const quantityLabel = b3Lang('global.searchProduct.qty');
    const totalLabel = b3Lang('global.searchProduct.total');

    return (
      <ProductsTableContainer>
        <MobileProductsList>
          {products.map((product) => {
            const unitPriceValue = showInclusiveTaxPrice
              ? product.price_inc_tax || product.base_price
              : product.price_ex_tax || product.base_price;
            const totalPriceValue = showInclusiveTaxPrice
              ? product.total_inc_tax || product.base_total
              : product.total_ex_tax || product.base_total;

            const unitPrice = formatPrice(unitPriceValue);
            const totalPrice = formatPrice(totalPriceValue);
            const batchNumber = getBatchNumber(product);

            return (
              <MobileProductRow key={product.id}>
                <MobileProductImage
                  src={product.imageUrl || PRODUCT_DEFAULT_IMAGE}
                  alt={product.name}
                />
                <MobileProductDetails>
                  {product.name && <MobileProductLine>{product.name}</MobileProductLine>}
                  {batchNumber && (
                    <MobileProductLine>{`Batch number: ${batchNumber}`}</MobileProductLine>
                  )}
                  {product.sku && <MobileProductLine>{product.sku}</MobileProductLine>}
                  <MobileProductLine>{`${priceLabel}: ${unitPrice}`}</MobileProductLine>
                  <MobileProductLine>{`${quantityLabel}: ${product.quantity}`}</MobileProductLine>
                  <MobileProductLine>{`${totalLabel}: ${totalPrice}`}</MobileProductLine>
                </MobileProductDetails>
              </MobileProductRow>
            );
          })}
        </MobileProductsList>
      </ProductsTableContainer>
    );
  }

  return (
    <ProductsTableContainer>
      <StyledTable>
        <thead>
          <tr>
            <HeaderCell width="40%">{b3Lang('global.searchProduct.product')}</HeaderCell>
            <HeaderCell width="20%" align="right">
              {b3Lang('global.searchProduct.price')}
            </HeaderCell>
            <HeaderCell width="20%" align="right">
              {b3Lang('global.searchProduct.qty')}
            </HeaderCell>
            <HeaderCell width="20%" align="right">
              {b3Lang('global.searchProduct.total')}
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const unitPriceValue = showInclusiveTaxPrice
              ? product.price_inc_tax || product.base_price
              : product.price_ex_tax || product.base_price;
            const totalPriceValue = showInclusiveTaxPrice
              ? product.total_inc_tax || product.base_total
              : product.total_ex_tax || product.base_total;

            const unitPrice = formatPrice(unitPriceValue);
            const totalPrice = formatPrice(totalPriceValue);

            return (
              <TableRow key={product.id}>
                <BodyCell width="40%">
                  <ProductInfo>
                    <ProductImage src={product.imageUrl || PRODUCT_DEFAULT_IMAGE} alt={product.name} />
                    <ProductDetails>
                      <ProductName>{product.name}</ProductName>
                      {product.sku && <ProductMeta>{product.sku}</ProductMeta>}
                      {(product.product_options || []).map((option) => (
                        <ProductMeta key={`${product.id}-${option.id}`}>
                          {option.display_name}: {option.display_value}
                        </ProductMeta>
                      ))}
                    </ProductDetails>
                  </ProductInfo>
                </BodyCell>
                <BodyCell width="20%" align="right">
                  {unitPrice}
                </BodyCell>
                <BodyCell width="20%" align="right">
                  {product.quantity}
                </BodyCell>
                <BodyCell width="20%" align="right">
                  {totalPrice}
                </BodyCell>
              </TableRow>
            );
          })}
        </tbody>
      </StyledTable>
    </ProductsTableContainer>
  );
}
