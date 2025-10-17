import { ChangeEvent, useEffect, useState } from 'react';
import { Clear as ClearIcon } from '@mui/icons-material';
import { Box, InputBase, Paper } from '@mui/material';

import { useDebounce } from '@/hooks';
import { useB3Lang } from '@/lib/lang';

interface B3FilterSearchProps {
  handleChange: (value: string) => void;
  w?: number | undefined | string;
  searchBGColor?: string;
  placeholder?: string;
  h?: number | string;
  searchValue?: string;
}

function B3FilterSearch({
  handleChange,
  w = 327,
  h = 44,
  searchBGColor = '#EFEFEF',
  searchValue = '',
  ...restProps
}: B3FilterSearchProps) {
  const [search, setSearch] = useState<string>('');
  const b3Lang = useB3Lang();
  const debouncedValue = useDebounce<string>(search, 500);
  const { placeholder = b3Lang('global.filter.search') } = restProps;

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClearSearchValue = () => {
    setSearch('');
  };

  // debounce
  useEffect(() => {
    handleChange(search);
    // disabling this rule as we need to wait for debounceValue change, to search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);
  useEffect(() => {
    if (searchValue.length > 0) {
      setSearch(searchValue);
    }
  }, [searchValue]);

  return (
    <Paper
      component="div"
      sx={{
        p: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: typeof w === 'number' ? `${w}px` : w,
        minWidth: typeof w === 'number' ? `${w}px` : w,
        maxWidth: typeof w === 'number' ? `${w}px` : w,
        flexShrink: 0,
        border: 'none',
        boxShadow: 'none',
        height: typeof h === 'number' ? `${h}px` : h,
        minHeight: typeof h === 'number' ? `${h}px` : h,
        borderRadius: '5px',
        borderBottom: '2px solid #000000',
        backgroundColor: searchBGColor,
        boxSizing: 'border-box',
      }}
    >
      <Box
        component="svg"
        width="20"
        height="20"
        viewBox="0 0 20 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        sx={{ flexShrink: 0 }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 4.95472C5.79086 4.95472 4 6.75925 4 8.98525C4 11.2112 5.79086 13.0158 8 13.0158C10.2091 13.0158 12 11.2112 12 8.98525C12 6.75925 10.2091 4.95472 8 4.95472ZM2 8.98525C2 5.64625 4.68629 2.93945 8 2.93945C11.3137 2.93945 14 5.64625 14 8.98525C14 10.291 13.5892 11.5 12.8907 12.4883L17.7071 17.3414C18.0976 17.7349 18.0976 18.3729 17.7071 18.7664C17.3166 19.16 16.6834 19.16 16.2929 18.7664L11.4765 13.9133C10.4957 14.6171 9.29583 15.031 8 15.031C4.68629 15.031 2 12.3242 2 8.98525Z"
          fill="#0A0A0A"
        />
      </Box>
      <InputBase
        sx={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'Poppins',
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: '100%',
          color: '#231F20',
          height: '100%',
          '& .MuiInputBase-input': {
            pb: 0,
            pt: 0,
            pl: 0,
            pr: 0,
            fontFamily: 'Poppins',
            fontWeight: 300,
            fontSize: '16px',
            lineHeight: '100%',
            color: '#231F20',
            '&::placeholder': {
              fontFamily: 'Poppins',
              fontWeight: 300,
              fontSize: '16px',
              lineHeight: '100%',
              color: '#231F20',
              opacity: 1,
            },
          },
        }}
        size="small"
        value={search}
        placeholder={placeholder}
        onChange={handleOnChange}
        endAdornment={
          search.length > 0 && (
            <ClearIcon
              sx={{
                marginRight: '8px',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '20px',
                color: '#231F20',
                ':hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: '48px',
                },
              }}
              onClick={handleClearSearchValue}
            />
          )
        }
      />
    </Paper>
  );
}

export default B3FilterSearch;
