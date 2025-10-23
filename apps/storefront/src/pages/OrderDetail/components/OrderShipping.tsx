import { useContext, useMemo } from 'react';
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import { Box } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { currencyFormat, ordersCurrencyFormat } from '@/utils';

import { OrderDetailsContext } from '../context/OrderDetailsContext';
import OrderHistory from './OrderHistory';

import { MoneyFormat, OrderProductItem, OrderShippingsItem } from '../../../types';

const CardContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})<{ isMobile: boolean }>(({ isMobile }): CSSObject => ({
  width: isMobile ? '100%' : '662px',
  minHeight: isMobile ? 'auto' : '526px',
  borderWidth: '0px 0.3px 0.3px 0px',
  borderStyle: 'solid',
  borderColor: '#000000',
  padding: '15px',
  backgroundColor: '#FFFFFF',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: 'column',
}));

const TitleLine = styled('div')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '20px',
  lineHeight: '28px',
  color: '#000000',
}));

const InfoText = styled('div')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  marginTop: '5px',
}));

const StatusText = styled('div')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  marginTop: '5px',
}));

const Divider = styled('hr')((): CSSObject => ({
  width: '100%',
  borderWidth: '0.5px',
  borderStyle: 'solid',
  borderColor: '#000000',
  marginTop: '20px',
  marginBottom: '5px',
}));

const ProductsTableContainer = styled('div')((): CSSObject => ({
  marginTop: '20px',
  overflowX: 'auto',
}));

const StyledTable = styled('table')((): CSSObject => ({
  width: '100%',
  borderCollapse: 'collapse',
}));

const HeaderCell = styled('th')<{ align?: 'left' | 'right' }>(({ align = 'left' }): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  textAlign: align,
  padding: '8px 0',
}));

const TableRow = styled('tr')((): CSSObject => ({
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',

  '&:last-of-type': {
    borderBottom: 'none',
  },
}));

const BodyCell = styled('td')<{ align?: 'left' | 'right' }>(({ align = 'left' }): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  textAlign: align,
  padding: '12px 0',
  verticalAlign: 'top',
}));

const ProductInfo = styled('div')((): CSSObject => ({
  display: 'flex',
  gap: '16px',
}));

const ProductImage = styled('img')((): CSSObject => ({
  maxWidth: '85px',
  maxHeight: '85px',
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

const HistoryWrapper = styled('div')((): CSSObject => ({
  marginTop: '30px',
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
  const paymentLabel = paymentMethod
    ? b3Lang('orderDetail.paymentMethodLabel', { paymentMethod })
    : '';
  const totalLabel = grandTotal ? b3Lang('orderDetail.totalLabel', { total: grandTotal }) : '';

  const hasProducts = products.length > 0;
  const isFullyShipped = hasProducts
    ? products.every((product) => Number(product.quantity_shipped || 0) >= Number(product.quantity || 0))
    : false;

  const statusKey = isFullyShipped
    ? 'orderDetail.shippingStatus.shipped'
    : 'orderDetail.shippingStatus.notShippedYet';
  const statusText = hasProducts
    ? b3Lang('orderDetail.shippingStatus.label', { status: b3Lang(statusKey) })
    : '';

  const productList = products;

  const showPaymentInfo = paymentLabel || totalLabel;

  return (
    <CardContainer isMobile={isMobile}>
      {displayName && (
        <TitleLine>
          {displayName}
          {displayCompanyName ? ` – ${displayCompanyName}` : ''}
        </TitleLine>
      )}
      {displayAddress && <TitleLine>{displayAddress}</TitleLine>}
      {showPaymentInfo && (
        <InfoText>
          {paymentLabel}
          {paymentLabel && totalLabel && <br />}
          {totalLabel}
        </InfoText>
      )}
      {statusText && <StatusText>{statusText}</StatusText>}
      <Divider />
      {productList.length > 0 && (
        <ProductsTable
          products={productList}
          money={money}
          showInclusiveTaxPrice={showInclusiveTaxPrice}
        />
      )}
      {history.length > 0 && (
        <HistoryWrapper>
          <OrderHistory variant="orderDetail" />
        </HistoryWrapper>
      )}
    </CardContainer>
  );
}

interface ProductsTableProps {
  products: OrderProductItem[];
  money?: MoneyFormat;
  showInclusiveTaxPrice: boolean;
}

function ProductsTable({ products, money, showInclusiveTaxPrice }: ProductsTableProps) {
  const b3Lang = useB3Lang();

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

  return (
    <ProductsTableContainer>
      <StyledTable>
        <thead>
          <tr>
            <HeaderCell>{b3Lang('global.searchProduct.product')}</HeaderCell>
            <HeaderCell align="right">{b3Lang('global.searchProduct.price')}</HeaderCell>
            <HeaderCell align="right">{b3Lang('global.searchProduct.qty')}</HeaderCell>
            <HeaderCell align="right">{b3Lang('global.searchProduct.total')}</HeaderCell>
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
                <BodyCell>
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
                <BodyCell align="right">{unitPrice}</BodyCell>
                <BodyCell align="right">{product.quantity}</BodyCell>
                <BodyCell align="right">{totalPrice}</BodyCell>
              </TableRow>
            );
          })}
        </tbody>
      </StyledTable>
    </ProductsTableContainer>
  );
}
