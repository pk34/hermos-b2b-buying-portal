import { useEffect, useState } from 'react';
import type { SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import CustomButton from '@/components/button/CustomButton';
import { useB3Lang } from '@/lib/lang';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';
import { displayFormat, verifyLevelPermission } from '@/utils';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';

import { ShoppingListsItemsProps } from './config';
import { ShoppingListStatusTag } from './ShoppingListStatusTag';

interface OrderItemCardProps {
  item: ShoppingListsItemsProps;
  onEdit: (data: ShoppingListsItemsProps) => void;
  onDelete: (data: ShoppingListsItemsProps) => void;
  onCopy: (data: ShoppingListsItemsProps) => void;
  isPermissions: boolean;
  isB2BUser: boolean;
}

const titleStyles: CSSObject = {
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '24px',
  lineHeight: '28px',
  color: '#000000',
  width: '100%',
  overflowWrap: 'break-word',
};

const Title = styled(Typography)(titleStyles);

const InfoRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap' as const,
  gap: '8px',
  marginBottom: '8px',
  '&:last-of-type': {
    marginBottom: 0,
  },
}));

const InfoText = styled('span')(() => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#000000',
}));

const ActionsRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'auto',
}));

const ActionsContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
}));

const StyledIconButton = styled(IconButton)(() => ({
  padding: 0,
  borderRadius: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const iconWrapperStyles = {
  display: 'block',
} as const;

const EditIconSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={25}
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={iconWrapperStyles}
    aria-hidden
    focusable="false"
    {...props}
  >
    <path
      d="M11 5.03871H6C4.89543 5.03871 4 5.94097 4 7.05398V18.1379C4 19.251 4.89543 20.1532 6 20.1532H17C18.1046 20.1532 19 19.251 19 18.1379V13.0998M17.5858 3.6137C18.3668 2.82668 19.6332 2.82668 20.4142 3.6137C21.1953 4.40071 21.1953 5.6767 20.4142 6.46371L11.8284 15.115H9L9 12.265L17.5858 3.6137Z"
      stroke="#0067A0"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIconSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={iconWrapperStyles}
    aria-hidden
    focusable="false"
    {...props}
  >
    <path
      d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18M8 5C8 6.10457 8.89543 7 10 7H12C13.1046 7 14 6.10457 14 5M8 5C8 3.89543 8.89543 3 10 3H12C13.1046 3 14 3.89543 14 5M14 5H16C17.1046 5 18 5.89543 18 7V10M20 14H10M10 14L13 11M10 14L13 17"
      stroke="#00965E"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DeleteIconSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={25}
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={iconWrapperStyles}
    aria-hidden
    focusable="false"
    {...props}
  >
    <path
      d="M19 7.05397L18.1327 19.2892C18.0579 20.3438 17.187 21.1608 16.1378 21.1608H7.86224C6.81296 21.1608 5.94208 20.3438 5.86732 19.2892L5 7.05397M10 11.0845V17.1303M14 11.0845V17.1303M15 7.05397V4.03107C15 3.47457 14.5523 3.02344 14 3.02344H10C9.44772 3.02344 9 3.47457 9 4.03107V7.05397M4 7.05397H20"
      stroke="#F70000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function ShoppingListsCard(props: OrderItemCardProps) {
  const { item: shoppingList, onEdit, onDelete, onCopy, isPermissions, isB2BUser } = props;
  const b3Lang = useB3Lang();

  const [isCanEditShoppingList, setIsCanEditShoppingList] = useState<boolean>(true);

  const { submitShoppingListPermission, approveShoppingListPermission } =
    useAppSelector(rolePermissionSelector);

  const getEditPermissions = (status: number) => {
    if (submitShoppingListPermission) {
      if (status === ShoppingListStatus.Draft || status === ShoppingListStatus.Approved)
        return false;
      return true;
    }

    if (status === ShoppingListStatus.ReadyForApproval) return true;

    return false;
  };

  const shoppingListCanBeDeleted = (status: number) => {
    if (!submitShoppingListPermission) {
      return true;
    }

    // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
    // We need to add Deleted here so that the shopping lists that were previously rejected remain the same behavior
    const isInDeletableStatus =
      status === ShoppingListStatus.Deleted ||
      status === ShoppingListStatus.Draft ||
      status === ShoppingListStatus.Rejected;

    return isInDeletableStatus;
  };

  const navigate = useNavigate();

  const goToDetail = (shoppingList: ShoppingListsItemsProps) =>
    navigate(`/shoppingList/${shoppingList.id}`, {
      state: {
        from: 'shoppingList',
      },
    });

  useEffect(() => {
    if (isB2BUser) {
      const { companyInfo, customerInfo } = shoppingList;

      const { shoppingListCreateActionsPermission } = b2bPermissionsMap;
      const shoppingListActionsPermission = verifyLevelPermission({
        code: shoppingListCreateActionsPermission,
        companyId: Number(companyInfo?.companyId || 0),
        userId: Number(customerInfo.userId),
      });

      setIsCanEditShoppingList(shoppingListActionsPermission);
    }
  }, [shoppingList, isB2BUser]);

  return (
    <Card
      key={shoppingList.id}
      sx={{
        width: '389px',
        height: '231px',
        background: '#FFFFFF',
        borderRadius: '0px',
        borderTop: '0px solid transparent',
        borderRight: '0.3px solid #000000',
        borderBottom: '0.3px solid #000000',
        borderLeft: '0px solid transparent',
        boxShadow: 'none',
        display: 'flex',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '24px',
          color: '#000000',
          '&:last-child': {
            paddingBottom: '24px',
          },
        }}
      >
        <Title>{shoppingList.name}</Title>
        <Box
          sx={{
            mt: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isB2BUser &&
            (submitShoppingListPermission ||
              (approveShoppingListPermission && shoppingList.approvedFlag)) && (
              <Box sx={{ mb: '24px' }}>
                <ShoppingListStatusTag status={shoppingList.status} />
              </Box>
            )}
          {isB2BUser && (
            <InfoRow>
              <InfoText>{b3Lang('shoppingLists.card.createdBy')}</InfoText>
              <InfoText>
                {shoppingList.customerInfo.firstName} {shoppingList.customerInfo.lastName}
              </InfoText>
            </InfoRow>
          )}
          <InfoRow>
            <InfoText>{b3Lang('shoppingLists.card.products')}</InfoText>
            <InfoText>{shoppingList.products.totalCount}</InfoText>
          </InfoRow>
          <InfoRow>
            <InfoText>{b3Lang('shoppingLists.card.lastActivity')}</InfoText>
            <InfoText>{`${displayFormat(shoppingList.updatedAt)}`}</InfoText>
          </InfoRow>
        </Box>
        <ActionsRow>
          <CustomButton
            variant="text"
            onClick={() => goToDetail(shoppingList)}
            sx={{
              width: 'auto',
              minWidth: 'auto',
              height: '39px',
              borderRadius: '5px',
              p: '10px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#0067A0',
              fontFamily: "'Lato', sans-serif",
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '24px',
              textAlign: 'center',
              verticalAlign: 'middle',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'none',
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: '#00965E',
                backgroundColor: 'transparent',
              },
            }}
          >
            {b3Lang('shoppingLists.card.view')}
          </CustomButton>
          <ActionsContainer sx={{ display: isPermissions ? 'flex' : 'none' }}>
            {!getEditPermissions(shoppingList.status) && isCanEditShoppingList && (
              <StyledIconButton
                aria-label="edit"
                size="medium"
                onClick={() => {
                  onEdit(shoppingList);
                }}
              >
                <EditIconSvg />
              </StyledIconButton>
            )}

            <StyledIconButton
              aria-label="duplicate"
              size="medium"
              onClick={() => {
                onCopy(shoppingList);
              }}
            >
              <CopyIconSvg />
            </StyledIconButton>
            {shoppingListCanBeDeleted(shoppingList.status) && isCanEditShoppingList && (
              <StyledIconButton
                aria-label="delete"
                size="medium"
                onClick={() => {
                  onDelete(shoppingList);
                }}
              >
                <DeleteIconSvg />
              </StyledIconButton>
            )}
          </ActionsContainer>
        </ActionsRow>
      </CardContent>
    </Card>
  );
}

export default ShoppingListsCard;
