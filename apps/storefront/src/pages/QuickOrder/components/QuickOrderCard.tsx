import { ReactElement } from 'react';
import { Box, CardContent, styled, Typography } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useB3Lang } from '@/lib/lang';
import { currencyFormat, displayFormat } from '@/utils';

import QuickOrderQuantitySelector from './QuickOrderQuantitySelector';
import b2bGetVariantImageByVariantInfo from '@/utils/b2bGetVariantImageByVariantInfo';

interface QuickOrderCardProps {
  item: any;
  checkBox?: () => ReactElement;
  handleUpdateProductQty: (id: number, val: string) => void;
}

const StyledImage = styled('img')(() => ({
  width: '85px',
  height: '85px',
  objectFit: 'cover',
  marginRight: '16px',
}));

const productInfoTextStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#000000',
} as const;

const optionTextStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '16px',
  color: '#000000',
} as const;

const cardContentStyles = {
  display: 'flex',
  flexDirection: 'row',
  padding: '16px',
  paddingLeft: 0,
  gap: '16px',
  '@media (max-width: 900px)': {
    flexDirection: 'row',
    paddingLeft: '16px',
  },
} as const;

const productDetailsWrapperStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
} as const;

const quantityWrapperStyles = {
  marginTop: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
} as const;

const cardContainerStyles = {
  borderStyle: 'solid',
  borderColor: '#000000',
  borderWidth: '0px 0.3px 0.3px 0px',
} as const;

function QuickOrderCard(props: QuickOrderCardProps) {
  const { item: shoppingDetail, checkBox, handleUpdateProductQty } = props;
  const b3Lang = useB3Lang();

  const {
    quantity,
    imageUrl,
    productName,
    variantSku,
    optionList,
    basePrice,
    lastOrderedAt,
    variantId,
    productsSearch,
  } = shoppingDetail;

  const price = Number(basePrice) * Number(quantity);
  const currentVariants = productsSearch.variants || [];
  const currentImage = b2bGetVariantImageByVariantInfo(currentVariants, { variantId }) || imageUrl;

  return (
    <Box key={shoppingDetail.id} sx={cardContainerStyles}>
      <CardContent sx={cardContentStyles}>
        <Box>{checkBox && checkBox()}</Box>
        <Box>
          <StyledImage
            src={currentImage || PRODUCT_DEFAULT_IMAGE}
            alt="Product-img"
            loading="lazy"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={productInfoTextStyles}>{productName}</Typography>
          <Typography sx={productInfoTextStyles}>{variantSku}</Typography>
          <Box sx={productDetailsWrapperStyles}>
            {optionList.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {optionList.map((option: CustomFieldItems) => (
                  <Typography sx={optionTextStyles} key={option.display_name}>
                    {`${option.display_name}: ${option.display_value}`}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>

          <Typography sx={productInfoTextStyles}>
            {`${b3Lang('purchasedProducts.price')}: ${currencyFormat(price)}`}
          </Typography>
          <Box sx={quantityWrapperStyles}>
            <QuickOrderQuantitySelector
              value={quantity}
              onChange={(val) => {
                handleUpdateProductQty(shoppingDetail.id, val);
              }}
            />
          </Box>

          <Typography sx={productInfoTextStyles}>
            {`${b3Lang('purchasedProducts.lastOrdered')}: ${displayFormat(lastOrderedAt)}`}
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );
}

export default QuickOrderCard;
