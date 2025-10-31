import styled from '@emotion/styled';

import { B3Tag } from '@/components';
import { LangFormatFunction, useB3Lang } from '@/lib/lang';

interface OrderStatusProps {
  code: string;
}

interface QuoteStatusObj {
  [x: string]: {
    textColor: string;
    idLang: string;
    color: string;
  };
}

const StatusTag = styled(B3Tag)`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Lato, sans-serif';
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  border-radius: 20px;
  padding: 16px;
  height: 34px;
  color: #231f20;
  white-space: nowrap;
`;

const quoteStatus: QuoteStatusObj = {
  '0': {
    textColor: '#231F20',
    idLang: 'global.quoteStatusCode.draft',
    color: '#D8D6D1',
  },
  '1': {
    textColor: '#231F20',
    idLang: 'global.quoteStatusCode.open',
    color: '#F1C224',
  },
  '4': {
    textColor: '#231F20',
    idLang: 'global.quoteStatusCode.ordered',
    color: '#C4DD6C',
  },
  '5': {
    textColor: '#231F20',
    idLang: 'global.quoteStatusCode.expired',
    color: '#BD3E1E',
  },
};

const getOrderStatus = (code: string, b3Lang: LangFormatFunction) => {
  const status = quoteStatus[code];

  if (!status) {
    return undefined;
  }

  const { idLang, ...restQuoteStatus } = status;

  return { ...restQuoteStatus, name: b3Lang(idLang) };
};

export default function QuoteStatus(props: OrderStatusProps) {
  const b3Lang = useB3Lang();
  const { code } = props;

  const status = getOrderStatus(code, b3Lang);

  if (!status?.name) {
    return null;
  }

  return (
    <StatusTag color={status.color} textColor={status.textColor}>{status.name}</StatusTag>
  );
}
