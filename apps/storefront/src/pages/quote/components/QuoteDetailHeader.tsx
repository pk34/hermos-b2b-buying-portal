import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Box, Grid, styled, Typography } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { displayFormat } from '@/utils';

import QuoteStatus from './QuoteStatus';

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: 0,
  gap: '8px',
}));

interface QuoteDetailHeaderProps {
  status: string;
  quoteNumber: string;
  issuedAt: number;
  expirationDate: number;
  exportPdf: () => void;
  printQuote: () => Promise<void>;
  role: string | number;
  salesRepInfo: { [key: string]: string };
  currency?: CurrencyProps;
}

function QuoteDetailHeader(props: QuoteDetailHeaderProps) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const {
    status,
    quoteNumber,
    issuedAt,
    expirationDate,
    exportPdf,
    printQuote,
    role,
    salesRepInfo,
    currency,
  } = props;

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const navigate = useNavigate();
  const gridOptions = (xs: number) =>
    isMobile
      ? {}
      : {
          xs,
        };

  const labelTypographySx = {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    marginRight: '0.5rem',
  } as const;

  const valueTypographySx = {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  } as const;

  const actionButtonSx = {
    width: '185px',
    height: '39px',
    borderRadius: '5px',
    padding: '10px',
    border: '1px solid #0067A0',
    color: '#0067A0',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    textTransform: 'capitalize' as const,
    displayPrint: 'none',
    flex: '1 1 185px',
    minWidth: 0,
    '&:hover': {
      borderColor: '#00965E',
      color: '#00965E',
      backgroundColor: 'transparent',
    },
  } as const;

  const actionsContainerSx = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '10px',
    width: '100%',
    flexWrap: 'nowrap' as const,
    justifyContent: isMobile ? 'space-between' : 'flex-start',
    alignItems: 'center',
    marginTop: isMobile ? '24px' : '32px',
  } as const;

  return (
    <>
      {Number(role) !== 100 && (
        <Box
          sx={{
            marginBottom: '10px',
            width: 'fit-content',
            displayPrint: 'none',
          }}
        >
          <Box
            sx={{
              color: '#000000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => {
              navigate('/quotes');
            }}
          >
            <ArrowBackIosNew
              fontSize="small"
              sx={{
                fontSize: '12px',
                marginRight: '0.5rem',
                color: '#000000',
              }}
            />
            <p
              style={{
                color: '#000000',
                margin: '0',
              }}
            >
              {b3Lang('quoteDetail.header.backToQuoteLists')}
            </p>
          </Box>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mb: isMobile ? '16px' : '' }}>
        <Grid
          item
          {...gridOptions(12)}
          sx={{
            color: customColor,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                flexWrap: 'nowrap',
                gap: '12px',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '28px',
                  color: '#0067A0',
                  flex: '1 1 auto',
                  minWidth: 0,
                  wordBreak: 'break-word',
                }}
              >
                {b3Lang('quoteDetail.header.quoteNumber', {
                  quoteNumber: quoteNumber || '',
                })}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  flexShrink: 0,
                }}
              >
                <QuoteStatus code={status} />
              </Box>
            </Box>
            {(salesRepInfo?.salesRepName || salesRepInfo?.salesRepEmail) && (
              <StyledCreateName>
                <Typography
                  variant="subtitle2"
                  sx={{
                    marginRight: '0.5rem',
                    fontSize: '16px',
                  }}
                >
                  {b3Lang('quoteDetail.header.salesRep')}
                </Typography>
                <span>
                  {salesRepInfo?.salesRepEmail !== ''
                    ? `${salesRepInfo?.salesRepName}(${salesRepInfo?.salesRepEmail})`
                    : salesRepInfo?.salesRepName}
                </span>
              </StyledCreateName>
            )}
            <Box
              sx={{
                marginTop: '30px',
                width: '100%',
              }}
            >
              <StyledCreateName>
                <Typography sx={labelTypographySx}>
                  {b3Lang('quoteDetail.header.issuedOn')}
                </Typography>
                <Typography component="span" sx={valueTypographySx}>
                  {issuedAt ? `${displayFormat(Number(issuedAt))}` : ''}
                </Typography>
              </StyledCreateName>
              <StyledCreateName>
                <Typography sx={labelTypographySx}>
                  {b3Lang('quoteDetail.header.expirationDate')}
                </Typography>
                <Typography component="span" sx={valueTypographySx}>
                  {expirationDate ? `${displayFormat(Number(expirationDate))}` : ''}
                </Typography>
              </StyledCreateName>
              {currency?.currencyCode && (
                <StyledCreateName>
                  <Typography sx={labelTypographySx}>
                    {b3Lang('quoteDetail.header.currency')}
                  </Typography>
                  <Typography component="span" sx={valueTypographySx}>
                    {currency.currencyCode}
                  </Typography>
                </StyledCreateName>
              )}
            </Box>
            {Number(role) !== 100 && (
              <Box sx={actionsContainerSx}>
                <CustomButton variant="outlined" sx={actionButtonSx} onClick={printQuote}>
                  {b3Lang('quoteDetail.header.print')}
                </CustomButton>
                <CustomButton variant="outlined" sx={actionButtonSx} onClick={exportPdf}>
                  {b3Lang('quoteDetail.header.downloadPDF')}
                </CustomButton>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default QuoteDetailHeader;
