import type { TimeFormat } from '@/store';

type TimeFormatSegment = string | null | undefined;

const STRFTIME_TO_PHP_MAP: Record<string, string> = {
  '%a': 'D',
  '%A': 'l',
  '%b': 'M',
  '%B': 'F',
  '%c': 'D, d M Y H:i:s O',
  '%C': 'Y',
  '%d': 'd',
  '%e': 'j',
  '%F': 'Y-m-d',
  '%G': 'o',
  '%g': 'o',
  '%H': 'H',
  '%I': 'h',
  '%j': 'z',
  '%k': 'G',
  '%l': 'g',
  '%m': 'm',
  '%M': 'i',
  '%n': '\n',
  '%p': 'A',
  '%P': 'a',
  '%r': 'h:i:s A',
  '%R': 'H:i',
  '%S': 's',
  '%T': 'H:i:s',
  '%u': 'N',
  '%U': 'W',
  '%V': 'W',
  '%w': 'w',
  '%x': 'm/d/y',
  '%X': 'H:i:s',
  '%y': 'y',
  '%Y': 'Y',
  '%z': 'O',
  '%Z': 'T',
  '%s': 'U',
};

const STRFTIME_DIRECTIVE_REGEX = /%([%a-zA-Z])/g;

const convertSegment = (segment: TimeFormatSegment): string => {
  if (!segment) return '';

  const value = String(segment);

  if (!value.includes('%')) {
    return value;
  }

  const converted = value.replace(STRFTIME_DIRECTIVE_REGEX, (directive) => {
    if (directive === '%%') {
      return '%';
    }

    return STRFTIME_TO_PHP_MAP[directive] ?? directive.slice(1);
  });

  return converted;
};

export const normalizeTimeFormat = (timeFormat?: TimeFormat): TimeFormat => {
  const defaultFormat: TimeFormat = {
    display: '',
    export: '',
    extendedDisplay: '',
    offset: 0,
  };

  if (!timeFormat) {
    return defaultFormat;
  }

  return {
    display: convertSegment(timeFormat.display),
    export: convertSegment(timeFormat.export),
    extendedDisplay: convertSegment(timeFormat.extendedDisplay),
    offset: typeof timeFormat.offset === 'number' ? timeFormat.offset : defaultFormat.offset,
  };
};
