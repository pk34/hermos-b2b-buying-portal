import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { useB3Lang } from '@/lib/lang';
import { currencyFormat, currencyFormatConvert, displayFormat } from '@/utils';

import QuoteStatus from '../quote/components/QuoteStatus';

export interface QuoteListItem {
  [key: string]: string | number | CurrencyProps | null | undefined;
  status: string;
  quoteNumber: string;
  quoteTitle?: string;
  salesRepEmail?: string;
  createdBy?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
  expiredAt?: number | string;
  grandTotal?: string | number;
  totalAmount?: string | number;
  currency?: CurrencyProps | null;
}

interface QuoteItemCardProps {
  goToDetail: (val: QuoteListItem, status: number) => void;
  item: QuoteListItem;
}

export function QuoteItemCard(props: QuoteItemCardProps) {
  const { item, goToDetail } = props;
  const theme = useTheme();
  const b3Lang = useB3Lang();

  const primaryColor = theme.palette.primary.main;
  const title = item.quoteTitle || item.quoteNumber;

  const getFormattedDate = (value?: QuoteListItem[keyof QuoteListItem]) => {
    if (value === undefined || value === null) {
      return '—';
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || Number(item.status) === 0) {
      return String(value);
    }

    return displayFormat(numericValue);
  };

  const formatTotal = () => {
    const { grandTotal, totalAmount, currency } = item;
    const amount = grandTotal ?? totalAmount;

    if (amount === undefined || amount === null) {
      return '—';
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return String(amount);
    }

    if (currency) {
      return currencyFormatConvert(numericAmount, {
        currency: currency as CurrencyProps,
        isConversionRate: false,
        useCurrentCurrency: true,
      });
    }

    return currencyFormat(numericAmount);
  };

  const currencyLabel = (() => {
    const { currency } = item;

    if (!currency) {
      return '—';
    }

    return currency.currencyCode || currency.token || '—';
  })();

  const infoLabelSx = {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: '24px',
    color: '#231F20',
    marginRight: theme.spacing(1),
    whiteSpace: 'nowrap',
  } as const;

  const infoValueSx = {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '24px',
    color: '#231F20',
    wordBreak: 'break-word',
  } as const;

  return (
    <Card
      sx={{
        width: '100%',
        border: '0.2px solid #000000',
        borderRadius: '10px',
        backgroundColor: '#FFF',
        padding: '20px',
        boxSizing: 'border-box',
        boxShadow: '0px 4px 22px 5px #0000001A',
      }}
    >
      <CardContent
        sx={{
          p: 0,
          color: '#231F20',
          '&:last-child': {
            pb: 0,
          },
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(1),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: theme.spacing(2),
          }}
        >
          <Typography
            component="h3"
            sx={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#231F20',
              margin: 0,
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              flexShrink: 0,
              '& > span': {
                width: 'auto',
                minWidth: 'auto',
                height: '34px',
                padding: '10px',
              },
            }}
          >
            <QuoteStatus code={item.status} />
          </Box>
        </Box>

        <Typography
          sx={{
            fontFamily: "'Lato', sans-serif",
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#231F20',
          }}
        >
          {formatTotal()}
        </Typography>

        <Typography
          sx={{
            fontFamily: "'Lato', sans-serif",
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#231F20',
          }}
        >
          {currencyLabel}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(0.5),
            marginTop: theme.spacing(1),
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={infoLabelSx}>{b3Lang('quotes.quoteItemCard.dateCreated')}:</Typography>
            <Typography sx={infoValueSx}>{getFormattedDate(item.createdAt)}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={infoLabelSx}>{b3Lang('quotes.quoteItemCard.expirationDate')}:</Typography>
            <Typography sx={infoValueSx}>{getFormattedDate(item.expiredAt)}</Typography>
          </Box>
        </Box>

        <Box
          onClick={() => goToDetail(item, Number(item.status))}
          sx={{
            mt: theme.spacing(2),
            pl: 0,
            color: primaryColor || '#1976D2',
            cursor: 'pointer',
            fontFamily: "'Lato', sans-serif",
            fontWeight: 700,
            fontSize: '14px',
            lineHeight: '24px',
            display: 'inline-block',
          }}
        >
          {b3Lang('quotes.quoteItemCard.view')}
        </Box>
      </CardContent>
    </Card>
  );
}
