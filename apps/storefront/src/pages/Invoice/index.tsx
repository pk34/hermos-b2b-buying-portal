import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import cloneDeep from 'lodash-es/cloneDeep';
import type { SxProps, Theme } from '@mui/material/styles';

import { B2BAutoCompleteCheckbox } from '@/components';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable, GetRequestList } from '@/components/table/B3PaginationTable';
import { TableColumnItem } from '@/components/table/B3Table';
import { permissionLevels } from '@/constants';
import { useMobile, useSort } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import { getInvoiceList, getInvoiceStats } from '@/shared/service/b2b';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { CustomerRole } from '@/types';
import { InvoiceList, InvoiceListNode } from '@/types/invoice';
import {
  b2bPermissionsMap,
  currencyFormat,
  currencyFormatInfo,
  displayFormat,
  getUTCTimestamp,
  handleGetCorrespondingCurrencyToken,
  snackbar,
  validatePermissionWithComparisonType,
} from '@/utils';
import b2bLogger from '@/utils/b3Logger';

import B3Filter from '../../components/filter/B3Filter';

import B3Pulldown from './components/B3Pulldown';
import InvoiceFooter from './components/InvoiceFooter';
import InvoiceStatus from './components/InvoiceStatus';
import PaymentsHistory from './components/PaymentsHistory';
import PaymentSuccess from './components/PaymentSuccess';
import PrintTemplate from './components/PrintTemplate';
import InvoiceListType, {
  defaultSortKey,
  filterFormConfig,
  filterFormConfigsTranslationVariables,
  sortIdArr,
} from './utils/config';
import { formattingNumericValues } from './utils/payment';
import { handlePrintPDF } from './utils/pdf';
import { InvoiceItemCard } from './InvoiceItemCard';

interface FilterSearchProps {
  [key: string]: string | number | number[] | null;
  q: string;
  startValue: number | string;
  endValue: number | string;
  companyIds: number[];
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void;
  getCacheList: () => void;
  setCacheAllList: (items?: InvoiceList[]) => void;
  setList: (items?: InvoiceListNode[]) => void;
  getSelectedValue: () => void;
}

const initFilter = {
  q: '',
  first: 10,
  offset: 0,
  orderBy: `-${sortIdArr[defaultSortKey]}`,
  companyIds: [],
};

const invoiceTableStyles: SxProps<Theme> = {
  '& .MuiCard-root': {
    backgroundColor: '#FFFFFF',
    border: '0.2px solid #000000',
    borderRadius: '10px',
    boxShadow: '0px 4px 22px 5px #0000001A',
    overflow: 'hidden',
  },
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  '& thead th': {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '20px',
    color: '#000000',
    padding: '16px 20px',
    borderBottom: '0.2px solid #000000 !important',
    backgroundColor: '#FFFFFF',
  },
  '& tbody td': {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    padding: '16px 20px',
    borderBottom: '0.2px solid #000000 !important',
  },
  '& tbody tr:last-of-type td': {
    borderBottom: '0.2px solid #000000 !important',
  },
  '& tbody td:first-of-type, & thead th:first-of-type': {
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  '& tbody td:nth-of-type(2), & thead th:nth-of-type(2)': {
    paddingLeft: '20px',
  },
  '& tbody .MuiCheckbox-root': {
    padding: '0 8px 0 0',
  },
  '& tbody .MuiIconButton-root': {
    color: '#000000',
  },
};

function useData() {
  const role = useAppSelector(({ company }) => company.customer.role);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const { selectCompanyHierarchyId, isEnabledCompanyHierarchy } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);

  const { invoicePayPermission, purchasabilityPermission } = useAppSelector(rolePermissionSelector);
  const currentCompanyId =
    role === CustomerRole.SUPER_ADMIN && isAgenting
      ? Number(salesRepCompanyId)
      : Number(companyInfoId);

  const { invoice: invoiceSubViewPermission } = useAppSelector(
    ({ company }) => company.pagesSubsidiariesPermission,
  );

  return {
    isAgenting,
    selectCompanyHierarchyId,
    isEnabledCompanyHierarchy,
    invoicePayPermission,
    purchasabilityPermission,
    currentCompanyId,
    invoiceSubViewPermission,
  };
}

function Invoice() {
  const currentDate = new Date().getTime();
  const b3Lang = useB3Lang();

  const {
    isAgenting,
    selectCompanyHierarchyId,
    isEnabledCompanyHierarchy,
    invoicePayPermission,
    purchasabilityPermission,
    currentCompanyId,
    invoiceSubViewPermission,
  } = useData();

  const navigate = useNavigate();
  const [isMobile] = useMobile();
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null);

  const { decimal_places: decimalPlaces = 2 } = currencyFormatInfo();

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  const [isOpenHistory, setIsOpenHistory] = useState<boolean>(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>('');
  const [receiptId, setReceiptId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [unpaidAmount, setUnpaidAmount] = useState<number>(0);
  const [overdueAmount, setOverdueAmount] = useState<number>(0);
  const [checkedArr, setCheckedArr] = useState<CustomFieldItems | InvoiceListNode[]>([]);
  const [selectedPay, setSelectedPay] = useState<CustomFieldItems | InvoiceListNode[]>([]);
  const [list, setList] = useState<InvoiceListNode[]>([]);

  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>({});

  const [filterChangeFlag, setFilterChangeFlag] = useState(false);
  const [filterLists, setFilterLists] = useState<InvoiceListNode[]>([]);
  const [selectAllPay, setSelectAllPay] = useState<boolean>(invoicePayPermission);

  const invoiceSubPayPermission = validatePermissionWithComparisonType({
    level: permissionLevels.COMPANY_SUBSIDIARIES,
    code: b2bPermissionsMap.invoicePayPermission,
  });

  const {
    state: { bcLanguage },
  } = useContext(GlobalContext);

  const [handleSetOrderBy, order, orderBy] = useSort(
    sortIdArr,
    defaultSortKey,
    filterData,
    setFilterData,
  );

  const location = useLocation();

  const isFiltering = (filterData: Partial<FilterSearchProps>) =>
    Object.keys(filterData).some(
      (key) => key !== 'first' && key !== 'offset' && key !== 'orderBy' && filterData[key],
    );

  const cacheFilterLists = (edges: InvoiceListNode[]) => {
    if (filterChangeFlag) {
      setFilterLists(edges);
      setFilterChangeFlag(false);
      return;
    }

    if (!filterLists.length) setFilterLists(edges);

    const copyCacheFilterList = [...filterLists];

    edges.forEach((item: InvoiceListNode) => {
      const option = item?.node || item;
      const isExist = filterLists.some((cache: InvoiceListNode) => {
        const cacheOption = cache.node;
        return cacheOption.id === option.id;
      });

      if (!isExist) {
        copyCacheFilterList.push(item);
      }
    });

    setFilterLists(copyCacheFilterList);
  };

  const handleStatisticsInvoiceAmount = async () => {
    try {
      setIsRequestLoading(true);
      const { invoiceStats } = await getInvoiceStats(
        filterData?.status ? Number(filterData.status) : 0,
        Number(decimalPlaces),
        filterData?.companyIds || [],
      );

      if (invoiceStats) {
        const { overDueBalance, totalBalance } = invoiceStats;
        setUnpaidAmount(Number(formattingNumericValues(Number(totalBalance), decimalPlaces)));
        setOverdueAmount(Number(formattingNumericValues(Number(overDueBalance), decimalPlaces)));
      }
    } catch (err) {
      b2bLogger.error(err);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    if (key === 'search') {
      setFilterData({
        ...filterData,
        q: value,
      });
      setFilterChangeFlag(true);
      setType(InvoiceListType.NORMAL);
    }
  };

  const handleFilterChange = (value: Partial<FilterSearchProps>) => {
    const startValue = value?.startValue
      ? getUTCTimestamp(new Date(value?.startValue).getTime() / 1000)
      : '';

    const endValue = value?.endValue
      ? getUTCTimestamp(new Date(value?.endValue).getTime() / 1000, true)
      : '';

    const status = value?.status === 3 ? 0 : value?.status;

    const search: Partial<FilterSearchProps> = {
      status: `${status}` || '',
      beginDateAt: startValue,
      endDateAt: endValue,
      beginDueDateAt: value?.status === 0 ? parseInt(`${currentDate / 1000}`, 10) : '',
      endDueDateAt: value?.status === 3 ? parseInt(`${currentDate / 1000}`, 10) : '',
    };

    setFilterData({
      ...filterData,
      ...search,
    });
    setFilterChangeFlag(true);
    setType(InvoiceListType.NORMAL);
  };

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getCacheList() || [];

      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: InvoiceListNode) => {
          const { node } = product;

          return Number(node.id) === Number(item);
        });

        return newItems;
      });

      const newEnableItems = checkedItems.filter(
        (item: InvoiceListNode | undefined) => item && !item.node.disableCurrentCheckbox,
      );
      setCheckedArr([...newEnableItems]);
    } else {
      setCheckedArr([]);
    }
  };

  const handleViewInvoice = async (
    id: string,
    status: string | number,
    invoiceCompanyId: string,
  ) => {
    try {
      const invoicePay =
        Number(invoiceCompanyId) === Number(currentCompanyId)
          ? invoicePayPermission
          : invoiceSubPayPermission;
      setIsRequestLoading(true);
      const isPayNow = purchasabilityPermission && invoicePay && status !== 2;
      const pdfUrl = await handlePrintPDF(id, isPayNow);

      if (!pdfUrl) {
        snackbar.error(b3Lang('invoice.pdfUrlResolutionError'));
        return;
      }

      const { href } = window.location;
      if (!href.includes('invoice')) {
        return;
      }

      window.open(pdfUrl, '_blank', 'fullscreen=yes');
    } catch (err) {
      b2bLogger.error(err);
    } finally {
      setIsRequestLoading(false);
    }
  };

  

  useEffect(() => {
    const newInitFilter = {
      ...initFilter,
      companyIds: [Number(selectCompanyHierarchyId) || Number(currentCompanyId)],
    };
    if (location?.search) {
      const params = new URLSearchParams(location.search);
      const getInvoiceId = params.get('invoiceId') || '';
      const getReceiptId = params.get('receiptId') || '';

      if (getInvoiceId) {
        setFilterData({
          ...newInitFilter,
          q: getInvoiceId,
        });
        setType(InvoiceListType.DETAIL);
      }

      if (getReceiptId) {
        // open Successful page
        setType(InvoiceListType.CHECKOUT);
        setFilterData({
          ...newInitFilter,
        });
        setReceiptId(getReceiptId);
      }
    } else {
      setType(InvoiceListType.NORMAL);
      setFilterData({
        ...newInitFilter,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, selectCompanyHierarchyId]);

  const handleSelectCompanies = (company: number[]) => {
    const newCompanyIds = company.includes(-1) ? [] : company;
    setFilterData({
      ...filterData,
      companyIds: newCompanyIds,
    });

    setSelectAllPay(
      company.includes(currentCompanyId) || company.includes(-1)
        ? invoicePayPermission
        : invoiceSubPayPermission,
    );
  };

  useEffect(() => {
    const selectedInvoice =
      checkedArr.filter((item: InvoiceListNode) => {
        const {
          node: { openBalance },
        } = item;

        return Number(openBalance.value) !== 0;
      }) || [];

    if (selectedInvoice.length > 0) {
      if (selectedPay.length === 0) {
        setSelectedPay(cloneDeep(selectedInvoice));
      } else {
        const newArr = selectedInvoice.map((checkedItem: InvoiceListNode) => {
          const {
            node: { id, openBalance },
          } = checkedItem;

          const currentSelectedItem = selectedPay.find((item: InvoiceListNode) => {
            const {
              node: { id: selectedId },
            } = item;

            return Number(id) === Number(selectedId);
          });

          if (currentSelectedItem) {
            const {
              node: { openBalance: currentOpenBalance },
            } = currentSelectedItem;

            openBalance.value = currentOpenBalance.value;
          }

          return checkedItem;
        });

        setSelectedPay(cloneDeep(newArr));
      }
    } else {
      setSelectedPay([]);
    }
    // ignore selectedPay cause it will trigger an useEffect loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedArr]);

  const fetchList: GetRequestList<Partial<FilterSearchProps>, InvoiceList> = async (params) => {
    const {
      invoices: { edges, totalCount },
    } = await getInvoiceList(params);

    const invoicesList: InvoiceListNode[] = edges;

    if (type === InvoiceListType.DETAIL && invoicesList.length) {
      invoicesList.forEach((invoice: InvoiceListNode) => {
        const item = invoice;
        item.node.isCollapse = true;
      });
    }

    invoicesList.forEach((invoiceNode: InvoiceListNode) => {
      const {
        node: { openBalance },
      } = invoiceNode;
      const item = invoiceNode;
      item.node.disableCurrentCheckbox = false;

      openBalance.originValue = `${Number(openBalance.value)}`;
      openBalance.value = formattingNumericValues(Number(openBalance.value), decimalPlaces);

      item.node.disableCurrentCheckbox = Number(openBalance.value) === 0;

      const { companyInfo } = item.node;
      if (Number(companyInfo.companyId) !== Number(currentCompanyId)) {
        item.node.disableCurrentCheckbox =
          !invoiceSubPayPermission || Number(openBalance.value) === 0;
      }
    });
    setList(invoicesList);
    handleStatisticsInvoiceAmount();

    if (filterData && isFiltering(filterData) && invoicesList.length) {
      cacheFilterLists(invoicesList);
    } else {
      setFilterLists([]);
    }

    return {
      edges: invoicesList,
      totalCount,
    };
  };

  const columnAllItems: TableColumnItem<InvoiceList>[] = [
    {
      key: 'invoiceNumber',
      title: b3Lang('invoice.headers.invoiceNumber'),
      isSortable: true,
      render: (item: InvoiceList) => (
        <Box
          sx={{
            color: '#000000',
            cursor: 'pointer',
            ':hover': {
              textDecoration: 'underline',
            },
          }}
          role="button"
          onClick={() => {
            const companyInfo = item?.companyInfo || {};
            handleViewInvoice(item.id, item.status, companyInfo?.companyId);
          }}
        >
          {item?.invoiceNumber ? item.invoiceNumber : item?.id}
        </Box>
      ),
      width: '12%',
    },
    {
      key: 'orderNumber',
      title: b3Lang('invoice.headers.order'),
      isSortable: true,
      render: (item: InvoiceList) => (
        <Box
          role="button"
          sx={{
            color: '#000000',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() => {
            navigate(`/orderDetail/${item.orderNumber}`);
          }}
        >
          {item?.orderNumber || '-'}
        </Box>
      ),
      width: '12%',
    },
    {
      key: 'createdAt',
      title: b3Lang('invoice.headers.quoteDate'),
      isSortable: true,
      render: (item: InvoiceList) =>
        `${item.createdAt ? displayFormat(Number(item.createdAt)) : '–'}`,
      width: '14%',
    },
    {
      key: 'updatedAt',
      title: b3Lang('invoice.headers.expirationDate'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { dueDate, status } = item;
        const isOverdue = currentDate > dueDate * 1000 && status !== 2;

        return (
          <Typography
            sx={{
              color: isOverdue ? '#D32F2F' : 'rgba(0, 0, 0, 0.87)',
              fontSize: '14px',
            }}
          >
            {`${item.dueDate ? displayFormat(Number(item.dueDate)) : '–'}`}
          </Typography>
        );
      },
      width: '14%',
    },
    {
      key: 'originalBalance',
      title: b3Lang('invoice.headers.total'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { originalBalance } = item;
        const originalAmount = formattingNumericValues(
          Number(originalBalance.value),
          decimalPlaces,
        );

        const token = handleGetCorrespondingCurrencyToken(originalBalance.code);

        return `${token}${originalAmount || 0}`;
      },
      width: '12%',
    },
    {
      key: 'openBalance',
      title: b3Lang('invoice.headers.debtAmount'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { openBalance } = item;

        const openAmount = formattingNumericValues(Number(openBalance.value), decimalPlaces);
        const token = handleGetCorrespondingCurrencyToken(openBalance.code);

        return `${token}${openAmount || 0}`;
      },
      width: '12%',
    },
    {
      key: 'currency',
      title: b3Lang('invoice.headers.currency'),
      render: (item: InvoiceList) => {
        const { openBalance, originalBalance } = item;

        return openBalance?.code || originalBalance?.code || '-';
      },
      width: '8%',
    },
    {
      key: 'status',
      title: b3Lang('invoice.headers.status'),
      isSortable: true,
      render: (item: InvoiceList) => {
        const { status, dueDate } = item;
        let code = item.status;

        if (status === 0 && currentDate > dueDate * 1000) {
          code = 3;
        }

        return <InvoiceStatus code={code} />;
      },
      width: '8%',
    },
    {
      key: 'invoiceActions',
      title: b3Lang('invoice.headers.action'),
      render: (row: InvoiceList) => {
        const { id, companyInfo } = row;
        let actionRow = row;
        if (selectedPay.length > 0) {
          const currentSelected = selectedPay.find((item: InvoiceListNode) => {
            const {
              node: { id: selectedId },
            } = item;

            return Number(selectedId) === Number(id);
          });

          if (currentSelected) {
            actionRow = currentSelected.node;
          }
        }

        return (
          <B3Pulldown
            row={actionRow}
            setInvoiceId={setCurrentInvoiceId}
            handleOpenHistoryModal={setIsOpenHistory}
            setIsRequestLoading={setIsRequestLoading}
            isCurrentCompany={Number(currentCompanyId) === Number(companyInfo.companyId)}
            invoicePay={
              Number(currentCompanyId) === Number(companyInfo.companyId)
                ? invoicePayPermission
                : invoiceSubPayPermission
            }
          />
        );
      },
      width: '10%',
    },
  ];

  const translatedFilterFormConfigs = filterFormConfig.map((element) => {
    const config = element;
    if (element.name === 'status') {
      config.label = b3Lang(filterFormConfigsTranslationVariables.status);
    }

    config.options = element.options.map((option) => {
      const elementOption = option;
      elementOption.label = b3Lang(filterFormConfigsTranslationVariables[option.key]);

      return option;
    });

    return element;
  });

  return (
    <B3Spin isSpinning={isRequestLoading}>
      <Box
        sx={{
          overflowX: 'auto',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto',

              '& > div': {
                width: isMobile ? '100%' : 'auto',
              },
            }}
          >
            {isEnabledCompanyHierarchy && invoiceSubViewPermission && (
              <Box
                sx={{
                  mr: isMobile ? 0 : '10px',
                  mb: '30px',
                }}
              >
                <B2BAutoCompleteCheckbox handleChangeCompanyIds={handleSelectCompanies} />
              </Box>
            )}
            <B3Filter
              filterMoreInfo={translatedFilterFormConfigs}
              handleChange={handleChange}
              handleFilterChange={handleFilterChange}
              startPicker={{
                isEnabled: true,
                label: b3Lang('invoice.filter.from'),
                defaultValue:
                  typeof filterData?.beginDateAt === 'number'
                    ? Number(filterData.beginDateAt) * 1000
                    : '',
                pickerKey: 'start',
              }}
              endPicker={{
                isEnabled: true,
                label: b3Lang('invoice.filter.to'),
                defaultValue:
                  typeof filterData?.endDateAt === 'number'
                    ? Number(filterData.endDateAt) * 1000
                    : '',
                pickerKey: 'end',
              }}
              searchValue={filterData?.q || ''}
              pcContainerWidth="36rem"
              pcSearchContainerWidth="80%"
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              marginBottom: '30px',
              flexDirection: document.body.clientWidth <= 465 ? 'column' : 'row',
            }}
          >
            <Typography
              sx={{
                fontSize: '24px',
                color: '#000000',
              }}
            >
              {b3Lang('invoice.openUnpaid', {
                unpaid: currencyFormat(unpaidAmount),
              })}
            </Typography>
            {document.body.clientWidth >= 465 && (
              <Typography
                sx={{
                  fontSize: '24px',
                  margin: '0 8px',
                }}
              >
                |
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: '24px',
                color: '#D32F2F',
              }}
            >
              {b3Lang('invoice.overdueAmount', {
                overdue: currencyFormat(overdueAmount),
              })}
            </Typography>
          </Box>
        </Box>
        <Box sx={invoiceTableStyles}>
          <B3PaginationTable
            ref={paginationTableRef}
            columnItems={columnAllItems}
            rowsPerPageOptions={[10, 20, 30]}
            getRequestList={fetchList}
            searchParams={filterData}
            isCustomRender={false}
            requestLoading={setIsRequestLoading}
            tableKey="id"
            showCheckbox={selectAllPay && purchasabilityPermission}
            showSelectAllCheckbox={!isMobile && selectAllPay && purchasabilityPermission}
            disableCheckbox={false}
            applyAllDisableCheckbox={false}
            getSelectCheckbox={getSelectCheckbox}
            CollapseComponent={PrintTemplate}
            sortDirection={order}
            orderBy={orderBy}
            sortByFn={handleSetOrderBy}
            isSelectOtherPageCheckbox
            hover
            isAutoRefresh={false}
            renderItem={(row, index, checkBox) => (
              <InvoiceItemCard
                item={row}
                checkBox={checkBox}
                handleViewInvoice={handleViewInvoice}
                setIsRequestLoading={setIsRequestLoading}
                setInvoiceId={setCurrentInvoiceId}
                handleOpenHistoryModal={setIsOpenHistory}
                selectedPay={selectedPay}
                addBottom={list.length - 1 === index}
                isCurrentCompany={Number(currentCompanyId) === Number(row.companyInfo.companyId)}
                invoicePay={
                  Number(currentCompanyId) === Number(row.companyInfo.companyId)
                    ? invoicePayPermission
                    : invoiceSubPayPermission
                }
              />
            )}
          />
        </Box>
      </Box>
      {selectedPay.length > 0 &&
        (((invoicePayPermission || invoiceSubPayPermission) && purchasabilityPermission) ||
          isAgenting) && <InvoiceFooter selectedPay={selectedPay} decimalPlaces={decimalPlaces} />}
      <PaymentsHistory
        open={isOpenHistory}
        currentInvoiceId={currentInvoiceId}
        setOpen={setIsOpenHistory}
      />
      <PaymentSuccess receiptId={Number(receiptId)} type={type} />
    </B3Spin>
  );
}

export default Invoice;
