import { ChangeEvent, useCallback } from 'react';
import { styled } from '@mui/material';

const QuantityControlsContainer = styled('div')(() => ({
  display: 'inline-flex',
  alignItems: 'stretch',
  height: '40px',
}));

const quantityButtonBaseStyles = {
  width: '27px',
  backgroundColor: '#E6E6E6',
  borderTop: '0.2px solid #000000',
  borderBottom: '0.2px solid #000000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
  position: 'relative',
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
} as const;

const QuantityMinusButton = styled('button')(() => ({
  ...quantityButtonBaseStyles,
  borderLeft: '0.2px solid #000000',
  borderRight: '0px',
}));

const QuantityPlusButton = styled('button')(() => ({
  ...quantityButtonBaseStyles,
  borderLeft: '0px',
  borderRight: '0.2px solid #000000',
}));

const MinusSign = styled('span')(() => ({
  width: '14px',
  height: '2px',
  backgroundColor: '#0067A0',
  position: 'absolute',
  top: 'calc(50% - 1px)',
  left: 'calc(50% - 7px)',
}));

const PlusSign = styled('span')(() => ({
  position: 'absolute',
  width: '14px',
  height: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: "''",
    position: 'absolute',
    width: '14px',
    height: '2px',
    backgroundColor: '#0067A0',
  },
  '&::after': {
    content: "''",
    position: 'absolute',
    width: '2px',
    height: '14px',
    backgroundColor: '#0067A0',
  },
}));

const QuantityInput = styled('input')(() => ({
  width: '64px',
  backgroundColor: '#E6E6E6',
  borderLeft: '0px',
  borderRight: '0px',
  borderTop: '0.2px solid #000000',
  borderBottom: '0.2px solid #000000',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '20px',
  lineHeight: '28px',
  textAlign: 'center',
  verticalAlign: 'middle',
  color: '#000000',
  height: '40px',
  outline: 'none',
  padding: 0,
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  '&::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '&::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
}));

interface QuickOrderQuantitySelectorProps {
  value: number | string | undefined;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

function QuickOrderQuantitySelector({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  disabled = false,
}: QuickOrderQuantitySelectorProps) {
  const getNumericValue = useCallback(() => {
    if (value === '' || value === undefined || value === null) return 0;

    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? 0 : numericValue;
  }, [value]);

  const handleDecrease = () => {
    if (disabled) return;
    const currentValue = getNumericValue();
    const nextValue = Math.max(min, currentValue - 1 || 0);
    onChange(String(nextValue));
  };

  const handleIncrease = () => {
    if (disabled) return;
    const currentValue = getNumericValue();
    const baseValue = currentValue || min;
    const nextValue = Math.min(max, baseValue + 1);
    onChange(String(nextValue));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const nextValue = event.target.value;
    if (/^\d*$/.test(nextValue)) {
      onChange(nextValue);
    }
  };

  const numericValue = getNumericValue();
  const stringValue = value === undefined || value === null ? String(min) : String(value);

  return (
    <QuantityControlsContainer>
      <QuantityMinusButton
        type="button"
        onClick={handleDecrease}
        disabled={disabled || numericValue <= min}
        aria-label="Decrease quantity"
      >
        <MinusSign />
      </QuantityMinusButton>
      <QuantityInput
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        max={max === Number.MAX_SAFE_INTEGER ? undefined : max}
        value={stringValue}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <QuantityPlusButton
        type="button"
        onClick={handleIncrease}
        disabled={disabled || numericValue >= max}
        aria-label="Increase quantity"
      >
        <PlusSign />
      </QuantityPlusButton>
    </QuantityControlsContainer>
  );
}

export default QuickOrderQuantitySelector;
