import {
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, Card, CardContent, Tooltip, Typography, useTheme } from '@mui/material';
import { format, formatDistanceStrict } from 'date-fns';

import { B3CollapseContainer } from '@/components';
import B3Spin from '@/components/spin/B3Spin';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import { updateQuote } from '@/shared/service/b2b';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { displayExtendedFormat, storeHash } from '@/utils';

interface MessageProps {
  date?: number;
  message?: string;
  role?: string;
  isCustomer?: boolean;
  key?: number | string;
  read?: number;
  sendTime?: number;
}

interface MsgsProps {
  msgs: MessageProps[];
  id: string | number;
  email: string;
  isB2BUser: boolean;
  status: number;
}

interface CustomerMessageProps {
  msg: MessageProps;
  isEndMessage?: boolean;
  isCustomer?: boolean;
}

const messageTitleStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '24px',
  lineHeight: '28px',
  color: '#000000',
  marginBottom: '8px',
} as const;

const messageSubtitleStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#B2B2B2',
} as const;

const messageDateLabelStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#231F20',
  marginBottom: '18px',
  textAlign: 'center' as const,
  display: 'block',
} as const;

const messageNameStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#231F20',
  marginBottom: '5px',
} as const;

const messageBubbleStyles = {
  width: '231px',
  borderRadius: '20px',
  backgroundColor: '#BAD6F2',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  rowGap: '8px',
} as const;

const messageSentTimeStyles = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '16px',
  color: '#231F20',
  textAlign: 'left' as const,
} as const;

const messageInputStyles = {
  width: '246px',
  height: '59px',
  borderRadius: '5px',
  padding: '10px',
  paddingBottom: '24px',
  border: 'none',
  borderBottom: '2px solid #000000',
  backgroundColor: '#EFEFEF',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
  resize: 'none' as const,
  outline: 'none',
  marginBottom: '15px',
} as const;

const sendButtonContainerStyles = {
  width: '46px',
  height: '46px',
  borderRadius: '100px',
  padding: '10px',
  backgroundColor: '#BAD6F2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
} as const;

const SendMessageIcon = () => (
  <Box
    component="svg"
    width={32}
    height={33}
    viewBox="0 0 32 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.46863 15.6503C7.84379 15.0207 7.84379 13.9999 8.46863 13.3703L14.8686 6.92142C15.4935 6.29182 16.5065 6.29182 17.1314 6.92142L23.5314 13.3703C24.1562 13.9999 24.1562 15.0207 23.5314 15.6503C22.9065 16.2799 21.8935 16.2799 21.2686 15.6503L17.6 11.9536L17.6 24.1835C17.6 25.0739 16.8837 25.7957 16 25.7957C15.1163 25.7957 14.4 25.0739 14.4 24.1835L14.4 11.9536L10.7314 15.6503C10.1065 16.2799 9.09347 16.2799 8.46863 15.6503Z"
      fill="#0A0A0A"
    />
  </Box>
);

function ChatMessage({ msg, isEndMessage, isCustomer }: CustomerMessageProps) {
  const b3Lang = useB3Lang();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCustomer ? 'flex-end' : 'flex-start',
        paddingTop: '5px',
      }}
    >
      {msg?.role && (
        <Typography sx={{ ...messageNameStyles, textAlign: isCustomer ? 'right' : 'left' }}>
          {msg.role}
        </Typography>
      )}
      {msg?.message && (
        <Box sx={{ ...messageBubbleStyles, alignSelf: isCustomer ? 'flex-end' : 'flex-start' }}>
          <Tooltip title={format((msg.sendTime || 0) * 1000, 'K:m aa')} placement="top" arrow>
            <Typography
              sx={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#231F20',
                wordBreak: 'break-word',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {msg.message}
            </Typography>
          </Tooltip>
          {isEndMessage && msg?.sendTime && (
            <Typography sx={messageSentTimeStyles}>
              {`${b3Lang('quoteDetail.message.sent')} ${formatDistanceStrict(
                new Date((msg.sendTime || 0) * 1000),
                new Date(),
                {
                  addSuffix: true,
                },
              )}`}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

interface DateMessageProps {
  msg: MessageProps;
}

function DateMessage({ msg }: DateMessageProps) {
  return (
    <Typography sx={messageDateLabelStyles}>{`${displayExtendedFormat(msg?.date || 0)}`}</Typography>
  );
}

function Message({ msgs, id, isB2BUser, email, status }: MsgsProps) {
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const b3Lang = useB3Lang();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const changeReadRef = useRef(0);

  const [messages, setMessages] = useState<MessageProps[]>([]);

  const [read, setRead] = useState<number>(0);

  const [message, setMessage] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const { quotesUpdateMessageActionsPermission } = useAppSelector(rolePermissionSelector);
  const quotesUpdateMessagePermission = isB2BUser ? quotesUpdateMessageActionsPermission : true;

  const convertedMsgs = (msgs: MessageProps[]) => {
    let nextMsg: MessageProps = {};
    const getNewMsgs: MessageProps[] = [];
    let readNum = 0;
    msgs.forEach((msg: MessageProps, index: number) => {
      if (index === 0) {
        getNewMsgs.push({
          isCustomer: !msg.role?.includes('Sales rep:'),
          date: msg?.date,
          key: `${msg?.date}date`,
        });
        getNewMsgs.push({
          isCustomer: !msg.role?.includes('Sales rep:'),
          message: msg.message,
          sendTime: msg.date,
          role: msg.role,
          key: msg?.date,
        });
        nextMsg = msg;
        nextMsg.isCustomer = !msg.role?.includes('Sales rep:');
      } else {
        if ((msg?.date || 0) - (nextMsg?.date || 0) > 60 * 60) {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            date: msg?.date,
            key: `${msg?.date}date`,
          });
        }

        if (nextMsg.isCustomer === !msg.role?.includes('Sales rep:')) {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            message: msg.message,
            sendTime: msg.date,
            key: msg?.date,
          });
        } else {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            message: msg.message,
            role: msg.role,
            sendTime: msg.date,
            key: msg?.date,
          });
        }
        nextMsg = msg;
        nextMsg.isCustomer = !msg.role?.includes('Sales rep:');
      }

      if (msg.role?.includes('Sales rep:') && !msg.read) {
        readNum += 1;
      }
    });

    setRead(readNum);

    setMessages(getNewMsgs);
  };

  const title = useMemo(
    () => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          columnGap: '8px',
        }}
      >
        <Typography sx={messageTitleStyles}>{b3Lang('quoteDetail.message.message')}</Typography>
        {read !== 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: primaryColor || '#1976D2',
              color: '#fff',
              fontSize: '12px',
              ml: '8px',
              fontFamily: 'Lato, sans-serif',
            }}
          >
            {read}
          </Box>
        )}
      </Box>
    ),
    // disabling this rule as b3Lang will cause rendering issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryColor, read],
  );

  useEffect(() => {
    convertedMsgs(msgs);
  }, [msgs]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const updateMsgs = async (msg: string) => {
    const trimmedMessage = msg.trim();
    if (!trimmedMessage) {
      return;
    }
    try {
      setLoading(true);
      const {
        quoteUpdate: {
          quote: { trackingHistory },
        },
      } = await updateQuote({
        id: Number(id),
        quoteData: {
          message: trimmedMessage,
          lastMessage: parseInt(`${new Date().getTime() / 1000}`, 10),
          userEmail: email || '',
          storeHash,
        },
      });
      setMessage('');
      setRead(0);
      convertedMsgs(trackingHistory);
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      updateMsgs((e.target as HTMLTextAreaElement).value || '');
    }
  };

  const handleOnChange = useCallback(
    (open: boolean) => {
      if (open) {
        if (!quotesUpdateMessagePermission && isB2BUser) return;

        if (changeReadRef.current === 0 && msgs.length) {
          updateQuote({
            id: Number(id),
            quoteData: {
              lastMessage: msgs[msgs.length - 1]?.date,
              userEmail: email || '',
              storeHash,
            },
          });
        }
        setRead(0);
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
        changeReadRef.current += 1;
      }
    },
    [email, id, isB2BUser, msgs, quotesUpdateMessagePermission],
  );

  useEffect(() => {
    globalDispatch({
      type: 'common',
      payload: {
        quoteDetailHasNewMessages: read !== 0,
      },
    });
    // Disabling this rule as dispatcher dep globalDispatch is the same between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read]);

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
        <B3CollapseContainer handleOnChange={handleOnChange} title={title}>
          <Box
            sx={{
              padding: '20px 0 0',
            }}
          >
            <Typography sx={messageSubtitleStyles}>
              {b3Lang('quoteDetail.message.merchantAnswers')}
            </Typography>
            <Box
              ref={messagesEndRef}
              sx={{
                mt: '20px',
                maxHeight: '280px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              {messages.map((item: MessageProps, index: number) => (
                <Box key={item.key}>
                  <ChatMessage
                    msg={item}
                    isEndMessage={index === messages.length - 1}
                    isCustomer={!!item.isCustomer}
                  />
                  {item.date && <DateMessage msg={item} />}
                </Box>
              ))}
            </Box>
          </Box>

          {status !== 4 && quotesUpdateMessagePermission && (
            <B3Spin
              isSpinning={loading}
              spinningHeight={50}
              size={10}
              isCloseLoading
              tip="waiting.."
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  flexWrap: 'nowrap',
                  columnGap: '16px',
                  marginTop: '38px',
                  marginBottom: '15px',
                  width: '100%',
                }}
              >
                <Box
                  component="textarea"
                  onKeyDown={updateMessage}
                  sx={{
                    ...messageInputStyles,
                    flex: '0 0 246px',
                  }}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                  aria-label={b3Lang('quoteDetail.message.typeMessage')}
                  placeholder={b3Lang('quoteDetail.message.typeMessage')}
                />
                <Box
                  onClick={() => updateMsgs(message)}
                  sx={{
                    ...sendButtonContainerStyles,
                    marginLeft: 'auto',
                  }}
                >
                  <SendMessageIcon />
                </Box>
              </Box>
            </B3Spin>
          )}
        </B3CollapseContainer>
      </CardContent>
    </Card>
  );
}

export default Message;
