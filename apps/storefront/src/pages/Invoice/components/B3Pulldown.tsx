import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useB3Lang } from '@/lib/lang';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { InvoiceList } from '@/types/invoice';
import { b2bPermissionsMap, snackbar, verifyLevelPermission } from '@/utils';

import { gotoInvoiceCheckoutUrl } from '../utils/payment';
import { getInvoiceDownloadPDFUrl, handlePrintPDF } from '../utils/pdf';

import { triggerPdfDownload } from './triggerPdfDownload';

const StyledMenu = styled(Menu)(() => ({
  '& .MuiPaper-root': {
    borderRadius: 0,
    boxShadow: '0px 4px 22px 5px #0000001A',
  },
}));

const StyledMenuItem = styled(MenuItem)(() => ({
  width: '244px',
  height: '44px',
  padding: '10px',
  backgroundColor: '#FFFFFF',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  '&:hover': {
    backgroundColor: '#F5F5F5',
  },
}));

interface B3PulldownProps {
  row: InvoiceList;
  setIsRequestLoading: (bool: boolean) => void;
  setInvoiceId: (id: string) => void;
  handleOpenDetails: (invoiceId: string) => void;
  isCurrentCompany: boolean;
  invoicePay: boolean;
}

function B3Pulldown({
  row,
  setIsRequestLoading,
  setInvoiceId,
  handleOpenDetails,
  isCurrentCompany,
  invoicePay,
}: B3PulldownProps) {
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPay, setIsPay] = useState<boolean>(true);

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  const { invoicePayPermission, purchasabilityPermission } = useAppSelector(rolePermissionSelector);
  const { getOrderPermission: getOrderPermissionCode } = b2bPermissionsMap;

  const [isCanViewOrder, setIsCanViewOrder] = useState<boolean>(false);

  const close = () => {
    setIsOpen(false);
  };

  const handleMoreActionsClick = () => {
    const { id } = row;
    setInvoiceId(id);
    setIsOpen(true);
  };

  const handleViewInvoicePdf = async (isPayNow: boolean) => {
    const { id } = row;

    close();

    setIsRequestLoading(true);

    const pdfUrl = await handlePrintPDF(id, isPayNow);

    setIsRequestLoading(false);

    if (!pdfUrl) {
      snackbar.error('pdf url resolution error');
      return;
    }

    const { href } = window.location;
    if (!href.includes('invoice')) {
      return;
    }

    window.open(pdfUrl, '_blank', 'fullscreen=yes');
  };

  const handleViewOrder = () => {
    const { orderNumber } = row;
    close();
    navigate(`/orderDetail/${orderNumber}`);
  };

  const handlePay = async () => {
    close();

    const { openBalance, originalBalance, id } = row;

    const params = {
      lineItems: [
        {
          invoiceId: Number(id),
          amount: openBalance.value === '.' ? '0' : `${Number(openBalance.value)}`,
        },
      ],
      currency: openBalance?.code || originalBalance.code,
    };

    if (openBalance.value === '.' || Number(openBalance.value) === 0) {
      snackbar.error('The payment amount entered has an invalid value.');

      return;
    }

    await gotoInvoiceCheckoutUrl(params, platform, false);
  };

  const handleViewDetails = () => {
    const { id } = row;

    close();
    handleOpenDetails(id);
  };

  const handleDownloadPDF = async () => {
    const { id } = row;

    close();
    setIsRequestLoading(true);
    const url = await getInvoiceDownloadPDFUrl(id);

    setIsRequestLoading(false);

    triggerPdfDownload(url, 'file.pdf');
  };

  useEffect(() => {
    const { openBalance, orderUserId, companyInfo } = row;
    const payPermissions =
      Number(openBalance.value) > 0 && invoicePayPermission && purchasabilityPermission;

    const isPayInvoice = isCurrentCompany ? payPermissions : payPermissions && invoicePay;
    setIsPay(isPayInvoice);

    const viewOrderPermission = verifyLevelPermission({
      code: getOrderPermissionCode,
      companyId: Number(companyInfo.companyId),
      userId: Number(orderUserId),
    });

    setIsCanViewOrder(viewOrderPermission);
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <IconButton
        onClick={handleMoreActionsClick}
        ref={ref}
        aria-label={b3Lang('invoice.actions.moreActions')}
        aria-haspopup="menu"
      >
        <MoreHorizIcon />
      </IconButton>
      <StyledMenu
        id="basic-menu"
        anchorEl={ref.current}
        open={isOpen}
        onClose={close}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
      horizontal: 'right',
    }}
  >
        <StyledMenuItem
          key="view-invoice-pdf"
          onClick={() =>
            handleViewInvoicePdf(
              row.status !== 2 && invoicePayPermission && purchasabilityPermission,
            )
          }
        >
          {b3Lang('invoice.actions.viewInvoice')}
        </StyledMenuItem>
        <StyledMenuItem key="download-xml" onClick={() => handleDownloadPDF()}>
          {b3Lang('invoice.actions.download')}
        </StyledMenuItem>
        {isCanViewOrder && (
          <StyledMenuItem key="view-order" onClick={handleViewOrder}>
            {b3Lang('invoice.actions.viewOrder')}
          </StyledMenuItem>
        )}

        {row.status !== 0 && (
          <StyledMenuItem key="view-history-payment" onClick={handleViewDetails}>
            {b3Lang('invoice.actions.viewPaymentHistory')}
          </StyledMenuItem>
        )}
        {isPay && (
          <StyledMenuItem key="pay" onClick={handlePay}>
            {b3Lang('invoice.actions.pay')}
          </StyledMenuItem>
        )}
      </StyledMenu>
    </>
  );
}

export default B3Pulldown;
