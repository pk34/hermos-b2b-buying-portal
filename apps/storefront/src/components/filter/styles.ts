export const filterModalFieldBaseSx = {
  width: '100%',
  '& .MuiFilledInput-root': {
    height: '44px',
    opacity: 1,
    borderRadius: '5px',
    backgroundColor: '#F7F7F7',
    '&:before': {
      borderBottomWidth: '2px',
      borderBottomColor: '#000000',
    },
    '&:after': {
      borderBottomWidth: '2px',
      borderBottomColor: '#000000',
    },
    '&:hover': {
      backgroundColor: '#F7F7F7',
    },
    '&.Mui-focused': {
      backgroundColor: '#F7F7F7',
    },
  },
  '& .MuiFilledInput-input': {
    padding: '15px 10px 0 10px',
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  },
  '& .MuiSelect-select': {
    padding: '15px 10px 0 10px',
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '16px',
    color: '#000000',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#000000',
  },
};

export const filterModalDialogSx = {
  '& .MuiDialog-container': {
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .MuiDialog-paper': {
    borderRadius: '0px',
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '& .MuiDialogContent-root': {
    marginTop: 0,
  },
  '& .MuiDialogTitle-root': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: '28px',
    textAlign: 'left',
    color: '#000000',
    borderBottom: '0.5px solid #000000',
    padding: '24px 24px 16px',
  },
  '& .MuiDialogActions-root': {
    borderTop: '0.5px solid #000000',
    padding: '16px 24px 24px',
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
  },
} as const;

export const filterModalDialogContentSx = {
  padding: '9px 24px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  width: '100%',
} as const;

export const filterModalLeftButtonSx = {
  width: '150px',
  height: '44px',
  opacity: 1,
  border: '1px solid #0067A0',
  borderRadius: '5px',
  padding: '10px',
  color: '#000000',
  backgroundColor: '#FFFFFF',
  fontFamily: "'Lato', sans-serif",
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  textTransform: 'capitalize',
  display: 'block',
  textAlign: 'center',
  '&:hover': {
    backgroundColor: '#FFFFFF',
  },
} as const;

export const filterModalRightButtonSx = {
  width: '150px',
  height: '44px',
  opacity: 1,
  borderRadius: '5px',
  padding: '10px',
  color: '#FFFFFF',
  backgroundColor: '#0067A0',
  border: '1px solid #0067A0',
  fontFamily: "'Lato', sans-serif",
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  textTransform: 'capitalize',
  display: 'block',
  textAlign: 'center',
  '&:hover': {
    backgroundColor: '#0067A0',
  },
} as const;

export const filterModalClearActionSx = {
  fontFamily: "'Lato', sans-serif",
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '20px',
  cursor: 'pointer',
  color: '#000000',
  textTransform: 'capitalize',
  backgroundColor: 'transparent',
  padding: 0,
  '&:hover': {
    backgroundColor: 'transparent',
  },
} as const;
