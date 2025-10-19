import { Alert, Box, IconButton, Snackbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import useMobile from '@/hooks/useMobile';
import { MsgsProps, TipMessagesProps } from '@/shared/dynamicallyVariable/context/config';

import TipBody from './TipBody';

interface B3TipProps extends TipMessagesProps {
  handleItemClose: (id: number | string) => void;
  handleAllClose: (id: string | number, reason: string) => void;
}

function MessageAlert({
  msg,
  onClose,
}: {
  msg: MsgsProps;
  onClose: (id: string | number) => void;
}) {
  return (
    <Alert
      sx={{
        alignItems: 'center',
        '& button[title="Close"]': {
          display: 'block',
        },
        mb: '5px',

        '& .MuiAlert-message': {
          overflow: 'unset',
          whiteSpace: 'nowrap',
        },
      }}
      variant="filled"
      key={msg.id}
      severity={msg.type}
      onClose={() => onClose(msg.id)}
    >
      <TipBody action={msg.action} message={msg.msg} description={msg.description} />
    </Alert>
  );
}

function AccountSettingsSuccessToast({
  message,
  onClose,
  isMobile,
  description,
}: {
  message?: string;
  description?: string;
  onClose: () => void;
  isMobile: boolean;
}) {
  const theme = useTheme();

  const CheckIcon = () => (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <svg
        width="24"
        height="26"
        viewBox="0 0 24 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M9 13.0004L11 15.0156L15 10.9851M21 13.0004C21 18.0089 16.9706 22.0691 12 22.0691C7.02944 22.0691 3 18.0089 3 13.0004C3 7.99184 7.02944 3.93164 12 3.93164C16.9706 3.93164 21 7.99184 21 13.0004Z"
          stroke="#F7F7F7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );

  const CloseIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.29289 4.29289C4.68342 3.90237 5.31658 3.90237 5.70711 4.29289L10 8.58579L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L11.4142 10L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L10 11.4142L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L8.58579 10L4.29289 5.70711C3.90237 5.31658 3.90237 4.68342 4.29289 4.29289Z"
        fill="#F7F7F7"
      />
    </svg>
  );

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : '419px',
        maxWidth: '100%',
        height: '76px',
        borderRadius: '5px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        backgroundColor: theme.palette.success.main,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1,
        }}
      >
        <CheckIcon />
        <Box
          component="span"
          sx={{
            fontFamily: "'Lato', sans-serif",
            fontWeight: 400,
            fontSize: '20px',
            lineHeight: '28px',
            letterSpacing: 0,
            color: '#F7F7F7',
            verticalAlign: 'middle',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {message}
          {description && (
            <Box component="span" sx={{ fontSize: '16px', lineHeight: '24px' }}>
              {description}
            </Box>
          )}
        </Box>
      </Box>
      <IconButton
        aria-label="Close notification"
        onClick={onClose}
        sx={{
          padding: 0,
          width: '20px',
          height: '20px',
          color: '#F7F7F7',
        }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
}

export default function B3Tip({
  handleItemClose,
  vertical = 'bottom',
  horizontal = 'right',
  msgs = [],
  handleAllClose,
}: B3TipProps) {
  const [isMobile] = useMobile();
  if (!msgs || !msgs.length) return null;
  return (
    <Box>
      {msgs.length > 0
        ? msgs.map((msg: MsgsProps, index: number) => (
            <Snackbar
              key={msg.id}
              open={!!msg?.id}
              autoHideDuration={msg?.time || 5000}
              onClose={(_, reason: string) => handleAllClose(msg.id, reason)}
              disableWindowBlurListener
              anchorOrigin={{
                vertical,
                horizontal,
              }}
              sx={{
                top: `${24 + index * 10 + index * (isMobile ? 80 : 90)}px !important`,
                width: msg.customType === 'account-settings-success' ? 'auto' : '320px',
                maxWidth: '100%',
                height: 'auto',
              }}
            >
              {msg.customType === 'account-settings-success' ? (
                <AccountSettingsSuccessToast
                  message={msg.msg}
                  description={msg.description}
                  isMobile={isMobile}
                  onClose={() => handleItemClose(msg.id)}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                  }}
                >
                  <MessageAlert msg={msg} onClose={handleItemClose} />
                </Box>
              )}
            </Snackbar>
          ))
        : null}
    </Box>
  );
}
