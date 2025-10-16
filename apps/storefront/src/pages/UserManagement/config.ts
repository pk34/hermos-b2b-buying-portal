import { LangFormatFunction } from '@/lib/lang';

interface ExtraFieldsProps {
  fieldName: string;
  fieldValue: string | number;
}

interface FilterProps {
  first: number;
  offset: number;
  search: string;
  role: number | string;
  companyId: number | string;
  addChannel: boolean;
  [key: string]: string | null | number | boolean | ExtraFieldsProps[];
}

interface UsersFilesProps {
  [key: string]: string | boolean | number | Array<unknown> | undefined | Record<string, unknown>;
  name: string;
  sx?: Record<string, unknown>;
}

interface UserRoleProps {
  label: string;
  value: number;
  idLang: string;
  name: string;
}

const getUserRole = () => {
  const userRole: Array<UserRoleProps> = [
    {
      label: 'Admin',
      name: 'Admin',
      value: 0,
      idLang: 'userManagement.userRole.admin',
    },
    {
      label: 'Senior buyer',
      name: 'Senior Buyer',
      value: 1,
      idLang: 'userManagement.userRole.seniorBuyer',
    },
    {
      label: 'Junior buyer',
      name: 'Junior Buyer',
      value: 2,
      idLang: 'userManagement.userRole.juniorBuyer',
    },
  ];

  return userRole;
};

const addEditUserFieldBaseSx = {
  width: '100%',
  '& .MuiFilledInput-root': {
    height: '44px',
    opacity: 1,
    borderRadius: '5px',
    backgroundColor: '#F7F7F7',
    '&:before': {
      borderBottomWidth: '2px',
      borderBottomColor: '#000000',
    },
    '&:after': {
      borderBottomWidth: '2px',
      borderBottomColor: '#000000',
    },
    '&:hover': {
      backgroundColor: '#F7F7F7',
    },
    '&.Mui-focused': {
      backgroundColor: '#F7F7F7',
    },
  },
  '& .MuiFilledInput-input': {
    padding: '10px',
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '16px',
    color: '#000000',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#000000',
  },
};

const getFilterMoreList = (b3Lang: LangFormatFunction) => {
  return [
    {
      name: 'companyRoleId',
      label: b3Lang('userManagement.config.userRole'),
      required: false,
      default: '',
      defaultName: '',
      fieldType: 'roleAutocomplete',
      xs: 12,
      disabled: false,
      variant: 'filled',
      size: 'small',
      sx: addEditUserFieldBaseSx,
    },
  ] satisfies [unknown];
};

const getUsersFiles = (type: string, b3Lang: LangFormatFunction, disabledUserRole = false) => {
  const roleArr = getFilterMoreList(b3Lang);
  roleArr[0].required = true;
  roleArr[0].disabled = disabledUserRole;

  const usersFiles = [
    ...roleArr,
    {
      name: 'email',
      label: b3Lang('userManagement.config.email'),
      required: true,
      fieldType: 'text',
      xs: 12,
      disabled: type === 'edit',
      default: '',
      variant: 'filled',
      size: 'small',
      sx: addEditUserFieldBaseSx,
    },
    {
      name: 'firstName',
      label: b3Lang('userManagement.config.firstName'),
      required: true,
      default: '',
      fieldType: 'text',
      xs: 6,
      variant: 'filled',
      size: 'small',
      sx: addEditUserFieldBaseSx,
    },
    {
      name: 'lastName',
      label: b3Lang('userManagement.config.lastName'),
      required: true,
      fieldType: 'text',
      xs: 6,
      default: '',
      variant: 'filled',
      size: 'small',
      sx: addEditUserFieldBaseSx,
    },
    {
      name: 'phone',
      label: b3Lang('userManagement.config.phoneNumber'),
      required: false,
      fieldType: 'text',
      xs: 12,
      default: '',
      variant: 'filled',
      size: 'small',
      sx: addEditUserFieldBaseSx,
    },
  ];

  return usersFiles;
};

type EmailError = {
  [k: number]: string;
};

const emailError: EmailError = {
  3: 'global.emailValidate.multipleCustomer',
  4: 'global.emailValidate.companyUsed',
  5: 'global.emailValidate.alreadyExits',
  6: 'global.emailValidate.usedSuperAdmin',
};

export { addEditUserFieldBaseSx, emailError, getFilterMoreList, getUserRole, getUsersFiles };

export type { FilterProps, UsersFilesProps, ExtraFieldsProps };
