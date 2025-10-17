import { forwardRef } from 'react';
import { Typography, TypographyProps } from '@mui/material';

import { SECTION_TITLE_SX } from '@/constants';

const SectionTitle = forwardRef<HTMLElement, TypographyProps>(
  ({ component = 'h3', sx, ...typographyProps }, ref) => (
    <Typography
      ref={ref}
      component={component}
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
