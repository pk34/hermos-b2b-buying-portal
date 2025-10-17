import { useId } from 'react';
import { Box, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';
import { SectionTitle } from '@/components';
import { QuoteInfoAndExtrafieldsItemProps } from '@/types/quotes';

import { Base64 } from '../../../utils/b3Product/shared/config';

interface QuoteInfoAndExtrafieldsProps {
  quoteInfo: QuoteInfoAndExtrafieldsItemProps;
  status?: string;
}

function QuoteInfoAndExtrafieldsItem({ status, quoteInfo }: QuoteInfoAndExtrafieldsProps) {
  const b3Lang = useB3Lang();

  const {
    info: { quoteTitle, referenceNumber },
    extraFields = [],
    recipients,
  } = quoteInfo;

  const titleId = useId();

  return (
    <Box
      role="article"
      aria-labelledby={titleId}
      sx={{
        width: '100%',
      }}
    >
      <SectionTitle
        id={titleId}
        component="h2"
        sx={{
          height: '32px',
        }}
      >
        {b3Lang('quoteDraft.quoteInfo.title')}
      </SectionTitle>
      <Box
        sx={{
          p: '15px 0',
        }}
      >
        {(quoteTitle || status === 'Draft') && (
          <Typography>{`${b3Lang('quoteDraft.quoteInfo.titleText')} ${quoteTitle}`}</Typography>
        )}
        {(referenceNumber || status === 'Draft') && (
          <Typography>{`${b3Lang(
            'quoteDraft.quoteInfo.referenceText',
          )} ${referenceNumber}`}</Typography>
        )}

        {status === 'Draft' && !recipients.length ? (
          <Typography>{b3Lang('quoteDraft.quoteInfo.ccEmailText')}</Typography>
        ) : (
          recipients.map((ccEmail) => (
            <Typography
              key={`ccEmail-${Base64.encode(ccEmail)}`}
              sx={{ wordBreak: 'break-all' }}
            >{`${b3Lang('quoteDraft.quoteInfo.ccEmailText')} ${ccEmail}`}</Typography>
          ))
        )}

        {extraFields.map(
          (field) =>
            (field.value || status === 'Draft') && (
              <Typography
                key={`extraField-${field.fieldName}`}
              >{`${field.fieldName}: ${field.value}`}</Typography>
            ),
        )}
      </Box>
    </Box>
  );
}

export default QuoteInfoAndExtrafieldsItem;
