import { useContext } from 'react';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Typography } from '@mui/material';

import { B3Table, TableColumnItem } from '@/components/table/B3Table';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { displayExtendedFormat } from '@/utils';

import { OrderHistoryItem, OrderStatusItem } from '../../../types';
import OrderStatus from '../../order/components/OrderStatus';
import { orderStatusTranslationVariables } from '../../order/shared/getOrderStatus';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

const HistoryListContainer = styled('div')(() => ({
  '& > .MuiPaper-root': {
    boxShadow: 'none',
  },

  '& table': {
    '& td, & th': {
      '&:first-of-type': {
        paddingLeft: 0,
      },
    },
  },
}));

interface OrderHistoryProps {
  variant?: 'default' | 'orderDetail';
}

export default function OrderHistory({ variant = 'default' }: OrderHistoryProps) {
  const b3Lang = useB3Lang();
  const {
    state: { history = [], orderStatus: orderStatusLabel = [], customStatus },
  } = useContext(OrderDetailsContext);
  const [isMobile] = useMobile();

  const getOrderStatusLabel = (status: string) => {
    const currentOrderStatus = orderStatusLabel.find(
      (item: OrderStatusItem) => item.systemLabel === status,
    );

    let activeStatusLabel = currentOrderStatus?.customLabel || customStatus;

    if (currentOrderStatus) {
      const optionLabel = orderStatusTranslationVariables[currentOrderStatus.systemLabel];

      activeStatusLabel =
        optionLabel && b3Lang(optionLabel) !== currentOrderStatus.systemLabel
          ? b3Lang(optionLabel)
          : activeStatusLabel;
    }

    return activeStatusLabel;
  };

  if (!history.length) {
    return null;
  }

  const defaultColumns: TableColumnItem<OrderHistoryItem>[] = [
    {
      key: 'time',
      title: b3Lang('orderDetail.history.dateHeader'),
      render: (item: OrderHistoryItem) => `${displayExtendedFormat(item.createdAt)}`,
      width: isMobile ? '100px' : '200px',
    },
    {
      key: 'code',
      title: b3Lang('orderDetail.history.statusHeader'),
      render: (item: OrderHistoryItem) => (
        <OrderStatus code={item.status} text={getOrderStatusLabel(item.status)} />
      ),
    },
  ];

  const orderDetailColumns: TableColumnItem<OrderHistoryItem>[] = [
    {
      key: 'time',
      title: b3Lang('orderDetail.history.dateHeader'),
      style: {
        fontFamily: 'Lato, sans-serif',
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: '24px',
        color: '#000000',
      },
      render: (item: OrderHistoryItem) => (
        <Typography
          component="span"
          sx={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#000000',
          }}
        >
          {displayExtendedFormat(item.createdAt)}
        </Typography>
      ),
    },
    {
      key: 'code',
      title: b3Lang('orderDetail.history.statusHeader'),
      style: {
        fontFamily: 'Lato, sans-serif',
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: '24px',
        color: '#000000',
      },
      render: (item: OrderHistoryItem) => (
        <OrderStatus
          code={item.status}
          text={getOrderStatusLabel(item.status)}
          variant="orderDetailHistory"
        />
      ),
    },
  ];

  const columnItems = variant === 'orderDetail' ? orderDetailColumns : defaultColumns;

  if (variant === 'orderDetail') {
    return (
      <Box>
        <Typography
          sx={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 600,
            fontSize: '24px',
            lineHeight: '28px',
            color: '#000000',
            marginBottom: '10px',
          }}
        >
          {b3Lang('orderDetail.history.title')}
        </Typography>
        <HistoryListContainer>
          <B3Table columnItems={columnItems} listItems={history} showPagination={false} showBorder={false} />
        </HistoryListContainer>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent
        sx={{
          paddingBottom: '50px',
        }}
      >
        <Typography variant="h5">{b3Lang('orderDetail.history.title')}</Typography>
        <HistoryListContainer>
          <B3Table columnItems={columnItems} listItems={history} showPagination={false} />
        </HistoryListContainer>
      </CardContent>
    </Card>
  );
}
