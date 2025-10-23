import { Box } from '@mui/material';
import styled from '@emotion/styled';

import { B3Tag } from '@/components';

import getOrderStatus from '../shared/getOrderStatus';

type OrderStatusVariant = 'default' | 'orderDetailHeader' | 'orderDetailHistory';

interface OrderStatusProps {
  code: string;
  text?: string;
  variant?: OrderStatusVariant;
}

interface StatusTagProps {
  variant?: OrderStatusVariant;
}

const StatusTag = styled(B3Tag)<StatusTagProps>(({ variant = 'default' }) => {
  const baseStyles = {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'center' as const,
    borderRadius: '20px',
    padding: '10px',
    height: '34px',
  };

  if (variant === 'orderDetailHeader') {
    return {
      ...baseStyles,
      width: 'auto',
      minWidth: 'auto',
    };
  }

  if (variant === 'orderDetailHistory') {
    return {
      ...baseStyles,
      width: '194px',
      minWidth: '194px',
    };
  }

  return {
    ...baseStyles,
    width: '166px',
  };
});

export default function OrderStatus(props: OrderStatusProps) {
  const { code, text, variant = 'default' } = props;

  const status = getOrderStatus(code);

  if (!status.name) {
    return null;
  }

  const containerStyles =
    variant === 'default'
      ? { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }
      : { display: 'flex', alignItems: 'center' };

  const textColor = variant === 'default' ? '#000000' : '#FFFFFF';

  return (
    <Box sx={containerStyles}>
      <StatusTag color={status.color} textColor={textColor} variant={variant}>
        {text || status.name}
      </StatusTag>
    </Box>
  );
}
