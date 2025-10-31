import { useContext } from 'react';
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import { Box, Card, CardContent, Typography } from '@mui/material';

import { B3Table, TableColumnItem } from '@/components/table/B3Table';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { displayExtendedFormat } from '@/utils';

import { OrderHistoryItem, OrderStatusItem } from '../../../types';
import OrderStatus from '../../order/components/OrderStatus';
import { orderStatusTranslationVariables } from '../../order/shared/getOrderStatus';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

const HistoryListContainer = styled('div')((): CSSObject => ({
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

const HistoryCardContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})<{ isMobile: boolean }>(({ isMobile }): CSSObject => ({
  width: '100%',
  backgroundColor: '#FFFFFF',
  boxShadow: 'none',
  borderWidth: '0px 0.3px 0.3px 0px',
  borderStyle: 'solid',
  borderColor: '#000000',
  padding: isMobile ? '15px' : '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}));

const HistoryTitle = styled('div')((): CSSObject => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '20px',
  lineHeight: '28px',
  color: '#000000',
}));

const HistoryTableElement = styled('table')((): CSSObject => ({
  width: '100%',
  borderCollapse: 'collapse',
}));

const HistoryHeaderRow = styled('tr')((): CSSObject => ({
  borderBottom: '0.5px solid #000000',
}));

const HistoryHeaderCell = styled('th')<{ align?: 'left' | 'right' }>(
  ({ align = 'left' }): CSSObject => ({
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '20px',
    color: '#000000',
    textAlign: align,
    padding: '10px 0',
  }),
);

const HistoryRow = styled('tr')((): CSSObject => ({
  borderBottom: '0.5px solid #000000',
}));

const HistoryCell = styled('td')<{ align?: 'left' | 'right' }>(
  ({ align = 'left' }): CSSObject => ({
    fontFamily: 'Lato, sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '24px',
    color: '#000000',
    textAlign: align,
    padding: '12px 0',
    verticalAlign: 'middle',
  }),
);

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

  if (variant === 'orderDetail') {
    return (
      <HistoryCardContainer isMobile={isMobile}>
        <HistoryTitle>{b3Lang('orderDetail.history.title')}</HistoryTitle>
        <HistoryTableElement>
          <thead>
            <HistoryHeaderRow>
              <HistoryHeaderCell>
                {b3Lang('orderDetail.history.dateHeader')}
              </HistoryHeaderCell>
              <HistoryHeaderCell align="right">
                {b3Lang('orderDetail.history.statusHeader')}
              </HistoryHeaderCell>
            </HistoryHeaderRow>
          </thead>
          <tbody>
            {history.map((item) => (
              <HistoryRow key={item.id}>
                <HistoryCell>{String(displayExtendedFormat(item.createdAt))}</HistoryCell>
                <HistoryCell align="right">
                  <OrderStatus
                    code={item.status}
                    text={getOrderStatusLabel(item.status)}
                    variant="orderDetailHistory"
                    align="right"
                  />
                </HistoryCell>
              </HistoryRow>
            ))}
          </tbody>
        </HistoryTableElement>
      </HistoryCardContainer>
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
          <B3Table columnItems={defaultColumns} listItems={history} showPagination={false} />
        </HistoryListContainer>
      </CardContent>
    </Card>
  );
}
