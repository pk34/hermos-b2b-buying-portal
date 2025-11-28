import { useContext, useRef, useState } from 'react';
import { Box, TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { GlobalContext } from '@/shared/global';

import setDayjsLocale from './setDayjsLocale';

interface B3PickerProps {
  onChange: (date: Date | string | number) => void;
  variant?: 'filled' | 'outlined' | 'standard';
  value: string | number | Date | Dayjs | null | undefined;
  label: string;
  disableOpenPicker?: boolean;
  formatInput?: string;
  size?: 'small' | 'medium' | undefined;
  textFieldSx?: SxProps<Theme>;
}

export default function B3Picker({
  onChange,
  variant,
  value,
  label,
  disableOpenPicker = true,
  formatInput = 'YYYY-MM-DD',
  size = 'small',
  textFieldSx,
}: B3PickerProps) {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const container = useRef<HTMLInputElement | null>(null);

  const {
    state: { bcLanguage },
  } = useContext(GlobalContext);

  const activeLang = setDayjsLocale(bcLanguage || 'en');

  const [open, setOpen] = useState(false);
  const openPickerClick = () => {
    setOpen(!open);
    if (pickerRef?.current?.blur) {
      pickerRef.current.blur();
    }
  };

  const onHandleChange = (value: Dayjs | Date | number | string) => {
    if (typeof value === 'string') {
      onChange(value);
      return;
    }

    const pickerValue = dayjs(value).format(formatInput);
    onChange(pickerValue);
  };

  const pickerValue = value !== null && value !== undefined ? dayjs(value) : null;
  return (
    <>
      <Box ref={container} />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={activeLang}>
        <DatePicker
          label={label}
          inputFormat={formatInput}
          renderInput={(params: TextFieldProps) => (
            <TextField
              {...params}
              size={size}
              onMouseDown={() => {
                openPickerClick();
              }}
              variant={variant}
              sx={textFieldSx}
              inputRef={pickerRef}
            />
          )}
          onChange={(val: Dayjs | null) => val && onHandleChange(val)}
          onClose={() => {
            setOpen(false);
          }}
          DialogProps={{
            container: container.current ?? undefined,
          }}
          value={pickerValue}
          open={open}
          disableOpenPicker={disableOpenPicker}
        />
      </LocalizationProvider>
    </>
  );
}
