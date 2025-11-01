import { forwardRef } from 'react';
import { Typography, TypographyProps } from '@mui/material';

import { SECTION_TITLE_SX } from '@/constants';

const SectionTitle = forwardRef<HTMLElement, TypographyProps>((props, ref) => {
  const { component = 'h3', sx, ...typographyProps } = props;

  const resolvedSx = Array.isArray(sx)
    ? [SECTION_TITLE_SX, ...sx]
    : sx
    ? [SECTION_TITLE_SX, sx]
    : SECTION_TITLE_SX;

  return (
    <Typography
      ref={ref}
      component={component}
      {...typographyProps}
      sx={resolvedSx}
    />
  );
});

SectionTitle.displayName = 'SectionTitle';

export default SectionTitle;
