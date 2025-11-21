import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { currencyFormatConvert } from '@/utils';

interface Summary {
  originalSubtotal: string | number;
  discount: string | number;
  tax: string | number;
  shipping: string | number;
  totalAmount: string | number;
}

interface QuoteDetailSummaryProps {
  quoteSummary: Summary;
  quoteDetailTax: number;
  status: string;
  quoteDetail: CustomFieldItems;
  isHideQuoteCheckout: boolean;
}

export default function QuoteDetailSummary({
  quoteSummary: { originalSubtotal, discount, tax, shipping, totalAmount },
  quoteDetailTax = 0,
  status,
  quoteDetail,
  isHideQuoteCheckout,
}: QuoteDetailSummaryProps) {
  const b3Lang = useB3Lang();
  const enteredInclusiveTax = useAppSelector(
    ({ storeConfigs }) => storeConfigs.currencies.enteredInclusiveTax,
  );
  const showInclusiveTaxPrice = useAppSelector(({ global }) => global.showInclusiveTaxPrice);

  const getCurrentPrice = (price: number, quoteDetailTax: number) => {
    if (enteredInclusiveTax) {
      return showInclusiveTaxPrice ? price : price - quoteDetailTax;
    }
    return showInclusiveTaxPrice ? price + quoteDetailTax : price;
  };

  const priceFormat = (price: number) =>
    currencyFormatConvert(price, {
      currency: quoteDetail.currency,
      isConversionRate: false,
      useCurrentCurrency: !!quoteDetail.currency,
    });

  const getShippingAndTax = () => {
    if (quoteDetail?.shippingMethod?.id) {
      return {
        shippingText: `${b3Lang('quoteDetail.summary.shipping')}(${
          quoteDetail?.shippingMethod?.description || ''
        })`,
        shippingVal: priceFormat(Number(shipping)),
        taxText: b3Lang('quoteDetail.summary.tax'),
        taxVal: priceFormat(Number(tax)),
      };
    }

    if (!quoteDetail?.salesRepEmail && !quoteDetail?.shippingMethod?.id && Number(status) === 1) {
      return {
        shippingText: b3Lang('quoteDetail.summary.shipping'),
        shippingVal: b3Lang('quoteDetail.summary.tbd'),
        taxText: b3Lang('quoteDetail.summary.estimatedTax'),
        taxVal: priceFormat(Number(tax)),
      };
    }

    if (
      quoteDetail?.salesRepEmail &&
      !quoteDetail?.shippingMethod?.id &&
      (Number(status) === 1 || Number(status) === 5)
    ) {
      return {
        shippingText: `${b3Lang('quoteDetail.summary.shipping')}(${b3Lang(
          'quoteDetail.summary.quoteCheckout',
        )})`,
        shippingVal: b3Lang('quoteDetail.summary.tbd'),
        taxText: b3Lang('quoteDetail.summary.tax'),
        taxVal: b3Lang('quoteDetail.summary.tbd'),
      };
    }

    return null;
  };

  const shippingAndTax = getShippingAndTax();

  const showPrice = (price: string | number): string | number => {
    if (isHideQuoteCheckout) return b3Lang('quoteDraft.quoteSummary.tbd');

    return price;
  };

  const subtotalPrice = Number(originalSubtotal);
  const quotedSubtotal = Number(originalSubtotal) - Number(discount);
  const titleStyles = {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: '28px',
    color: '#000000',
    marginBottom: '20px',
  } as const;

  const labelStyles = {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  } as const;

  const valueStyles = {
    ...labelStyles,
    textAlign: 'right' as const,
  };

  const grandTotalStyles = {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 700,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  } as const;

  return (
    <Card
      sx={{
        boxShadow: 'none',
        borderWidth: '0px 0.3px 0.3px 0px',
        borderStyle: 'solid',
        borderColor: '#000000',
        borderRadius: 0,
      }}
    >
      <CardContent
        sx={{
          padding: '20px 20px 8px',
          '&:last-child': {
            paddingBottom: '8px',
          },
        }}
      >
        <Box>
          <Typography sx={titleStyles}>{b3Lang('quoteDetail.summary.quoteSummary')}</Typography>
          <Box>
            {quoteDetail?.displayDiscount && (
              <Grid
                container
                justifyContent="space-between"
                sx={{
                  margin: '4px 0',
                }}
              >
                <Typography sx={labelStyles}>
                  {b3Lang('quoteDetail.summary.originalSubtotal')}
                </Typography>
                <Typography sx={valueStyles}>
                  {showPrice(priceFormat(getCurrentPrice(subtotalPrice, quoteDetailTax)))}
                </Typography>
              </Grid>
            )}

            {!quoteDetail?.salesRepEmail && Number(status) === 1 ? null : (
              <Grid
                container
                justifyContent="space-between"
                sx={{
                  margin: '4px 0',
                  display: quoteDetail?.displayDiscount ? '' : 'none',
                }}
              >
                <Typography sx={labelStyles}>
                  {b3Lang('quoteDetail.summary.discountAmount')}
                </Typography>
                <Typography sx={valueStyles}>
                  {Number(discount) > 0
                    ? `-${priceFormat(Number(discount))}`
                    : priceFormat(Number(discount))}
                </Typography>
              </Grid>
            )}

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '4px 0',
              }}
            >
              <Typography sx={labelStyles}>
                {b3Lang('quoteDetail.summary.quotedSubtotal')}
              </Typography>
              <Typography sx={valueStyles}>
                {showPrice(priceFormat(getCurrentPrice(quotedSubtotal, quoteDetailTax)))}
              </Typography>
            </Grid>

            {shippingAndTax && (
              <>
                <Grid
                  container
                justifyContent="space-between"
                sx={{
                  margin: '4px 0',
                }}
              >
                <Typography
                  sx={{
                    ...labelStyles,
                    maxWidth: '70%',
                    wordBreak: 'break-word',
                  }}
                >
                  {shippingAndTax.shippingText}
                </Typography>
                <Typography sx={valueStyles}>{showPrice(shippingAndTax.shippingVal)}</Typography>
              </Grid>
              <Grid
                container
                justifyContent="space-between"
                sx={{
                  margin: '4px 0',
                }}
              >
                <Typography sx={labelStyles}>{shippingAndTax.taxText}</Typography>
                <Typography sx={valueStyles}>{showPrice(shippingAndTax.taxVal)}</Typography>
              </Grid>
            </>
          )}

            <Grid
              container
              justifyContent="space-between"
              sx={{
                margin: '15px 0 0',
              }}
            >
              <Typography sx={grandTotalStyles}>
                {b3Lang('quoteDetail.summary.grandTotal')}
              </Typography>
              <Typography sx={{ ...grandTotalStyles, textAlign: 'right' }}>
                {showPrice(priceFormat(Number(totalAmount)))}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
