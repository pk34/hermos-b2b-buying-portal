import { forwardRef } from 'react';
import { Typography, TypographyProps } from '@mui/material';

import { SECTION_TITLE_SX } from '@/constants';

const SectionTitle = forwardRef<HTMLSpanElement, TypographyProps>(
  ({ sx, ...typographyProps }, ref) => (
    <Typography
      ref={ref}
      {...typographyProps}
      sx={{
        ...SECTION_TITLE_SX,
        ...sx,
      }}
    />
  ),
);

SectionTitle.displayName = 'SectionTitle';

export default SectionTitle;
