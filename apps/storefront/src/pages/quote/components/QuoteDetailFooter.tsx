import { useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { useB3Lang } from '@/lib/lang';

import { handleQuoteCheckout } from '../utils/quoteCheckout';

interface QuoteDetailFooterProps {
  quoteId: string;
  role: string | number;
  isAgenting: boolean;
  status: number;
  proceedingCheckoutFn: () => boolean;
}

function QuoteDetailFooter(props: QuoteDetailFooterProps) {
  const { quoteId, role, status, proceedingCheckoutFn } = props;
  const b3Lang = useB3Lang();
  const location = useLocation();
  const navigate = useNavigate();

  return status !== 5 ? (
    <Box
      sx={{
        marginTop: '24px',
        width: '100%',
        height: '60px',
        padding: '10px',
        backgroundColor: '#00965E',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        displayPrint: 'none',
      }}
    >
      <CustomButton
        variant="contained"
        onClick={() => {
          handleQuoteCheckout({
            proceedingCheckoutFn,
            role,
            location,
            quoteId,
            navigate,
          });
        }}
        sx={{
          height: '40px',
          padding: '10px',
          backgroundColor: '#0067A0',
          fontFamily: 'Lato, sans-serif',
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          textAlign: 'center',
          verticalAlign: 'middle',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': {
            backgroundColor: '#005985',
          },
        }}
      >
        {b3Lang('quoteDetail.footer.proceedToCheckout')}
      </CustomButton>
    </Box>
  ) : null;
}

export default QuoteDetailFooter;
