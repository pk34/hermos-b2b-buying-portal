import { Box, TextField } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import {
  filterModalDialogContentSx,
  filterModalDialogSx,
  filterModalLeftButtonSx,
  filterModalRightButtonSx,
} from '@/components/filter/styles';
import { useB3Lang } from '@/lib/lang';

interface ShoppingDetailAddNotesProps {
  open: boolean;
  notes: string;
  setNotes: (value: string) => void;
  handleCancelAddNotesClick: () => void;
  handleAddItemNotesClick: () => void;
}

const addNotesDialogContentSx = {
  ...filterModalDialogContentSx,
  alignItems: 'stretch',
  paddingTop: '10px',
  paddingBottom: '16px',
} as const;

const addNotesFieldSx = {
  width: '100%',
  '& .MuiFilledInput-root': {
    borderRadius: '5px',
    backgroundColor: '#F7F7F7',
    padding: 0,
    minHeight: '176px',
    alignItems: 'flex-start',
    '&:before': {
      borderBottom: '2px solid #231F20',
    },
    '&:after': {
      borderBottom: '2px solid #231F20',
    },
    '&:hover': {
      backgroundColor: '#F7F7F7',
    },
    '&.Mui-focused': {
      backgroundColor: '#F7F7F7',
    },
  },
  '& .MuiFilledInput-input': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    padding: '20px 10px 10px',
  },
  '& .MuiFilledInput-inputMultiline': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    padding: '20px 10px 10px',
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#000000',
  },
} as const;

function ShoppingDetailAddNotes(props: ShoppingDetailAddNotesProps) {
  const b3Lang = useB3Lang();
  const { open, notes, setNotes, handleCancelAddNotesClick, handleAddItemNotesClick } = props;

  return (
    <B3Dialog
      isOpen={open}
      title={b3Lang('shoppingList.addItemNotes.title')}
      leftSizeBtn={b3Lang('shoppingList.addItemNotes.cancel')}
      rightSizeBtn={b3Lang('shoppingList.addItemNotes.save')}
      handleLeftClick={handleCancelAddNotesClick}
      handRightClick={handleAddItemNotesClick}
      isShowBordered={false}
      leftStyleBtn={filterModalLeftButtonSx}
      rightStyleBtn={filterModalRightButtonSx}
      dialogSx={filterModalDialogSx}
      dialogContentSx={addNotesDialogContentSx}
      dialogWidth="min(449px, 95vw)"
      applyDialogWidthOnMobile
      fullScreenOnMobile={false}
      maxWidth={false}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
        }}
      >
        <TextField
          multiline
          minRows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          variant="filled"
          fullWidth
          placeholder={b3Lang('shoppingList.addItemNotes.placeholder')}
          sx={addNotesFieldSx}
        />
      </Box>
    </B3Dialog>
  );
}

export default ShoppingDetailAddNotes;
