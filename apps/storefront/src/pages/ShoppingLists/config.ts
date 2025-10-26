import { filterModalFieldBaseSx } from '@/components/filter/styles';
import { LangFormatFunction, useB3Lang } from '@/lib/lang';
import { CompanyInfoTypes } from '@/types/invoice';
import { ShoppingListStatus } from '@/types/shoppingList';

export interface ShoppingListSearch {
  search?: string;
  createdBy?: string;
  status?: string | number | number[];
  offset?: number;
  first?: number;
}

interface ShoppingListStatusProps {
  label: string;
  value: number | string;
  idLang: string;
}

interface ShoppingListsItemsCustomerInfoProps {
  firstName: string;
  lastName: string;
  userId: number;
  email: string;
  role: string;
}

export interface ShoppingListsItemsProps {
  id?: number;
  name: string;
  description: string;
  status: number;
  customerInfo: ShoppingListsItemsCustomerInfoProps;
  products: {
    totalCount: number;
  };
  updatedAt: string | number;
  sampleShoppingListId?: number | string;
  channelId: number;
  approvedFlag: boolean;
  isOwner: boolean;
  companyInfo: CompanyInfoTypes | null;
  companyId?: number;
}

export interface GetFilterMoreListProps {
  options?: Array<ShoppingListStatusProps>;
  rows?: string | number;
  name: string;
  label: string;
  required: boolean;
  default: string;
  fieldType: string;
  xs: number;
  variant: string;
  size: string;
  maxLength?: number;
  idLang?: string;
}

const useGetFilterShoppingListStatus = () => {
  const b3Lang = useB3Lang();

  return (submitShoppingListPermission: boolean) => {
    const draftStatus = {
      value: ShoppingListStatus.Draft,
      label: b3Lang('global.shoppingLists.status.draft'),
    };
    const rejectedStatus = {
      value: ShoppingListStatus.Rejected,
      label: b3Lang('global.shoppingLists.status.rejected'),
    };

    // TODO: fix 99 which is used for selecting all
    return [
      { value: 99, label: b3Lang('global.shoppingLists.status.all') },
      { value: ShoppingListStatus.Approved, label: b3Lang('global.shoppingLists.status.approved') },
      ...(submitShoppingListPermission ? [draftStatus] : []),
      {
        value: ShoppingListStatus.ReadyForApproval,
        label: b3Lang('global.shoppingLists.status.readyForApproval'),
      },
      ...(submitShoppingListPermission ? [rejectedStatus] : []),
    ];
  };
};

interface CreatedByUsers {
  createdByUser?: {
    results: Array<{ firstName: string; lastName: string; email: string }>;
  };
}

export const useGetFilterMoreList = () => {
  const b3Lang = useB3Lang();
  const getFilterShoppingListStatus = useGetFilterShoppingListStatus();

  return (submitShoppingListPermission: boolean, createdByUsers: CreatedByUsers) => {
    const newCreatedByUsers =
      createdByUsers?.createdByUser?.results.map((item) => ({
        createdBy: `${item.firstName} ${item.lastName} (${item.email})`,
      })) || [];

    return [
      {
        name: 'createdBy',
        required: false,
        default: '',
        fieldType: 'dropdown',
        options: newCreatedByUsers,
        replaceOptions: {
          label: 'createdBy',
          value: 'createdBy',
        },
        xs: 12,
        variant: 'filled',
        size: 'small',
        label: b3Lang('global.shoppingLists.filter.createdBy'),
        sx: filterModalFieldBaseSx,
      },
      {
        name: 'status',
        required: false,
        default: '',
        fieldType: 'dropdown',
        options: getFilterShoppingListStatus(submitShoppingListPermission),
        xs: 12,
        variant: 'filled',
        size: 'small',
        label: b3Lang('global.shoppingLists.filter.status'),
        sx: filterModalFieldBaseSx,
      },
    ];
  };
};

const shoppingListModalFieldBaseSx = {
  width: '90%',
  marginBottom: '24px',
  '& .MuiFilledInput-root': {
    borderRadius: '5px',
    backgroundColor: '#FFFFFF',
    padding: 0,
    '&:before': {
      borderBottom: '2px solid #231F20',
    },
    '&:after': {
      borderBottom: '2px solid #231F20',
    },
    '&:hover': {
      backgroundColor: '#FFFFFF',
    },
    '&.Mui-focused': {
      backgroundColor: '#FFFFFF',
    },
  },
  '& .MuiFilledInput-input': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    padding: '10px',
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#000000',
  },
} as const;

const shoppingListModalNameFieldSx = {
  ...shoppingListModalFieldBaseSx,
  '& .MuiFilledInput-root': {
    ...shoppingListModalFieldBaseSx['& .MuiFilledInput-root'],
    height: '44px',
  },
} as const;

const shoppingListModalDescriptionFieldSx = {
  ...shoppingListModalFieldBaseSx,
  '& .MuiFilledInput-root': {
    ...shoppingListModalFieldBaseSx['& .MuiFilledInput-root'],
    minHeight: '83px',
    height: '83px',
    alignItems: 'flex-start',
  },
  '& .MuiFilledInput-input': {
    ...shoppingListModalFieldBaseSx['& .MuiFilledInput-input'],
    height: '83px',
  },
  '& .MuiFilledInput-inputMultiline': {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    padding: '10px',
    height: '83px',
    boxSizing: 'border-box',
  },
} as const;

export const getCreatedShoppingListFiles = (
  b3Lang: LangFormatFunction,
): GetFilterMoreListProps[] => [
  {
    name: 'name',
    label: b3Lang('shoppingLists.name'),
    required: true,
    default: '',
    fieldType: 'text',
    xs: 12,
    variant: 'filled',
    size: 'small',
    maxLength: 200,
    sx: shoppingListModalNameFieldSx,
  },
  {
    name: 'description',
    label: b3Lang('shoppingLists.description'),
    required: false,
    default: '',
    fieldType: 'multiline',
    xs: 12,
    variant: 'filled',
    size: 'small',
    rows: 4,
    maxLength: 200,
    sx: shoppingListModalDescriptionFieldSx,
  },
];
