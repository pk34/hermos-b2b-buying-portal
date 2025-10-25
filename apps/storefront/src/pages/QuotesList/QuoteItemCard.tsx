import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { useB3Lang } from '@/lib/lang';
import { currencyFormatConvert, displayFormat } from '@/utils';

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

const QuoteCard = styled(Card)({
  width: '100%',
  border: '0.2px solid #000000',
  borderRadius: '10px',
  backgroundColor: '#FFF',
  boxShadow: '0px 4px 22px 5px #0000001A',
  boxSizing: 'border-box',
  padding: '20px',
});

const CardBody = styled(CardContent)({
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  color: '#231F20',
});

const TitleRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
});

const TitleBlock = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
});

const PrimaryLabel = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 700,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#231F20',
});

const PrimaryValue = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#231F20',
  wordBreak: 'break-word',
});

const InfoGroup = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

const InfoRow = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
});

const SecondaryLabel = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 700,
  fontSize: '14px',
  lineHeight: '24px',
  color: '#231F20',
});

const SecondaryValue = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '24px',
  color: '#231F20',
  wordBreak: 'break-word',
});

export function QuoteItemCard(props: QuoteItemCardProps) {
  const { item, goToDetail } = props;
  const theme = useTheme();
  const b3Lang = useB3Lang();

  const primaryColor = theme.palette.primary.main;

  const getDisplayDate = (date?: number | string) => {
    if (date === null || date === undefined || date === '') {
      return '—';
    }

    if (Number(item.status) === 0) {
      return typeof date === 'string' ? date || '—' : String(date);
    }

    const numericDate = Number(date);

    if (Number.isNaN(numericDate) || numericDate === 0) {
      return '—';
    }

    return displayFormat(numericDate);
  };

  const getTotal = () => {
    const { grandTotal, totalAmount, currency } = item;
    const value = grandTotal ?? totalAmount;

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    return currencyFormatConvert(numericValue, {
      currency: currency as CurrencyProps,
      isConversionRate: false,
      useCurrentCurrency: !!currency,
    });
  };

  const titleValue = item.quoteTitle && item.quoteTitle !== '' ? item.quoteTitle : item.quoteNumber || '—';
  const currencyLabel = item.currency?.currencyCode || item.currency?.token || '—';

  return (
    <QuoteCard>
      <CardBody>
        <TitleRow>
          <TitleBlock>
            <PrimaryLabel component="span">{`${b3Lang('quotes.quoteItemCard.title')}:`}</PrimaryLabel>
            <PrimaryValue component="span">{titleValue || '—'}</PrimaryValue>
          </TitleBlock>
          {item.status ? <QuoteStatus code={item.status} /> : null}
        </TitleRow>

        <InfoGroup>
          <InfoRow>
            <PrimaryLabel component="span">{`${b3Lang('quotes.quoteItemCard.total')}:`}</PrimaryLabel>
            <PrimaryValue component="span">{getTotal()}</PrimaryValue>
          </InfoRow>
          <InfoRow>
            <PrimaryLabel component="span">{`${b3Lang('quotes.quoteItemCard.currency')}:`}</PrimaryLabel>
            <PrimaryValue component="span">{currencyLabel}</PrimaryValue>
          </InfoRow>
          <InfoRow>
            <SecondaryLabel component="span">{`${b3Lang('quotes.quoteItemCard.dateCreated')}:`}</SecondaryLabel>
            <SecondaryValue component="span">{getDisplayDate(item.createdAt)}</SecondaryValue>
          </InfoRow>
          <InfoRow>
            <SecondaryLabel component="span">{`${b3Lang('quotes.quoteItemCard.expirationDate')}:`}</SecondaryLabel>
            <SecondaryValue component="span">{getDisplayDate(item.expiredAt)}</SecondaryValue>
          </InfoRow>
        </InfoGroup>

        <Box
          onClick={() => goToDetail(item, Number(item.status))}
          sx={{
            mt: '8px',
            color: primaryColor || '#1976D2',
            cursor: 'pointer',
            fontWeight: 700,
            display: 'inline-block',
            fontFamily: "'Lato', sans-serif",
            fontSize: '14px',
            lineHeight: '24px',
          }}
        >
          {b3Lang('quotes.quoteItemCard.view')}
        </Box>
      </CardBody>
    </QuoteCard>
  );
}
