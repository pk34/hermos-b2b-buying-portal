import { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, styled, Typography } from '@mui/material';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

import CustomButton from '@/components/button/CustomButton';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { type SetOpenPage } from '@/pages/SetOpenPage';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';
import { verifyLevelPermission, verifySubmitShoppingListSubsidiariesPermission } from '@/utils';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';

import { ShoppingListStatusTag } from '../../ShoppingLists/ShoppingListStatusTag';

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
}));

const BackArrowIcon = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 20 21" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.7071 5.33419C13.0976 5.7277 13.0976 6.3657 12.7071 6.7592L9.41421 10.0772L12.7071 13.3953C13.0976 13.7888 13.0976 14.4268 12.7071 14.8203C12.3166 15.2138 11.6834 15.2138 11.2929 14.8203L7.29289 10.7897C6.90237 10.3962 6.90237 9.75824 7.29289 9.36473L11.2929 5.33419C11.6834 4.94069 12.3166 4.94069 12.7071 5.33419Z"
      fill="#0A0A0A"
    />
  </SvgIcon>
);

interface ShoppingDetailHeaderProps {
  shoppingListInfo: any;
  role: string | number;
  customerInfo: any;
  goToShoppingLists: () => void;
  handleUpdateShoppingList: (status: number) => void;
  isB2BUser: boolean;
  setOpenPage: SetOpenPage;
  isAgenting: boolean;
  openAPPParams: {
    shoppingListBtn: string;
  };
}

function ShoppingDetailHeader(props: ShoppingDetailHeaderProps) {
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const {
    shoppingListInfo,
    customerInfo,
    handleUpdateShoppingList,
    goToShoppingLists,
    isB2BUser,
    setOpenPage,
    openAPPParams,
  } = props;

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);
  const navigate = useNavigate();

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const {
    submitShoppingListPermission: submitShoppingList,
    approveShoppingListPermission: approveShoppingList,
  } = useAppSelector(rolePermissionSelector);

  const shoppingListPermissions = useMemo(() => {
    if (isB2BUser) {
      const companyInfo = shoppingListInfo?.companyInfo || {};

      const {
        submitShoppingListPermission: submitShoppingListPermissionCode,
        approveShoppingListPermission: approveShoppingListPermissionCode,
      } = b2bPermissionsMap;
      const submitShoppingListPermissionLevel = verifySubmitShoppingListSubsidiariesPermission({
        code: submitShoppingListPermissionCode,
        userId: Number(customerInfo?.userId || 0),
        selectId: Number(selectCompanyHierarchyId),
      });

      const approveShoppingListPermissionLevel = verifyLevelPermission({
        code: approveShoppingListPermissionCode,
        companyId: Number(companyInfo?.companyId || 0),
        userId: Number(customerInfo?.userId || 0),
      });

      return {
        submitShoppingListPermission: submitShoppingListPermissionLevel,
        approveShoppingListPermission: approveShoppingListPermissionLevel,
      };
    }

    return {
      submitShoppingListPermission: submitShoppingList,
      approveShoppingListPermission: approveShoppingList,
    };
  }, [
    customerInfo,
    isB2BUser,
    submitShoppingList,
    approveShoppingList,
    shoppingListInfo?.companyInfo,
    selectCompanyHierarchyId,
  ]);

  const isDisabledBtn = shoppingListInfo?.products?.edges.length === 0;

  const { submitShoppingListPermission, approveShoppingListPermission } = shoppingListPermissions;

  const gridOptions = (xs: number) =>
    isMobile
      ? {}
      : {
          xs,
        };
  return (
    <>
      <Box
        sx={{
          marginBottom: '16px',
          width: 'fit-content',
        }}
      >
        <Box
          sx={{
            color: '#000000',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => {
            if (openAPPParams.shoppingListBtn !== 'add') {
              goToShoppingLists();
            } else {
              navigate('/');
              setOpenPage({
                isOpen: false,
                openUrl: '',
              });
            }
          }}
        >
          <BackArrowIcon
            sx={{
              fontSize: '20px',
              marginRight: '0.5rem',
            }}
          />
          <Box
            component="span"
            sx={{
              margin: 0,
              m: 0,
              fontFamily: "'Lato', sans-serif",
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '24px',
              color: '#000000',
            }}
          >
            {openAPPParams.shoppingListBtn !== 'add'
              ? b3Lang('shoppingList.header.backToShoppingLists')
              : b3Lang('shoppingList.header.backToProduct')}
          </Box>
        </Box>
      </Box>
      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          mb: isMobile ? '16px' : '',
        }}
      >
        <Grid
          item
          {...gridOptions(8)}
          sx={{
            color: getContrastColor(backgroundColor),
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: isMobile ? 'start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
          <Typography
            variant="h4"
            sx={{
              marginRight: '1rem',
              marginBottom: '20px',
              wordBreak: 'break-all',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 600,
              fontSize: '30px',
              lineHeight: '38px',
                color: '#0067A0',
              }}
            >
              {`${shoppingListInfo?.name || ''}`}
            </Typography>
            {isB2BUser &&
              (submitShoppingListPermission ||
                (approveShoppingListPermission && shoppingListInfo?.approvedFlag)) && (
                <Typography
                  sx={{
                    m: isMobile ? '10px 0' : '0',
                  }}
                >
                  {shoppingListInfo && <ShoppingListStatusTag status={shoppingListInfo?.status} />}
                </Typography>
              )}
          </Box>
          <Box>
            <Typography
              sx={{
                width: '100%',
                wordBreak: 'break-all',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#000000',
              }}
            >
              {shoppingListInfo?.description}
            </Typography>
            {isB2BUser && (
              <StyledCreateName>
                <Typography
                  variant="subtitle2"
                  sx={{
                    marginRight: '0.5rem',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                  }}
                >
                  {b3Lang('shoppingList.header.createdBy')}
                </Typography>
                <span
                  style={{
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#000000',
                  }}
                >
                  {`${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`}
                </span>
              </StyledCreateName>
            )}
          </Box>
        </Grid>

        <Grid
          item
          sx={{
            textAlign: isMobile ? 'none' : 'end',
          }}
          {...gridOptions(4)}
        >
          {submitShoppingListPermission &&
            shoppingListInfo?.status === ShoppingListStatus.Draft && (
              <CustomButton
                variant="outlined"
                disabled={isDisabledBtn}
                onClick={() => {
                  handleUpdateShoppingList(ShoppingListStatus.ReadyForApproval);
                }}
              >
                {b3Lang('shoppingList.header.submitForApproval')}
              </CustomButton>
            )}
          {approveShoppingListPermission &&
            shoppingListInfo?.status === ShoppingListStatus.ReadyForApproval && (
              <Box>
                <CustomButton
                  variant="outlined"
                  sx={{
                    marginRight: '1rem',
                  }}
                  onClick={() => {
                    handleUpdateShoppingList(ShoppingListStatus.Rejected);
                  }}
                >
                  {b3Lang('shoppingList.header.reject')}
                </CustomButton>
                {approveShoppingListPermission && (
                  <CustomButton
                    variant="outlined"
                    onClick={() => {
                      handleUpdateShoppingList(ShoppingListStatus.Approved);
                    }}
                  >
                    {b3Lang('shoppingList.header.approve')}
                  </CustomButton>
                )}
              </Box>
            )}
        </Grid>
      </Grid>
    </>
  );
}

export default ShoppingDetailHeader;
