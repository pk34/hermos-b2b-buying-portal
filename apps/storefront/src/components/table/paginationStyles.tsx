import { MouseEvent } from 'react';
import { Box, IconButton, SvgIcon, SvgIconProps } from '@mui/material';

const LATO_FONT_FAMILY = 'Lato, sans-serif';

export const TABLE_PAGINATION_TEXT_STYLES = {
  fontFamily: LATO_FONT_FAMILY,
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#231F20',
} as const;

export const TABLE_PAGINATION_SX = {
  fontFamily: LATO_FONT_FAMILY,
  color: '#231F20',
  '& .MuiTablePagination-toolbar': {
    ...TABLE_PAGINATION_TEXT_STYLES,
    fontFamily: LATO_FONT_FAMILY,
  },
  '& .MuiTablePagination-selectLabel': {
    ...TABLE_PAGINATION_TEXT_STYLES,
  },
  '& .MuiTablePagination-displayedRows': {
    ...TABLE_PAGINATION_TEXT_STYLES,
  },
  '& .MuiTablePagination-select': {
    ...TABLE_PAGINATION_TEXT_STYLES,
    minHeight: 'auto',
  },
  '& .MuiSelect-select': {
    ...TABLE_PAGINATION_TEXT_STYLES,
    minHeight: 'auto',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiInputBase-input': {
    ...TABLE_PAGINATION_TEXT_STYLES,
  },
  '& .MuiTablePagination-actions': {
    '& .MuiButtonBase-root': {
      color: '#231F20',
      '& svg': {
        width: '20px',
        height: '20px',
      },
    },
  },
} as const;

const iconSx = { width: 20, height: 20 } as const;

const SelectArrowIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 20 21"
    sx={{ ...iconSx, ...props.sx }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.29289 7.34884C5.68342 6.95533 6.31658 6.95533 6.70711 7.34884L10 10.6669L13.2929 7.34884C13.6834 6.95533 14.3166 6.95533 14.7071 7.34884C15.0976 7.74235 15.0976 8.38035 14.7071 8.77385L10.7071 12.8044C10.3166 13.1979 9.68342 13.1979 9.29289 12.8044L5.29289 8.77385C4.90237 8.38035 4.90237 7.74235 5.29289 7.34884Z"
      fill="#0A0A0A"
    />
  </SvgIcon>
);

const PreviousArrowIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 20 21"
    sx={{ ...iconSx, ...props.sx }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.7071 5.33322C13.0976 5.72672 13.0976 6.36472 12.7071 6.75823L9.41421 10.0763L12.7071 13.3943C13.0976 13.7878 13.0976 14.4258 12.7071 14.8193C12.3166 15.2128 11.6834 15.2128 11.2929 14.8193L7.29289 10.7888C6.90237 10.3953 6.90237 9.75726 7.29289 9.36376L11.2929 5.33322C11.6834 4.93971 12.3166 4.93971 12.7071 5.33322Z"
      fill="#0A0A0A"
    />
  </SvgIcon>
);

const NextArrowIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 20 21"
    sx={{ ...iconSx, ...props.sx }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.29289 14.8193C6.90237 14.4258 6.90237 13.7878 7.29289 13.3943L10.5858 10.0763L7.29289 6.75823C6.90237 6.36472 6.90237 5.72672 7.29289 5.33322C7.68342 4.93971 8.31658 4.93971 8.70711 5.33322L12.7071 9.36376C13.0976 9.75726 13.0976 10.3953 12.7071 10.7888L8.70711 14.8193C8.31658 15.2128 7.68342 15.2128 7.29289 14.8193Z"
      fill="#0A0A0A"
    />
  </SvgIcon>
);

export const TABLE_PAGINATION_SELECT_PROPS = {
  IconComponent: SelectArrowIcon,
} as const;

export interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: MouseEvent<HTMLButtonElement>, page: number) => void;
}

export const TablePaginationActions = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
}: TablePaginationActionsProps) => {
  const handleBackButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const lastPage = rowsPerPage > 0 ? Math.max(0, Math.ceil(count / rowsPerPage) - 1) : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '8px' }}>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="Go to previous page"
        size="small"
        sx={{
          '& svg': iconSx,
        }}
      >
        <PreviousArrowIcon />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= lastPage}
        aria-label="Go to next page"
        size="small"
        sx={{
          '& svg': iconSx,
        }}
      >
        <NextArrowIcon />
      </IconButton>
    </Box>
  );
};

