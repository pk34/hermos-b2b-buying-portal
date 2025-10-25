import type { SVGProps } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { B3Tag } from '@/components';
import { verifyLevelPermission } from '@/utils';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';

import { getUserRole } from './config';

interface RoleListProps {
  label: string;
  value: string | number;
  color: string;
  textColor: string;
  idLang: string;
  name: string;
}

interface User {
  id: string;
  companyRoleName: string;
  firstName: string;
  lastName: string;
  email: string;
  companyInfo: {
    companyId: string;
  };
}

export type Edit = (userId: string) => void;
export type Delete = (userId: string) => void;

interface OrderItemCardProps {
  item: User;
  onEdit: Edit;
  onDelete: Delete;
}

const StyledCard = styled(Card)(() => ({
  width: '327px',
  height: '194px',
  borderRadius: '10px',
  backgroundColor: '#FFFFFF',
  border: '0.2px solid #000000',
  borderTop: '0.2px solid #000000',
  boxShadow: '0px 4px 22px 5px #0000001A',
}));

const StyledCardContent = styled(CardContent)(() => ({
  padding: '20px',
  '&:last-child': {
    paddingBottom: '20px',
  },
}));

const Title = styled(Typography)(() => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '20px',
  lineHeight: '28px',
  color: '#000000',
  marginLeft: '7px',
  marginTop: '9px',
  marginBottom: '9px',
}));

const Subtitle = styled(Typography)(() => ({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  marginLeft: '7px',
  marginTop: '9px',
  marginBottom: '9px',
}));

const StyledRoleTag = styled(B3Tag)(() => ({
  borderRadius: '20px',
  padding: '10px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  marginLeft: '7px',
  marginTop: '9px',
  marginBottom: '9px',
}));

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginLeft: '7px',
  marginTop: '9px',
  marginBottom: '9px',
}));

const IconWrapper = styled(IconButton)(() => ({
  padding: 0,
  '&:not(:last-of-type)': {
    marginRight: '8px',
  },
}));

const EditActionIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11 5.03773H6C4.89543 5.03773 4 5.94 4 7.053V18.137C4 19.25 4.89543 20.1522 6 20.1522H17C18.1046 20.1522 19 19.25 19 18.137V13.0988M17.5858 3.61272C18.3668 2.82571 19.6332 2.82571 20.4142 3.61272C21.1953 4.39973 21.1953 5.67573 20.4142 6.46274L11.8284 15.1141H9L9 12.264L17.5858 3.61272Z"
      stroke="#0067A0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DeleteActionIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M19 7.05299L18.1327 19.2882C18.0579 20.3428 17.187 21.1599 16.1378 21.1599H7.86224C6.81296 21.1599 5.94208 20.3428 5.86732 19.2882L5 7.05299M10 11.0835V17.1293M14 11.0835V17.1293M15 7.05299V4.03009C15 3.47359 14.5523 3.02246 14 3.02246H10C9.44772 3.02246 9 3.47359 9 4.03009V7.05299M4 7.05299H20"
      stroke="#F70000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function UserItemCard(props: OrderItemCardProps) {
  const { item: userInfo, onEdit, onDelete } = props;
  const { companyInfo, id, companyRoleName, firstName, lastName, email } = userInfo;

  const { userUpdateActionsPermission, userDeleteActionsPermission } = b2bPermissionsMap;

  const updateActionsPermission = verifyLevelPermission({
    code: userUpdateActionsPermission,
    companyId: Number(companyInfo?.companyId || 0),
    userId: Number(id),
  });
  const deleteActionsPermission = verifyLevelPermission({
    code: userDeleteActionsPermission,
    companyId: Number(companyInfo?.companyId || 0),
    userId: Number(id),
  });

  const getNewRoleList = () => {
    const userRole = getUserRole();
    const newRoleList: Array<RoleListProps> = userRole.map((item) => {
      if (Number(item.value) === 2) {
        if (companyRoleName !== 'Junior Buyer') {
          return {
            color: '#ce93d8',
            textColor: 'black',
            ...item,
            label: companyRoleName,
            name: companyRoleName,
          };
        }
        return {
          color: '#D9DCE9',
          textColor: 'black',
          ...item,
        };
      }
      if (Number(item.value) === 1) {
        return {
          color: 'rgba(237, 108, 2, 0.3)',
          textColor: 'black',
          ...item,
        };
      }
      return {
        color: '#C4DD6C',
        textColor: 'black',
        ...item,
      };
    });

    return newRoleList;
  };

  const statusRender = (name: string) => {
    const newRoleList = getNewRoleList();
    const roleItem = newRoleList.find((item: RoleListProps) => item.name === name);

    if (!roleItem) return null;
    return (
      <StyledRoleTag color={roleItem.color} textColor={roleItem.textColor}>
        {roleItem.label}
      </StyledRoleTag>
    );
  };

  return (
    <StyledCard key={id}>
      <StyledCardContent>
        <Title>{firstName} {lastName}</Title>

        <Subtitle>{email}</Subtitle>
        <Flex>
          {statusRender(companyRoleName)}
          <Box>
            {updateActionsPermission && (
              <IconWrapper aria-label="edit" size="small" onClick={() => onEdit(userInfo.id)}>
                <EditActionIcon />
              </IconWrapper>
            )}
            {deleteActionsPermission && (
              <IconWrapper aria-label="delete" size="small" onClick={() => onDelete(userInfo.id)}>
                <DeleteActionIcon />
              </IconWrapper>
            )}
          </Box>
        </Flex>
      </StyledCardContent>
    </StyledCard>
  );
}
