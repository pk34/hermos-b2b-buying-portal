import { Alert, Box, IconButton, Snackbar } from '@mui/material';

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
  description,
}: {
  message?: string;
  description?: string;
  onClose: () => void;
}) {
  const CheckIcon = () => (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M7.5 10.0003L9.16671 11.667L12.5 8.33366M17.5 10.0003C17.5 13.6821 14.6421 16.6669 10.8334 16.6669C7.02469 16.6669 4.16671 13.6821 4.16671 10.0003C4.16671 6.31851 7.02469 3.33366 10.8334 3.33366C14.6421 3.33366 17.5 6.31851 17.5 10.0003Z"
          stroke="#FFFFFF"
          strokeWidth="1.66667"
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
        width: '100%',
        height: '44px',
        borderRadius: '5px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backgroundColor: '#457B3B',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1,
        }}
      >
        <CheckIcon />
        <Box
          component="span"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: "'Lato', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#FFFFFF',
            textAlign: 'left',
            gap: 0,
            width: '100%',
            wordBreak: 'break-word',
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#FFFFFF',
            }}
          >
            {message}
          </Box>
          {description && (
            <Box
              component="span"
              sx={{
                fontFamily: "'Lato', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#FFFFFF',
              }}
            >
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
          width: '24px',
          height: '24px',
          color: '#FFFFFF',
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
              anchorOrigin={
                msg.customType === 'account-settings-success'
                  ? { vertical: 'top', horizontal: 'center' }
                  : { vertical, horizontal }
              }
              sx={{
                top:
                  msg.customType === 'account-settings-success'
                    ? `${(isMobile ? 156 : 168) + index * 64}px !important`
                    : `${24 + index * 10 + index * (isMobile ? 80 : 90)}px !important`,
                width: msg.customType === 'account-settings-success' ? '90vw' : '320px',
                maxWidth: msg.customType === 'account-settings-success' ? '90vw' : '100%',
                height: 'auto',
                left: msg.customType === 'account-settings-success' ? '50% !important' : undefined,
                transform:
                  msg.customType === 'account-settings-success'
                    ? 'translateX(-50%) !important'
                    : undefined,
                right: msg.customType === 'account-settings-success' ? 'auto !important' : undefined,
                '& .MuiSnackbarContent-root':
                  msg.customType === 'account-settings-success'
                    ? {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        padding: 0,
                        width: '100%',
                      }
                    : undefined,
              }}
            >
              {msg.customType === 'account-settings-success' ? (
                <AccountSettingsSuccessToast
                  message={msg.msg}
                  description={msg.description}
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
