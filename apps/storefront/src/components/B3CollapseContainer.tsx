import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';

const CollapseArrowOpen = () => (
  <Box
    component="svg"
    width={20}
    height={21}
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.7071 12.8044C14.3166 13.1979 13.6834 13.1979 13.2929 12.8044L10 9.48636L6.70711 12.8044C6.31658 13.1979 5.68342 13.1979 5.29289 12.8044C4.90237 12.4109 4.90237 11.7729 5.29289 11.3794L9.29289 7.34884C9.68342 6.95533 10.3166 6.95533 10.7071 7.34884L14.7071 11.3794C15.0976 11.7729 15.0976 12.4109 14.7071 12.8044Z"
      fill="#0A0A0A"
    />
  </Box>
);

const CollapseArrowClosed = () => (
  <Box
    component="svg"
    width={20}
    height={21}
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.29289 7.34884C5.68342 6.95533 6.31658 6.95533 6.70711 7.34884L10 10.6669L13.2929 7.34884C13.6834 6.95533 14.3166 6.95533 14.7071 7.34884C15.0976 7.74235 15.0976 8.38035 14.7071 8.77385L10.7071 12.8044C10.3166 13.1979 9.68342 13.1979 9.29289 12.8044L5.29289 8.77385C4.90237 8.38035 4.90237 7.74235 5.29289 7.34884Z"
      fill="#0A0A0A"
    />
  </Box>
);

interface CollapseContainerProps {
  title?: string | ReactElement;
  header?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  handleOnChange?: (open: boolean) => void;
}

export default function B3CollapseContainer(props: CollapseContainerProps) {
  const { children, title = '', header, defaultOpen = false, handleOnChange } = props;

  const [open, setOpen] = useState(defaultOpen);

  const handleClick = () => {
    setOpen(!open);
  };
  useEffect(() => {
    if (handleOnChange) handleOnChange(open);
  }, [handleOnChange, open]);

  useEffect(() => {
    if (defaultOpen) {
      setOpen(defaultOpen);
    }
  }, [defaultOpen]);

  return (
    <Box>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          cursor: 'pointer',
          alignItems: 'flex-start',
          columnGap: '12px',
        }}
      >
        <Box sx={{ flex: 1 }}>{header || <Typography variant="h5">{title}</Typography>}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '21px' }}>
          {open ? <CollapseArrowOpen /> : <CollapseArrowClosed />}
        </Box>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {children}
      </Collapse>
    </Box>
  );
}
