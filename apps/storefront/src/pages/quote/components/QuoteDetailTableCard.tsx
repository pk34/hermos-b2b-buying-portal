import { Box, CardContent, styled, Typography } from '@mui/material';

import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { currencyFormatConvert } from '@/utils';
import { getBCPrice } from '@/utils/b3Product/b3Product';

interface QuoteTableCardProps {
  item: any;
  len: number;
  getTaxRate: (taxClassId: number, variants: any) => number;
  itemIndex?: number;
  showPrice: (price: string, row: CustomFieldItems) => string | number;
  displayDiscount: boolean;
  currency: CurrencyProps;
}

const StyledImageWrapper = styled('div')(() => ({
  width: '85px',
  height: '85px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '0.5rem',
  flexShrink: 0,
}));

const StyledImage = styled('img')(() => ({
  maxWidth: '100%',
  maxHeight: '100%',
  width: 'auto',
  height: 'auto',
}));

const TABLE_DATA_TYPOGRAPHY_SX = {
  fontFamily: 'Poppins',
  fontWeight: 300,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#000000',
} as const;

function QuoteDetailTableCard(props: QuoteTableCardProps) {
  const {
    item: quoteTableItem,
    len,
    itemIndex,
    getTaxRate,
    showPrice,
    currency,
    displayDiscount,
  } = props;
  const b3Lang = useB3Lang();
  const enteredInclusiveTax = useAppSelector(
    ({ storeConfigs }) => storeConfigs.currencies.enteredInclusiveTax,
  );

  const {
    basePrice,
    quantity,
    imageUrl,
    productName,
    options,
    sku,
    notes,
    offeredPrice,
    productsSearch: { productUrl, variants = [], taxClassId },
  } = quoteTableItem;

  const taxRate = getTaxRate(taxClassId, variants);
  const taxPrice = enteredInclusiveTax
    ? (Number(basePrice) * taxRate) / (1 + taxRate)
    : Number(basePrice) * taxRate;
  const discountTaxPrice = enteredInclusiveTax
    ? (Number(offeredPrice) * taxRate) / (1 + taxRate)
    : Number(offeredPrice) * taxRate;

  const price = getBCPrice(Number(basePrice), taxPrice);
  const discountPrice = getBCPrice(Number(offeredPrice), discountTaxPrice);

  const isDiscount = Number(basePrice) - Number(offeredPrice) > 0 && displayDiscount;

  const total = Number(price) * Number(quantity);
  const totalWithDiscount = discountPrice * Number(quantity);

  return (
    <Box
      key={quoteTableItem.id}
      width="100%"
      sx={{
        borderTop: '0.5px solid #000000',
        borderBottom: itemIndex === len - 1 ? '0.5px solid #000000' : '',
      }}
    >
      <CardContent
        sx={{
          color: '#000000',
          display: 'flex',
          pl: 0,
        }}
      >
        <StyledImageWrapper>
          <StyledImage src={imageUrl || PRODUCT_DEFAULT_IMAGE} alt="Product-img" loading="lazy" />
        </StyledImageWrapper>
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Typography
            variant="body1"
            onClick={() => {
              const {
                location: { origin },
              } = window;

              if (productUrl) {
                window.location.href = `${origin}${productUrl}`;
              }
            }}
            sx={{
              ...TABLE_DATA_TYPOGRAPHY_SX,
              cursor: 'pointer',
            }}
          >
            {productName}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              ...TABLE_DATA_TYPOGRAPHY_SX,
            }}
          >
            {sku}
          </Typography>
          <Box
            sx={{
              margin: '1rem 0',
            }}
          >
            {options.length > 0 && (
              <Box>
                {options.map((option: any) => (
                  <Typography
                    sx={{
                      ...TABLE_DATA_TYPOGRAPHY_SX,
                    }}
                    key={option.optionName}
                  >
                    {`${option.optionName}: ${option.optionLabel}`}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
          <Typography
            variant="body1"
            sx={{
              ...TABLE_DATA_TYPOGRAPHY_SX,
            }}
          >
            {notes}
          </Typography>

          <Typography
            sx={{
              ...TABLE_DATA_TYPOGRAPHY_SX,
            }}
          >
            {b3Lang('quoteDetail.tableCard.price')}
            {isDiscount && (
              <Typography
                component="span"
                sx={{
                  ...TABLE_DATA_TYPOGRAPHY_SX,
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
              >
                {`${showPrice(
                  currencyFormatConvert(price, {
                    currency,
                  }),
                  quoteTableItem,
                )}`}
              </Typography>
            )}
            <Typography
              component="span"
              sx={{
                ...TABLE_DATA_TYPOGRAPHY_SX,
                marginLeft: '5px',
              }}
            >
              {`${showPrice(
                currencyFormatConvert(offeredPrice, {
                  currency,
                }),
                quoteTableItem,
              )}`}
            </Typography>
          </Typography>

          <Typography
            sx={{
              ...TABLE_DATA_TYPOGRAPHY_SX,
              padding: '12px 0',
            }}
          >
            {b3Lang('quoteDetail.tableCard.qty', { quantity })}
          </Typography>

          <Typography
            sx={{
              ...TABLE_DATA_TYPOGRAPHY_SX,
            }}
          >
            {b3Lang('quoteDetail.tableCard.total')}
            {isDiscount && (
              <Typography
                component="span"
                sx={{
                  ...TABLE_DATA_TYPOGRAPHY_SX,
                  marginLeft: '5px',
                  textDecoration: 'line-through',
                }}
              >
                {`${showPrice(
                  currencyFormatConvert(total, {
                    currency,
                  }),
                  quoteTableItem,
                )}`}
              </Typography>
            )}
            <Typography
              component="span"
              sx={{
                ...TABLE_DATA_TYPOGRAPHY_SX,
                marginLeft: '5px',
              }}
            >
              {`${showPrice(
                currencyFormatConvert(totalWithDiscount, {
                  currency,
                }),
                quoteTableItem,
              )}`}
            </Typography>
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );
}

export default QuoteDetailTableCard;
