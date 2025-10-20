import { Box } from '@mui/material';
import styled from '@emotion/styled';

import { B3Tag } from '@/components';

import getOrderStatus from '../shared/getOrderStatus';

interface OrderStatusProps {
  code: string;
  text?: string;
}

const StatusTag = styled(B3Tag)(() => ({
  width: '166px',
  height: '34px',
  borderRadius: '20px',
  padding: '10px',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center',
}));

export default function OrderStatus(props: OrderStatusProps) {
  const { code, text } = props;

  const status = getOrderStatus(code);

  return status.name ? (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <StatusTag color={status.color} textColor="#000000">
        {text || status.name}
      </StatusTag>
    </Box>
  ) : null;
}
