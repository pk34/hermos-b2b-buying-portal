import { useContext, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

import B3Filter from '@/components/filter/B3Filter';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable, GetRequestList } from '@/components/table/B3PaginationTable';
import { useCardListColumn, useTableRef, useVerifyCreatePermission } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import {
  getB2BAddress,
  getB2BAddressConfig,
  getB2BCountries,
  getBCCustomerAddress,
} from '@/shared/service/b2b';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { b2bPermissionsMap, snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';

import { AddressItemType, BCAddressItemType } from '../../types/address';

import B3AddressForm from './components/AddressForm';
import { AddressItemCard } from './components/AddressItemCard';
import DeleteAddressDialog from './components/DeleteAddressDialog';
import SetDefaultDialog from './components/SetDefaultDialog';
import { convertBCToB2BAddress, filterFormConfig } from './shared/config';
import { CountryProps, getAddressFields } from './shared/getAddressFields';

const permissionKeys = [
  b2bPermissionsMap.addressesCreateActionsPermission,
  b2bPermissionsMap.addressesUpdateActionsPermission,
  b2bPermissionsMap.addressesDeleteActionsPermission,
];
interface RefCurrentProps extends HTMLInputElement {
  handleOpenAddEditAddressClick(type: 'add'): void;
  handleOpenAddEditAddressClick(type: 'edit', data: AddressItemType): void;
}

type BCAddress = {
  node: BCAddressItemType;
};

interface FilterSearchProps {
  country?: string;
  state?: string;
  city?: string;
  search?: string;
}

type Dialog = 'delete' | 'setDefault';

interface Config {
  key: string;
  isEnabled: string;
}
const isConfigEnabled = (configs: Config[] | undefined, key: string) => {
  return (configs ?? []).find((config) => config.key === key)?.isEnabled === '1';
};

function Address() {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const role = useAppSelector(({ company }) => company.customer.role);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const {
    state: { addressConfig },
    dispatch,
  } = useContext(GlobalContext);

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const b3Lang = useB3Lang();
  const isExtraLarge = useCardListColumn();
  const [paginationTableRef] = useTableRef();

  const addEditAddressRef = useRef<RefCurrentProps | null>(null);

  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [addressFields, setAddressFields] = useState<CustomFieldItems[]>([]);
  const [countries, setCountries] = useState<CountryProps[]>([]);
  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>({
    search: '',
  });

  const companyId =
    role === CustomerRole.SUPER_ADMIN && isAgenting ? salesRepCompanyId : companyInfoId;

  const isBCPermission = !isB2BUser || (role === CustomerRole.SUPER_ADMIN && !isAgenting);

  useEffect(() => {
    const handleGetAddressFields = async () => {
      const { countries } = await getB2BCountries();

      setCountries(countries);
      setIsRequestLoading(true);
      try {
        const addressFields = await getAddressFields(!isBCPermission, countries);
        setAddressFields(addressFields || []);
      } catch (err) {
        b2bLogger.error(err);
      } finally {
        setIsRequestLoading(false);
      }
    };

    handleGetAddressFields();
  }, [isBCPermission]);

  const getAddressList: GetRequestList<FilterSearchProps, AddressItemType> = async (
    params = {},
  ) => {
    if (!isBCPermission) {
      const { edges = [], totalCount } = await getB2BAddress({ companyId, ...params });

      return {
        edges,
        totalCount,
      };
    }

    const { edges = [], totalCount } = await getBCCustomerAddress({ ...params });

    return {
      edges: edges.map((address: BCAddress) => ({
        node: convertBCToB2BAddress(address.node),
      })),
      totalCount,
    };
  };

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        search: value,
      });
    }
  };

  const handleFilterChange = (values: FilterSearchProps) => {
    setFilterData({
      ...filterData,
      country: values.country || '',
      state: values.state || '',
      city: values.city || '',
    });
  };

  const updateAddressList = () => {
    paginationTableRef.current?.refresh();
  };

  const [editPermission, setEditPermission] = useState(false);

  const [openDialog, setOpenDialog] = useState<Dialog>();
  const closeDialog = () => setOpenDialog(undefined);

  const [currentAddress, setCurrentAddress] = useState<AddressItemType>();

  const [isCreatePermission, updateActionsPermission, deleteActionsPermission] =
    useVerifyCreatePermission(permissionKeys);

  useEffect(() => {
    const getEditPermission = async () => {
      if (isBCPermission) {
        setEditPermission(true);
        return;
      }

      if (updateActionsPermission) {
        try {
          let configList = addressConfig;
          if (!configList) {
            const { addressConfig: newConfig } = await getB2BAddressConfig();
            configList = newConfig;

            dispatch({
              type: 'common',
              payload: {
                addressConfig: configList,
              },
            });
          }

          const editPermission =
            isConfigEnabled(configList, 'address_book') &&
            isConfigEnabled(configList, role === 3 ? 'address_sales_rep' : 'address_admin');

          setEditPermission(editPermission);
        } catch (error) {
          b2bLogger.error(error);
        }
      }
    };
    getEditPermission();
  }, [addressConfig, dispatch, isBCPermission, role, updateActionsPermission]);

  const handleCreate = () => {
    if (!editPermission) {
      snackbar.error(b3Lang('addresses.noPermissionToAdd'));
      return;
    }

    addEditAddressRef.current?.handleOpenAddEditAddressClick('add');
  };

  const handleEdit = (row: AddressItemType) => {
    if (!editPermission) {
      snackbar.error(b3Lang('addresses.noPermissionToEdit'));
      return;
    }

    addEditAddressRef.current?.handleOpenAddEditAddressClick('edit', row);
  };

  const handleDelete = (address: AddressItemType) => {
    if (!editPermission) {
      snackbar.error(b3Lang('addresses.noPermissionToEdit'));
      return;
    }

    setCurrentAddress({ ...address });
    setOpenDialog('delete');
  };

  const handleSetDefault = (address: AddressItemType) => {
    setCurrentAddress({ ...address });
    setOpenDialog('setDefault');
  };

  const addButtonConfig = {
    isEnabled: isBCPermission || (editPermission && isCreatePermission),
    customLabel: b3Lang('addresses.addNewAddress'),
  };

  const translatedFilterFormConfig = filterFormConfig.map(({ idLang, ...element }) => ({
    ...element,
    label: b3Lang(idLang),
  }));

  const currentUseCompanyHierarchyId = Number(selectCompanyHierarchyId) || Number(companyId);

  const canEdit = updateActionsPermission || isBCPermission;
  const canDelete = deleteActionsPermission || isBCPermission;
  const canSetDefault = !isBCPermission && updateActionsPermission;

  return (
    <B3Spin isSpinning={isRequestLoading}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <B3Filter
          filterMoreInfo={translatedFilterFormConfig}
          handleChange={handleChange}
          handleFilterChange={handleFilterChange}
          customButtonConfig={addButtonConfig}
          handleFilterCustomButtonClick={handleCreate}
        />
        <B3PaginationTable
          ref={paginationTableRef}
          columnItems={[]}
          rowsPerPageOptions={[12, 24, 36]}
          getRequestList={getAddressList}
          searchParams={filterData}
          isCustomRender
          itemXs={isExtraLarge ? 3 : 4}
          requestLoading={setIsRequestLoading}
          tableKey="id"
          renderItem={(row) => (
            <AddressItemCard
              key={row.id}
              item={row}
              onEdit={canEdit ? () => handleEdit(row) : undefined}
              onDelete={canDelete ? () => handleDelete(row) : undefined}
              onSetDefault={canSetDefault ? () => handleSetDefault(row) : undefined}
            />
          )}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '674px',
            height: '60px',
            borderRadius: '5px',
            padding: '10px',
            mt: '21px',
            backgroundColor: '#E6E6E6',
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="20"
              height="22"
              viewBox="0 0 20 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18 11.0005C18 15.4525 14.4183 19.0616 10 19.0616C5.58172 19.0616 2 15.4525 2 11.0005C2 6.54851 5.58172 2.93945 10 2.93945C14.4183 2.93945 18 6.54851 18 11.0005ZM11 15.031C11 15.5875 10.5523 16.0387 10 16.0387C9.44772 16.0387 9 15.5875 9 15.031C9 14.4745 9.44772 14.0234 10 14.0234C10.5523 14.0234 11 14.4745 11 15.031ZM10 5.96235C9.44772 5.96235 9 6.41348 9 6.96998V11.0005C9 11.557 9.44772 12.0081 10 12.0081C10.5523 12.0081 11 11.557 11 11.0005V6.96998C11 6.41348 10.5523 5.96235 10 5.96235Z"
                fill="#FF8E3E"
              />
            </svg>
          </Box>
          <Box
            component="p"
            sx={{
              fontFamily: 'Lato',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#FF8E3E',
              ml: '5px',
            }}
          >
            Necesitas agregar o modificar una dirección contacta a tu vendedor o escríbenos a
            ayuda@hermos.com
          </Box>
        </Box>

        <B3AddressForm
          updateAddressList={updateAddressList}
          addressFields={addressFields}
          ref={addEditAddressRef}
          companyId={currentUseCompanyHierarchyId}
          isBCPermission={isBCPermission}
          countries={countries}
        />

        {editPermission && !isBCPermission && (
          <SetDefaultDialog
            isOpen={openDialog === 'setDefault'}
            closeDialog={closeDialog}
            setIsLoading={setIsRequestLoading}
            addressData={currentAddress}
            updateAddressList={updateAddressList}
            companyId={currentUseCompanyHierarchyId}
          />
        )}

        {editPermission && (
          <DeleteAddressDialog
            isOpen={openDialog === 'delete'}
            closeDialog={closeDialog}
            setIsLoading={setIsRequestLoading}
            addressData={currentAddress}
            updateAddressList={updateAddressList}
            companyId={currentUseCompanyHierarchyId}
            isBCPermission={isBCPermission}
          />
        )}
      </Box>
    </B3Spin>
  );
}

export default Address;
