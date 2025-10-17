import { PropsWithChildren } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { B3Tag } from '@/components';
import { useB3Lang } from '@/lib/lang';

import { AddressItemType } from '../../../types/address';

interface OrderItemCardProps {
  item: AddressItemType;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

interface TagBoxProps {
  marginBottom: number | string;
}

const TagBox = styled('div')<TagBoxProps>(({ marginBottom }) => ({
  marginBottom,
  marginLeft: '7px',
  '& > span:not(:last-child)': {
    marginRight: '4px',
  },
}));

interface TextBlockProps {
  marginBottom?: number | string;
}

const TextBlock = styled('div')<TextBlockProps>(({ marginBottom }) => ({
  marginTop: '9px',
  marginRight: 0,
  marginBottom: marginBottom ?? '9px',
  marginLeft: '7px',
}));

const textStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000',
  margin: 0,
  display: 'block',
} as const;

function Tag({ children }: PropsWithChildren) {
  return (
    <B3Tag color="#C4DD6C" textColor="rgba(0, 0, 0, 0.87)">
      {children}
    </B3Tag>
  );
}

function Text({ children }: PropsWithChildren) {
  return (
    <TextBlock>
      <Typography component="p" sx={textStyles}>
        {children}
      </Typography>
    </TextBlock>
  );
}

export function AddressItemCard({
  item: addressInfo,
}: OrderItemCardProps) {
  const theme = useTheme();
  const b3Lang = useB3Lang();

  const isDefaultShipping = addressInfo.isDefaultShipping === 1;
  const isDefaultBilling = addressInfo.isDefaultBilling === 1;

  return (
    <Card
      key={addressInfo.id}
      sx={{
        width: '327px',
        height: '194px',
        borderWidth: '0.2px',
        borderStyle: 'solid',
        borderColor: 'transparent',
        borderTop: '0.2px solid #000000',
        borderRadius: '10px',
        backgroundColor: '#FFF',
        padding: '20px',
        boxSizing: 'border-box',
        boxShadow: 'none',
      }}
    >
      <CardContent
        sx={{
          p: 0,
          color: '#313440',
          wordBreak: 'break-word',
        }}
      >
        {addressInfo.label && (
          <TextBlock
            marginBottom={
              isDefaultShipping || isDefaultBilling ? theme.spacing(1) : theme.spacing(3)
            }
          >
            <Typography
              component="p"
              sx={{
                ...textStyles,
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              {addressInfo.label}
            </Typography>
          </TextBlock>
        )}

        <TagBox marginBottom={isDefaultShipping || isDefaultBilling ? theme.spacing(3) : 0}>
          {isDefaultShipping && <Tag>{b3Lang('addresses.addressItemCard.defaultShipping')}</Tag>}
          {isDefaultBilling && <Tag>{b3Lang('addresses.addressItemCard.defaultBilling')}</Tag>}
        </TagBox>

        <Text>
          {addressInfo.firstName} {addressInfo.lastName}
        </Text>
        <Text>{addressInfo.company || ''}</Text>
        <Text>{addressInfo.addressLine1}</Text>
        <Text>{addressInfo.addressLine2 === 'undefined' ? '' : addressInfo.addressLine2}</Text>
        <Text>
          {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}, {addressInfo.country}
        </Text>
        <Text>{addressInfo.phoneNumber}</Text>
      </CardContent>
    </Card>
  );
}
