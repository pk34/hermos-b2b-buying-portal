import { useState } from 'react';
import { Box, Grid } from '@mui/material';

import { useMobile } from '@/hooks';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';

import QuickOrderTable from './components/QuickOrderB2BTable';
import QuickOrderFooter from './components/QuickOrderFooter';
import QuickOrderPad from './components/QuickOrderPad';
import { CheckedProduct, QuickOrderListItem } from './utils';

function QuickOrder() {
  const isB2BUser = useAppSelector(isB2BUserSelector);

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const [isMobile] = useMobile();

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  const [checkedArr, setCheckedArr] = useState<CheckedProduct[]>([]);
  const [manualProducts, setManualProducts] = useState<QuickOrderListItem[]>([]);
  const { purchasabilityPermission } = useAppSelector(rolePermissionSelector);

  const isShowQuickOrderPad = isB2BUser ? purchasabilityPermission : true;

  const handleAddManualProducts = (items: QuickOrderListItem[]) => {
    if (!items.length) return;

    setManualProducts((prev) => {
      const existingIds = new Set(prev.map(({ node }) => node.id));
      const newItems = items.filter(({ node }) => !existingIds.has(node.id));

      return [...newItems, ...prev];
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Grid
          sx={{
            m: 0,
            width: '100%',
          }}
          container
          spacing={2}
        >
          <Grid
            item
            xs={isMobile ? 12 : 8}
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '0px',
              borderStyle: 'solid',
              borderColor: '#000000',
              borderWidth: '0px 0.3px 0.3px 0px',
              boxShadow: 'none',
              pr: '16px',
            }}
          >
            <QuickOrderTable
              setCheckedArr={setCheckedArr}
              setIsRequestLoading={setIsRequestLoading}
              isRequestLoading={isRequestLoading}
              manualProducts={manualProducts}
            />
          </Grid>
          <Grid
            item
            xs={isMobile ? 12 : 4}
            sx={{
              pt: isMobile ? '16px' : '0px !important',
              pl: isMobile ? '0px !important' : '16px',
            }}
          >
            {isShowQuickOrderPad && <QuickOrderPad onAddProducts={handleAddManualProducts} />}
          </Grid>
        </Grid>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: '999',
        }}
      >
        <QuickOrderFooter
          checkedArr={checkedArr}
          isAgenting={isAgenting}
          setIsRequestLoading={setIsRequestLoading}
          isB2BUser={isB2BUser}
        />
      </Box>
    </Box>
  );
}

export default QuickOrder;
