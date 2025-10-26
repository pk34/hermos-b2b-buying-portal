import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIosNew } from '@mui/icons-material';
import { Box, Grid, styled, Typography, useTheme } from '@mui/material';

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

  const theme = useTheme();

  const primaryColor = theme.palette.primary.main;

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
              color: '#1976d2',
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
                color: primaryColor,
              }}
            />
            <p
              style={{
                color: primaryColor,
                margin: '0',
              }}
            >
              {b3Lang('quoteDetail.header.backToQuoteLists')}
            </p>
          </Box>
        </Box>
      )}

      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          mb: isMobile ? '16px' : '',
        }}
      >
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
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '28px',
                color: '#0067A0',
              }}
            >
              {b3Lang('quoteDetail.header.quoteNumber', {
                quoteNumber: quoteNumber || '',
              })}
            </Typography>

            <Box
              sx={{
                marginLeft: isMobile ? 0 : '100px',
                marginTop: isMobile ? '16px' : '0',
              }}
            >
              <QuoteStatus code={status} />
            </Box>
            {Number(role) !== 100 && (
              <>
                <CustomButton
                  variant="outlined"
                  sx={{
                    height: '39px',
                    marginLeft: isMobile ? 0 : '60px',
                    marginTop: isMobile ? '16px' : '0',
                    borderRadius: '5px',
                    padding: '10px',
                    border: '1px solid #FF810E',
                    color: '#FF810E',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    displayPrint: 'none',
                    '&:hover': {
                      borderColor: '#00965E',
                    },
                  }}
                  onClick={printQuote}
                >
                  {b3Lang('quoteDetail.header.print')}
                </CustomButton>
                <CustomButton
                  variant="outlined"
                  sx={{
                    height: '39px',
                    marginLeft: isMobile ? 0 : '60px',
                    marginTop: isMobile ? '16px' : '0',
                    borderRadius: '5px',
                    padding: '10px',
                    border: '1px solid #FF810E',
                    color: '#FF810E',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    displayPrint: 'none',
                    '&:hover': {
                      borderColor: '#00965E',
                    },
                  }}
                  onClick={exportPdf}
                >
                  {b3Lang('quoteDetail.header.downloadPDF')}
                </CustomButton>
              </>
            )}
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
        </Grid>
      </Grid>
    </>
  );
}

export default QuoteDetailHeader;
