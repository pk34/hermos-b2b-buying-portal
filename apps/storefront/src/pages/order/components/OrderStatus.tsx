import { Box } from '@mui/material';
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import type { SxProps, Theme } from '@mui/material/styles';

import { B3Tag } from '@/components';
import { statusTagBaseStyles } from '@/components/statusTagStyles';

import getOrderStatus from '../shared/getOrderStatus';

type OrderStatusVariant = 'default' | 'orderDetailHeader' | 'orderDetailHistory';

type OrderStatusAlignment = 'left' | 'center' | 'right';

interface OrderStatusProps {
  code: string;
  text?: string;
  variant?: OrderStatusVariant;
  align?: OrderStatusAlignment;
}

interface StatusTagProps {
  variant?: OrderStatusVariant;
}

const StatusTag = styled(B3Tag, {
  shouldForwardProp: (prop) => prop !== 'variant',
})<StatusTagProps>(({ variant = 'default' }): CSSObject => {
  const baseStyles: CSSObject = {
    ...statusTagBaseStyles,
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
      width: 'auto',
      minWidth: 'auto',
    };
  }

  return baseStyles;
});

export default function OrderStatus(props: OrderStatusProps) {
  const { code, text, variant = 'default', align = 'center' } = props;

  const status = getOrderStatus(code);

  if (!status.name) {
    return null;
  }

  const justifyContent: CSSObject['justifyContent'] =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  const containerStyles: SxProps<Theme> =
    variant === 'default'
      ? {
          width: '100%',
          display: 'flex',
          justifyContent,
          alignItems: 'center',
        }
      : {
          display: 'flex',
          alignItems: 'center',
          justifyContent,
        };

  const textColor = variant === 'default' ? '#F7F7F7' : '#FFFFFF';

  return (
    <Box sx={containerStyles}>
      <StatusTag color={status.color} textColor={textColor} variant={variant}>
        {text || status.name}
      </StatusTag>
    </Box>
  );
}
