import styled from '@emotion/styled';
import { useB3Lang } from '@/lib/lang';
import B3NoDataIcon from '@/components/icons/B3NoDataIcon';

interface B3NoDataProps {
  isLoading: boolean;
}

const NoDataContainer = styled('div')(() => ({
  height: '100%',
  minHeight: '400px',
  backgroundColor: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}));

const NoDataText = styled('span')(() => ({
  marginLeft: '10px',
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '30px',
  lineHeight: '38px',
  color: '#000000',
}));

export default function B3NoData({ isLoading }: B3NoDataProps) {
  const b3Lang = useB3Lang();
  return (
    <NoDataContainer>
      {!isLoading && <B3NoDataIcon />}
      <NoDataText>{isLoading ? '' : b3Lang('global.table.noData')}</NoDataText>
    </NoDataContainer>
  );
}
