import { ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Close, Dehaze, ShoppingBagOutlined } from '@mui/icons-material';
import { Badge, Box, IconButton, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

import { CART_URL } from '@/constants';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';

import CompanyCredit from '../CompanyCredit';
import { getContrastColor } from '../outSideComponents/utils/b3CustomStyles';

import B3CloseAppButton from './B3CloseAppButton';
import B3Logo from './B3Logo';
import B3Nav from './B3Nav';

interface B3MobileLayoutProps {
  children: ReactNode;
  title: string;
  titleSx?: SxProps<Theme>;
}

export default function B3MobileLayout({ children, title, titleSx }: B3MobileLayoutProps) {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const [isOpenMobileSidebar, setOpenMobileSidebar] = useState<boolean>(false);
  const cartNumber = useAppSelector(({ global }) => global.cartNumber);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);
  const firstName = useAppSelector(({ company }) => company.customer.firstName);
  const lastName = useAppSelector(({ company }) => company.customer.lastName);

  const isShowCart = isB2BUser ? purchasabilityPermission : true;

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const openRouteList = () => {
    setOpenMobileSidebar(true);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpenMobileSidebar) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpenMobileSidebar]);

  const customColor = getContrastColor(backgroundColor);

  const userName = [firstName, lastName].filter(Boolean).join(' ') || '';

  const headingSx = useMemo<SxProps<Theme>>(() => {
    const baseTitleSx: SxProps<Theme> = {
      p: 0,
      m: 0,
      mb: '6vw',
      fontSize: '34px',
      fontWeight: '400',
      color: customColor || '#263238',
    };

    const additionalSx: SxProps<Theme>[] = Array.isArray(titleSx)
      ? titleSx
      : titleSx
        ? [titleSx]
        : [];

    return [baseTitleSx, ...additionalSx];
  }, [customColor, titleSx]);

  return (
    <Box
      sx={{
        height: '70vh',
        p: '4vw',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '4.5vw',
        }}
      >
        <Badge badgeContent={0} color="secondary">
          <Dehaze onClick={openRouteList} sx={{ color: customColor }} />
        </Badge>

        <B3Logo />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',

            '& span': {
              marginRight: '1.5rem',
            },
          }}
        >
          {isShowCart && (
            <Badge
              badgeContent={cartNumber}
              max={1000}
              sx={{
                '& .MuiBadge-badge': {
                  color: '#FFFFFF',
                  backgroundColor: '#1976D2',
                  fontWeight: 500,
                  fontSize: '12px',
                  minWidth: '18px',
                  height: '18px',
                  top: '8px',
                  right: '3px',
                  marginRight: '-0.5rem',
                },
              }}
            >
              <ShoppingBagOutlined
                sx={{ color: 'rgba(0, 0, 0, 0.54)', marginRight: '-0.5rem' }}
                onClick={() => {
                  window.location.href = CART_URL;
                }}
              />
            </Badge>
          )}
          <Box
            sx={{
              marginLeft: '2px',
              height: '24px',
            }}
          >
            <B3CloseAppButton />
          </Box>
        </Box>
      </Box>

      <Box component="h1" sx={headingSx}>
        {title}
      </Box>
      <CompanyCredit />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          paddingBottom: isAgenting ? '52px' : '0',
        }}
      >
        {children}
      </Box>
      {isOpenMobileSidebar && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              height: '50px',
              backgroundColor: '#0067A0',
              color: '#F7F7F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: '16px',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#F7F7F7',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </Typography>
            <IconButton
              onClick={() => setOpenMobileSidebar(false)}
              sx={{
                color: '#F7F7F7',
              }}
              aria-label="Close menu"
            >
              <Close />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: '16px',
            }}
          >
            <B3Nav closeSidebar={setOpenMobileSidebar} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
