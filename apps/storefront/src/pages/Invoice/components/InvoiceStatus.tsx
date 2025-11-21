import { Box } from '@mui/material';

import { B3Tag } from '@/components';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';

interface StatusProps {
  code: InvoiceStatusCode;
}

interface InvoiceStatusProps {
  [key: string]: {
    [key: string]: string;
  };
}

export enum InvoiceStatusCode {
  Open = 0,
  PartiallyPaid = 1,
  Paid = 2,
  Overdue = 3,
}

export default function InvoiceStatus(props: StatusProps) {
  const { code } = props;
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const getInvoiceStatus = (code: number) => {
    const invoiceStatus: InvoiceStatusProps = {
      [InvoiceStatusCode.Open]: {
        textColor: '#000000',
        name: b3Lang('invoice.filterStatus.open'),
        color: '#F1C224',
      },
      [InvoiceStatusCode.PartiallyPaid]: {
        textColor: '#FFFFFF',
        name: b3Lang('invoice.filterStatus.partiallyPaid'),
        color: '#516FAE',
      },
      [InvoiceStatusCode.Paid]: {
        textColor: '#000000',
        name: b3Lang('invoice.filterStatus.paid'),
        color: '#C4DD6C',
      },
      [InvoiceStatusCode.Overdue]: {
        textColor: '#FFFFFF',
        name: b3Lang('invoice.filterStatus.overdue'),
        color: '#D32F2F',
      },
    };

    const statusInfo = invoiceStatus[code] || {};

    return statusInfo;
  };

  const status = getInvoiceStatus(code);

  if (!status.name) {
    return null;
  }

  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '34px',
          borderRadius: '20px',
          padding: '10px',
          fontFamily: 'Lato, sans-serif',
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          color: '#000000',
          backgroundColor: status.color,
        }}
      >
        {status.name}
      </Box>
    );
  }

  return (
    <B3Tag color={status.color} textColor={status.textColor}>
      {status.name}
    </B3Tag>
  );
}
