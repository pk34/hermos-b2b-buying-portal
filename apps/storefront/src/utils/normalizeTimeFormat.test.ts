import { describe, expect, it } from 'vitest';

import type { TimeFormat } from '@/store';

import { MEXICAN_EXTENDED_FORMAT_TOKEN, normalizeTimeFormat } from './normalizeTimeFormat';

describe('normalizeTimeFormat', () => {
  it('converts strftime directives to php date tokens', () => {
    const format: TimeFormat = {
      display: '%e de %B %Y',
      export: '%Y-%m-%d',
      extendedDisplay: '%e de %B %Y a las %l:%M %p',
      offset: -21600,
    };

    const normalized = normalizeTimeFormat(format);

    expect(normalized).toEqual({
      display: 'j de F Y',
      export: 'Y-m-d',
      extendedDisplay: MEXICAN_EXTENDED_FORMAT_TOKEN,
      offset: -21600,
    });
  });

  it('returns default values when the format is not provided', () => {
    expect(normalizeTimeFormat(undefined)).toEqual({
      display: '',
      export: '',
      extendedDisplay: '',
      offset: 0,
    });
  });

  it('preserves php date tokens when no strftime directives are present', () => {
    const format: TimeFormat = {
      display: 'j M Y',
      export: 'M j Y',
      extendedDisplay: 'M j Y @ g:i A',
      offset: 0,
    };

    expect(normalizeTimeFormat(format)).toEqual(format);
  });

  it('handles escaped percent signs', () => {
    const format: TimeFormat = {
      display: 'Report %%Y',
      export: 'Report %%m',
      extendedDisplay: 'Report %%d',
      offset: 0,
    };

    expect(normalizeTimeFormat(format)).toEqual({
      display: 'Report %Y',
      export: 'Report %m',
      extendedDisplay: 'Report %d',
      offset: 0,
    });
  });
});
