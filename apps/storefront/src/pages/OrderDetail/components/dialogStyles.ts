import type { SxProps, Theme } from '@mui/material/styles';

import {
  filterModalDialogContentSx,
  filterModalDialogSx,
  filterModalRightButtonSx,
} from '@/components/filter/styles';

export const orderDialogSx: SxProps<Theme> = {
  '& .MuiDialog-container': filterModalDialogSx['& .MuiDialog-container'],
  '& .MuiDialog-paper': {
    ...filterModalDialogSx['& .MuiDialog-paper'],
  },
  '& .MuiDialogTitle-root': {
    ...filterModalDialogSx['& .MuiDialogTitle-root'],
  },
  '& .MuiDialogActions-root': {
    ...filterModalDialogSx['& .MuiDialogActions-root'],
  },
} as const;

export const orderDialogContentSx: SxProps<Theme> = {
  ...filterModalDialogContentSx,
  padding: '24px',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  gap: '16px',
  fontFamily: "'Lato', sans-serif",
  color: '#000000',
  '@media (max-width: 600px)': {
    padding: '16px',
  },
} as const;

export const orderDialogListContentSx: SxProps<Theme> = {
  ...orderDialogContentSx,
  gap: '24px',
} as const;

export const orderDialogBodyTextSx = {
  fontFamily: "'Lato', sans-serif",
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
} as const;

export const orderDialogSecondaryTextSx = {
  fontFamily: "'Lato', sans-serif",
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#616161',
} as const;

const filterModalMobileButtonSx =
  filterModalRightButtonSx['@media (max-width: 600px)'] ?? {
    width: '90%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  };

export const orderDialogPrimaryButtonSx = {
  ...filterModalRightButtonSx,
  width: 'auto',
  minWidth: 'auto',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  '@media (max-width: 600px)': {
    ...filterModalMobileButtonSx,
    display: 'inline-flex',
  },
} as const;
