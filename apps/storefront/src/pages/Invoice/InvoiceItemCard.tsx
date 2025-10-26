import { ReactElement, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Typography } from '@mui/material';

import { TableColumnItem } from '@/components/table/B3Table';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { InvoiceList, InvoiceListNode } from '@/types/invoice';
import { currencyFormat, displayFormat } from '@/utils';

import B3Pulldown from './components/B3Pulldown';
import InvoiceStatus from './components/InvoiceStatus';
import PrintTemplate from './components/PrintTemplate';

interface InvoiceItemCardProps {
  item: any;
  checkBox?: (disable: boolean) => ReactElement;
  handleViewInvoice: (id: string, status: string | number, invoiceCompanyId: string) => void;
  setIsRequestLoading: (bool: boolean) => void;
  setInvoiceId: (id: string) => void;
  handleOpenDetails: (invoiceId: string) => void;
  selectedPay: CustomFieldItems | InvoiceListNode[];
  addBottom: boolean;
  isCurrentCompany: boolean;
  invoicePay: boolean;
}

const StyleCheckoutContainer = styled(Box)(() => ({
  '& > span': {
    padding: '0 9px 0 0',
  },
}));

export function InvoiceItemCard(props: InvoiceItemCardProps) {
  const currentDate = new Date().getTime();
  const {
    item,
    checkBox,
    handleViewInvoice,
    setIsRequestLoading,
    setInvoiceId,
    handleOpenDetails,
    selectedPay = [],
    addBottom,
    isCurrentCompany,
    invoicePay,
  } = props;
  const b3Lang = useB3Lang();
  const navigate = useNavigate();
  const [isMobile] = useMobile();

  const { id, status, dueDate, openBalance, companyInfo } = item;

  let statusCode = item.status;
  if (status === 0 && currentDate > dueDate * 1000) {
    statusCode = 3;
  }

  const columnAllItems: TableColumnItem<InvoiceList>[] = [
    {
      key: 'orderNumber',
      title: b3Lang('invoice.invoiceItemCardHeader.order'),
      render: () => (
        <Box
          role="button"
          sx={{
            color: '#000000',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() => {
            navigate(`/orderDetail/${item.orderNumber}`);
          }}
        >
          {item?.orderNumber || '-'}
        </Box>
      ),
    },
    {
      key: 'createdAt',
      title: b3Lang('invoice.invoiceItemCardHeader.quoteDate'),
      render: () => `${item.createdAt ? displayFormat(Number(item.createdAt)) : '–'}`,
    },
    {
      key: 'updatedAt',
      title: b3Lang('invoice.invoiceItemCardHeader.expirationDate'),
      render: () => {
        const { dueDate, status } = item;
        const isOverdue = currentDate > dueDate * 1000 && status !== 2;

        return (
          <Typography
            sx={{
              color: isOverdue ? '#D32F2F' : 'rgba(0, 0, 0, 0.87)',
              fontSize: '14px',
            }}
          >
            {`${item.dueDate ? displayFormat(Number(item.dueDate)) : '–'}`}
          </Typography>
        );
      },
    },
    {
      key: 'originalBalance',
      title: b3Lang('invoice.invoiceItemCardHeader.total'),
      render: () => {
        const { originalBalance } = item;
        const originalAmount = Number(originalBalance.value);

        return currencyFormat(originalAmount || 0);
      },
    },
    {
      key: 'openBalance',
      title: b3Lang('invoice.invoiceItemCardHeader.debtAmount'),
      render: () => {
        const { openBalance } = item;

        const openAmount = Number(openBalance.value);

        return currencyFormat(openAmount || 0);
      },
    },
    {
      key: 'currency',
      title: b3Lang('invoice.invoiceItemCardHeader.currency'),
      render: () => {
        const { originalBalance } = item;

        return openBalance?.code || originalBalance?.code || '-';
      },
    },
  ];

  const groupId = useId();

  const toNumber = (value: number | string | undefined) => {
    if (value === '.' || value === undefined || value === null) {
      return 0;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const invoiceTotalValue = toNumber(item?.originalBalance?.value);
  const pendingAmountValue = toNumber(openBalance?.value);
  const amountToPayValue = toNumber(item?.amountToPay ?? openBalance?.value);

  const mobileLabelStyles = {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    whiteSpace: 'nowrap' as const,
    marginRight: '16px',
  };

  const mobileValueStyles = {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    textAlign: 'right' as const,
  };

  const isOverdue = currentDate > dueDate * 1000 && status !== 2;

  const mobileDetails = [
    {
      key: 'orderNumber',
      label: b3Lang('invoice.invoiceItemCardHeader.order'),
      value: (
        <Box
          role="button"
          sx={{
            ...mobileValueStyles,
            color: '#000000',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() => {
            navigate(`/orderDetail/${item.orderNumber}`);
          }}
        >
          {item?.orderNumber || '-'}
        </Box>
      ),
    },
    {
      key: 'createdAt',
      label: b3Lang('invoice.invoiceItemCardHeader.quoteDate'),
      value: (
        <Typography sx={mobileValueStyles}>
          {item.createdAt ? displayFormat(Number(item.createdAt)) : '–'}
        </Typography>
      ),
    },
    {
      key: 'updatedAt',
      label: b3Lang('invoice.invoiceItemCardHeader.expirationDate'),
      value: (
        <Typography
          sx={{
            ...mobileValueStyles,
            color: isOverdue ? '#D32F2F' : mobileValueStyles.color,
          }}
        >
          {item.dueDate ? displayFormat(Number(item.dueDate)) : '–'}
        </Typography>
      ),
    },
    {
      key: 'originalBalance',
      label: b3Lang('invoice.invoiceItemCardHeader.total'),
      value: (
        <Typography sx={mobileValueStyles}>{currencyFormat(invoiceTotalValue || 0)}</Typography>
      ),
    },
    {
      key: 'openBalance',
      label: b3Lang('invoice.invoiceItemCardHeader.debtAmount'),
      value: (
        <Typography sx={mobileValueStyles}>{currencyFormat(pendingAmountValue || 0)}</Typography>
      ),
    },
    {
      key: 'amountToPay',
      label: b3Lang('invoice.invoiceItemCardHeader.amountToPay'),
      value: (
        <Typography sx={mobileValueStyles}>{currencyFormat(amountToPayValue || 0)}</Typography>
      ),
    },
    {
      key: 'currency',
      label: b3Lang('invoice.invoiceItemCardHeader.currency'),
      value: (
        <Typography sx={mobileValueStyles}>
          {openBalance?.code || item?.originalBalance?.code || '-'}
        </Typography>
      ),
    },
  ];

  return (
    <Card
      role="group"
      aria-labelledby={groupId}
      sx={{
        marginBottom: selectedPay.length > 0 && addBottom ? '5rem' : 0,
        ...(isMobile && {
          border: '0.2px solid #000000',
          boxShadow: '0px 4px 22px 5px #0000001A',
          transition: 'none',
        }),
      }}
    >
      <CardContent
        sx={{
          color: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '0.5rem',
            }}
          >
            <StyleCheckoutContainer>
              {checkBox && checkBox(!!item?.disableCurrentCheckbox)}
            </StyleCheckoutContainer>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
                ...(isMobile && {
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#000000',
                }),
              }}
            >
              <Box
                id={groupId}
                role="button"
                sx={{
                  color: '#000000',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  ...(isMobile && {
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '24px',
                  }),
                }}
                onClick={() => {
                  handleViewInvoice(id, status, companyInfo.companyId);
                }}
              >
                {id || '-'}
              </Box>
            </Typography>
          </Box>
          <Box sx={{ mb: '0.5rem' }}>
            <B3Pulldown
              row={item}
              setInvoiceId={setInvoiceId}
              handleOpenDetails={handleOpenDetails}
              setIsRequestLoading={setIsRequestLoading}
              isCurrentCompany={isCurrentCompany}
              invoicePay={invoicePay}
            />
          </Box>
        </Box>
        <Box sx={{ mb: '1rem' }}>
          <InvoiceStatus code={statusCode} />
        </Box>

        {isMobile
          ? mobileDetails.map((detail) => (
              <Box
                key={detail.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: '4px',
                  width: '100%',
                  gap: '16px',
                }}
              >
                <Typography sx={mobileLabelStyles}>{`${detail.label}:`}</Typography>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  {detail.value}
                </Box>
              </Box>
            ))
          : columnAllItems.map((list: CustomFieldItems) => (
              <Box
                key={list.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: '4px',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    color: 'rgba(0, 0, 0, 0.87)',
                    mr: '5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {`${list.title}:`}
                </Typography>
                <Box
                  sx={{
                    color: 'black',
                    wordBreak: 'break-all',
                  }}
                >
                  {list?.render ? list.render() : item[list.key]}
                </Box>
              </Box>
            ))}
      </CardContent>
      {item?.isCollapse && (
        <Box sx={{ padding: '0 16px 16px' }}>
          <PrintTemplate row={item} />
        </Box>
      )}
    </Card>
  );
}
