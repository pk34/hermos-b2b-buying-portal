import styled from '@emotion/styled';
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

const QuoteCard = styled(Card)(({ theme }) => ({
  width: '100%',
  border: '0.2px solid #000000',
  borderRadius: '10px',
  backgroundColor: '#FFFFFF',
  boxShadow: '0px 4px 22px 5px rgba(0, 0, 0, 0.1)',
  boxSizing: 'border-box',
  padding: '20px',
  display: 'block',
  color: 'rgba(0, 0, 0, 0.87)',
  overflow: 'hidden',
  transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  textAlign: 'left',
  cursor: 'pointer',
  appearance: 'none',
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

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
  flex: 1,
  minWidth: 0,
});

const PrimaryLabel = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 700,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#231F20',
  display: 'inline',
});

const PrimaryValue = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#231F20',
  wordBreak: 'break-word',
  display: 'inline',
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
  display: 'inline',
});

const SecondaryValue = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '24px',
  color: '#231F20',
  wordBreak: 'break-word',
  display: 'inline',
});

const StandalonePrimaryValue = styled(PrimaryValue)({
  display: 'block',
});

export function QuoteItemCard(props: QuoteItemCardProps) {
  const { item, goToDetail } = props;
  const b3Lang = useB3Lang();

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

    const formatted = displayFormat(numericDate);

    return formatted ? String(formatted) : '—';
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
  const currencyRaw = item.currency?.currencyCode ?? item.currency?.token;
  const currencyLabel = currencyRaw ? String(currencyRaw) : '—';

  const handleNavigate = () => {
    goToDetail(item, Number(item.status));
  };

  return (
    <QuoteCard component="button" type="button" onClick={handleNavigate}>
      <CardBody>
        <TitleRow>
          <TitleBlock>
            <PrimaryLabel>{`${b3Lang('quotes.quoteItemCard.title')}:`}</PrimaryLabel>
            <PrimaryValue>{titleValue || '—'}</PrimaryValue>
          </TitleBlock>
          {item.status ? <QuoteStatus code={item.status} /> : null}
        </TitleRow>

        <InfoGroup>
          <StandalonePrimaryValue>{getTotal()}</StandalonePrimaryValue>
          <StandalonePrimaryValue>{currencyLabel}</StandalonePrimaryValue>
          <InfoRow>
            <SecondaryLabel>{`${b3Lang('quotes.quoteItemCard.dateCreated')}:`}</SecondaryLabel>
            <SecondaryValue>{getDisplayDate(item.createdAt)}</SecondaryValue>
          </InfoRow>
          <InfoRow>
            <SecondaryLabel>{`${b3Lang('quotes.quoteItemCard.expirationDate')}:`}</SecondaryLabel>
            <SecondaryValue>{getDisplayDate(item.expiredAt)}</SecondaryValue>
          </InfoRow>
        </InfoGroup>
      </CardBody>
    </QuoteCard>
  );
}
