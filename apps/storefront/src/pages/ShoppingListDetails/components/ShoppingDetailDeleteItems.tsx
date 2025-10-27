import { Box } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import {
  filterModalLeftButtonSx,
  filterModalRightButtonSx,
} from '@/components/filter/styles';
import { useB3Lang } from '@/lib/lang';

interface ShoppingDetailDeleteItemsProps {
  open: boolean;
  handleCancelClick: () => void;
  handleDeleteProductClick: () => void;
}

const deleteDialogSx = {
  '& .MuiDialog-container': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .MuiDialog-paper': {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: '25px',
    boxShadow: '0px 4px 22px 5px #0000001A',
    maxHeight: 'calc(100vh - 32px)',
    '@media (max-width: 600px)': {
      width: '95vw',
      maxWidth: '95vw',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  '& .MuiDialogTitle-root': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: '28px',
    color: '#000000',
    textAlign: 'left',
    padding: 0,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiDialogContent-root': {
    padding: 0,
  },
  '& .MuiDialogActions-root': {
    borderTop: 'none',
    justifyContent: 'center',
    columnGap: '33px',
    gap: '33px',
    padding: 0,
    '& > :not(style) ~ :not(style)': {
      marginLeft: 0,
    },
    '@media (max-width: 600px)': {
      width: '100%',
      flexDirection: 'column-reverse',
      gap: '20px',
      alignItems: 'center',
      columnGap: '20px',
      padding: '16px 0 24px',
    },
  },
} as const;

const deleteDialogContentSx = {
  p: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontFamily: "'Lato', sans-serif",
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  paddingBottom: '10px',
} as const;

function ShoppingDetailDeleteItems(props: ShoppingDetailDeleteItemsProps) {
  const b3Lang = useB3Lang();
  const { open, handleCancelClick, handleDeleteProductClick } = props;

  return (
    <B3Dialog
      isOpen={open}
      title={b3Lang('shoppingList.deleteItems.subtotal')}
      leftSizeBtn={b3Lang('shoppingList.deleteItems.cancel')}
      rightSizeBtn={b3Lang('shoppingList.deleteItems.delete')}
      handleLeftClick={handleCancelClick}
      handRightClick={handleDeleteProductClick}
      leftStyleBtn={filterModalLeftButtonSx}
      rightStyleBtn={filterModalRightButtonSx}
      isShowBordered={false}
      dialogSx={deleteDialogSx}
      dialogContentSx={deleteDialogContentSx}
      dialogWidth="min(449px, 95vw)"
      applyDialogWidthOnMobile
      fullScreenOnMobile={false}
      maxWidth={false}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {b3Lang('shoppingList.deleteItems.confirmDelete')}
      </Box>
    </B3Dialog>
  );
}

export default ShoppingDetailDeleteItems;
