import styled from '@emotion/styled';
import { useB3Lang } from '@/lib/lang';
import B3NoDataIcon from '../icons/B3NoDataIcon';

interface B3NoDataProps {
  text?: string;
  backgroundColor?: string;
  minHeight?: string;
  isLoading?: boolean;
}

const NoDataContainer = styled('div')(
  ({ backgroundColor = '#fff', minHeight = '400px' }: B3NoDataProps) => ({
    height: '100%',
    minHeight,
    backgroundColor,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }),
);

const NoDataText = styled('span')(() => ({
  marginLeft: '10px',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '30px',
  lineHeight: '38px',
  color: '#000000',
}));

export default function B3NoData({
  text,
  backgroundColor,
  minHeight,
  isLoading = false,
}: B3NoDataProps) {
  const b3Lang = useB3Lang();
  return (
    <NoDataContainer backgroundColor={backgroundColor} minHeight={minHeight}>
      {!isLoading && <B3NoDataIcon />}
      <NoDataText>{isLoading ? '' : text || b3Lang('global.table.noData')}</NoDataText>
    </NoDataContainer>
  );
}
