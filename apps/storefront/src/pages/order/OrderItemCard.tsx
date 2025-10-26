import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { isB2BUserSelector, useAppSelector } from '@/store';
import { currencyFormat, displayFormat, ordersCurrencyFormat } from '@/utils';

import OrderStatus from './components/OrderStatus';

interface ListItem {
  orderId: string;
  firstName: string;
  lastName: string;
  poNumber?: string;
  status: string;
  totalIncTax: string;
  createdAt: string;
  money?: string;
  currencyCode?: string;
}

interface OrderItemCardProps {
  goToDetail: () => void;
  item: ListItem;
  isCompanyOrder?: boolean;
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  '&.between-flex': {
    justifyContent: 'space-between',
  },
}));

const DetailsRow = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  marginBottom: '12px',
  '&:last-of-type': {
    marginBottom: 0,
  },
}));

const detailsTitleSx = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 700,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
} as const;

const detailsValueSx = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'right' as const,
  color: '#000000',
} as const;

const getCurrencyDisplay = (currencyCode?: string, money?: string) => {
  if (currencyCode) {
    return currencyCode;
  }

  if (!money || typeof money !== 'string') {
    return '–';
  }

  try {
    const parsedMoney = JSON.parse(JSON.parse(money)) as {
      currency_code?: string;
      currency_token?: string;
    };

    return parsedMoney.currency_code || parsedMoney.currency_token || '–';
  } catch {
    return '–';
  }
};

const getCreatedAtDisplay = (value: string) => {
  if (!value) {
    return '–';
  }

  const formatted = displayFormat(Number(value));

  if (!formatted) {
    return '–';
  }

  return String(formatted);
};

export function OrderItemCard({ item, goToDetail, isCompanyOrder = false }: OrderItemCardProps) {
  const theme = useTheme();
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const customer = useAppSelector(({ company }) => company.customer);

  const getName = (item: ListItem) => {
    if (isB2BUser) {
      return `by ${item.firstName} ${item.lastName}`;
    }
    return `by ${customer.firstName} ${customer.lastName}`;
  };

  const getCreatorName = (order: ListItem) => {
    if (order.firstName || order.lastName) {
      return `${order.firstName ?? ''} ${order.lastName ?? ''}`.trim() || '–';
    }

    if (isB2BUser) {
      return '–';
    }

    const fallbackName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
    return fallbackName || '–';
  };

  const getTotalDisplay = (order: ListItem) => {
    if (order.money) {
      try {
        return ordersCurrencyFormat(JSON.parse(JSON.parse(order.money)), order.totalIncTax);
      } catch {
        return currencyFormat(order.totalIncTax);
      }
    }

    return currencyFormat(order.totalIncTax);
  };

  if (isCompanyOrder) {
    return (
      <Card
        key={item.orderId}
        sx={{
          border: '0.2px solid #000000',
          boxShadow: '0px 4px 22px 5px #0000001A',
          borderRadius: '12px',
          cursor: 'pointer',
        }}
      >
        <CardContent sx={{ padding: theme.spacing(3) }} onClick={goToDetail}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              sx={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#000000',
                marginBottom: '16px',
              }}
            >
              {item.orderId}
            </Typography>

            <Box sx={{ marginBottom: '20px' }}>
              <OrderStatus code={item.status} />
            </Box>

            <Box>
              <DetailsRow>
                <Typography sx={detailsTitleSx}>Reference</Typography>
                <Typography sx={detailsValueSx}>{item.poNumber || '–'}</Typography>
              </DetailsRow>
              <DetailsRow>
                <Typography sx={detailsTitleSx}>Total</Typography>
                <Typography sx={detailsValueSx}>{getTotalDisplay(item)}</Typography>
              </DetailsRow>
              <DetailsRow>
                <Typography sx={detailsTitleSx}>Created by</Typography>
                <Typography sx={detailsValueSx}>{getCreatorName(item)}</Typography>
              </DetailsRow>
              <DetailsRow>
                <Typography sx={detailsTitleSx}>Creation date</Typography>
                <Typography sx={detailsValueSx}>{getCreatedAtDisplay(item.createdAt)}</Typography>
              </DetailsRow>
              <DetailsRow>
                <Typography sx={detailsTitleSx}>Currency</Typography>
                <Typography sx={detailsValueSx}>
                  {getCurrencyDisplay(item.currencyCode, item.money)}
                </Typography>
              </DetailsRow>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={item.orderId}>
      <CardContent sx={{ color: 'rgba(0, 0, 0, 0.6)' }} onClick={goToDetail}>
        <Flex className="between-flex">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              {`# ${item.orderId}`}
            </Typography>
            <Typography
              sx={{
                ml: 1,
              }}
              variant="body2"
            >
              {item.poNumber ? item.poNumber : '–'}
            </Typography>
          </Box>
          <Box>
            <OrderStatus code={item.status} />
          </Box>
        </Flex>

        <Typography
          variant="h6"
          sx={{
            marginBottom: theme.spacing(2.5),
            mt: theme.spacing(1.5),
            minHeight: '1.43em',
          }}
        >
          {currencyFormat(item.totalIncTax)}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'normal',
              marginRight: theme.spacing(2),
            }}
          >
            {getName(item)}
          </Typography>
          <Typography>{getCreatedAtDisplay(item.createdAt)}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
