import { Box } from '@mui/material';
import styled from '@emotion/styled';

import { B3Tag } from '@/components';

import getOrderStatus from '../shared/getOrderStatus';

interface OrderStatusProps {
  code: string;
  text?: string;
}

const StatusTag = styled(B3Tag)`
  width: 166px;
  height: 34px;
  border-radius: 20px;
  padding: 10px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Lato', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
`;

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
