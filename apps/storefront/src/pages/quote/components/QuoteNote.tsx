import { ChangeEvent, useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Typography } from '@mui/material';

import { B3CollapseContainer } from '@/components';
import { useB3Lang } from '@/lib/lang';
import {
  isB2BUserSelector,
  rolePermissionSelector,
  setDraftQuoteInfoNote,
  store,
  useAppSelector,
} from '@/store';

interface QuoteNoteProps {
  quoteStatus?: string | number;
  quoteNotes?: string;
}

export default function QuoteNote(props: QuoteNoteProps) {
  const b3Lang = useB3Lang();
  const { quoteStatus, quoteNotes = '' } = props;

  const [noteText, setNoteText] = useState('');
  const [defaultOpen, setDefaultOpen] = useState(false);

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const b2bPermissions = useAppSelector(rolePermissionSelector);

  const quotesActionsPermission = isB2BUser ? b2bPermissions.quotesCreateActionsPermission : true;

  const handleNoteTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNoteText(event?.target.value || '');
    store.dispatch(setDraftQuoteInfoNote(event?.target.value || ''));
  };

  useEffect(() => {
    const note = store.getState().quoteInfo.draftQuoteInfo.note || '';

    setNoteText(note);
  }, []);

  useEffect(() => {
    store.dispatch(setDraftQuoteInfoNote(noteText || ''));
  }, [noteText]);

  useEffect(() => {
    if (quoteNotes) setDefaultOpen(true);
  }, [quoteNotes]);

  const noteTitle =
    quoteStatus && quoteStatus === 'Draft'
      ? b3Lang('global.quoteNote.message')
      : b3Lang('global.quoteNote.notes');

  return (
    <Card
      sx={{
        boxShadow: 'none',
        borderWidth: '0px 0.3px 0.3px 0px',
        borderStyle: 'solid',
        borderColor: '#000000',
        borderRadius: 0,
      }}
    >
      <CardContent
        sx={{
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        }}
      >
        <B3CollapseContainer
          title={
            <Typography
              sx={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '28px',
                color: '#000000',
                marginBottom: '6px',
              }}
            >
              {noteTitle}
            </Typography>
          }
          defaultOpen={defaultOpen}
        >
          <Box
            sx={{
              padding: '20px 0 0',
            }}
          >
            {quoteStatus && quoteStatus === 'Draft' && (
              <Typography
                sx={{
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#000000',
                  marginBottom: '16px',
                }}
              >
                {b3Lang('global.quoteNote.messageNote')}
              </Typography>
            )}
            {quoteNotes ? (
              <Typography
                sx={{
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#000000',
                  whiteSpace: 'pre-line',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                {quoteNotes}
              </Typography>
            ) : (
              <Box>
                {quotesActionsPermission ? (
                  <TextField
                    multiline
                    fullWidth
                    rows={5}
                    value={noteText}
                    onChange={handleNoteTextChange}
                    label={b3Lang('global.quoteNote.typeMessage')}
                    size="small"
                    variant="filled"
                    sx={{
                      '& .MuiFormLabel-root': {
                        color: 'rgba(0, 0, 0, 0.38)',
                      },
                    }}
                  />
                ) : null}
              </Box>
            )}
          </Box>
        </B3CollapseContainer>
      </CardContent>
    </Card>
  );
}
