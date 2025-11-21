import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';
import { BcCartData, BcCartDataLineItem, InvoiceListNode } from '@/types/invoice';
import { handleGetCorrespondingCurrencyToken, snackbar } from '@/utils';

import { formattingNumericValues, gotoInvoiceCheckoutUrl } from '../utils/payment';

interface InvoiceFooterProps {
  selectedPay: CustomFieldItems;
  decimalPlaces: number;
}

function InvoiceFooter(props: InvoiceFooterProps) {
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();
  const [selectedAccount, setSelectedAccount] = useState<number | string>(0);
  const [currentToken, setCurrentToken] = useState<string>('$');

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const { selectedPay, decimalPlaces } = props;

  const handlePay = async () => {
    const lineItems: BcCartDataLineItem[] = [];
    let currency = 'SGD';

    if (selectedPay.length > 0) {
      selectedPay.forEach((item: InvoiceListNode) => {
        const {
          node: { id, openBalance, originalBalance },
        } = item;

        const currentValue =
          formattingNumericValues(Number(openBalance.originValue), decimalPlaces) ===
          openBalance.value
            ? Number(openBalance.originValue)
            : Number(openBalance.value);
        lineItems.push({
          invoiceId: Number(id),
          amount: openBalance.value === '.' ? '0' : `${Number(currentValue)}`,
        });

        currency = openBalance?.code || originalBalance.code;
      });

      const badItem = lineItems.find(
        (item: CustomFieldItems) => item.amount === '.' || Number(item.amount) === 0,
      );
      if (badItem) {
        snackbar.error(b3Lang('invoice.footer.invalidNameError'));

        return;
      }

      const params: BcCartData = {
        lineItems,
        currency,
      };

      await gotoInvoiceCheckoutUrl(params, platform, false);
    }
  };

  useEffect(() => {
    if (selectedPay.length > 0) {
      const handleStatisticsInvoiceAmount = (checkedArr: CustomFieldItems) => {
        let amount = 0;

        checkedArr.forEach((item: InvoiceListNode) => {
          const {
            node: { openBalance },
          } = item;
          amount += openBalance.value === '.' ? 0 : Number(openBalance.value);
        });

        setSelectedAccount(formattingNumericValues(amount, decimalPlaces));
      };
      const {
        node: { openBalance },
      } = selectedPay[0];

      const token = handleGetCorrespondingCurrencyToken(openBalance.code);
      setCurrentToken(token);
      handleStatisticsInvoiceAmount(selectedPay);
    }
  }, [decimalPlaces, selectedPay]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '62px' : '10px',
        left: 0,
        width: '100%',
        height: '60px',
        backgroundColor: '#00965E',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '0 16px' : '0 40px',
        zIndex: '999',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#FFFFFF',
          }}
        >
          {b3Lang('invoice.footer.totalPayment', {
            total: `${currentToken}${selectedAccount}`,
          })}
        </Typography>
        <Button
          variant="contained"
          sx={{
            width: 'auto',
            height: '40px',
            borderRadius: '5px',
            padding: '10px',
            marginLeft: '10px',
            backgroundColor: '#0067A0',
            fontFamily: 'Lato, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '24px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: '#005280',
            },
          }}
          onClick={() => {
            handlePay();
          }}
        >
          {b3Lang('invoice.footer.payInvoices')}
        </Button>
      </Box>
    </Box>
  );
}

export default InvoiceFooter;
