import { useContext, useEffect, useMemo } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { Badge, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { DynamicallyVariableContext } from '@/shared/dynamicallyVariable';
import { GlobalContext } from '@/shared/global';
import { type RouteItem } from '@/shared/routeList';
import { getAllowedRoutes } from '@/shared/routes';
import { store, useAppSelector } from '@/store';
import {
  setCompanyHierarchyInfoModules,
  setPagesSubsidiariesPermission,
} from '@/store/slices/company';
import { PagesSubsidiariesPermissionProps } from '@/types';
import { B3SStorage } from '@/utils';
import { validatePermissionWithComparisonType } from '@/utils/b3CheckPermissions';

interface B3NavProps {
  closeSidebar?: (x: boolean) => void;
}

const getSubsidiariesPermission = (routes: RouteItem[]) => {
  const subsidiariesPermission = routes.reduce((all, cur) => {
    if (cur?.subsidiariesCompanyKey) {
      const code = cur.permissionCodes?.includes(',')
        ? cur.permissionCodes.split(',')[0].trim()
        : cur.permissionCodes;

      all[cur.subsidiariesCompanyKey] = validatePermissionWithComparisonType({
        level: 3,
        code,
      });
    }

    return all;
  }, {} as PagesSubsidiariesPermissionProps);

  return subsidiariesPermission;
};

export default function B3Nav({ closeSidebar }: B3NavProps) {
  const [isMobile] = useMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const b3Lang = useB3Lang();

  const { dispatch } = useContext(DynamicallyVariableContext);
  const role = useAppSelector(({ company }) => company.customer.role);

  const { selectCompanyHierarchyId, isEnabledCompanyHierarchy } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const { permissions } = useAppSelector(({ company }) => company);

  const { state: globalState } = useContext(GlobalContext);
  const { quoteDetailHasNewMessages, registerEnabled } = globalState;

  const jumpRegister = () => {
    navigate('/register');
    dispatch({
      type: 'common',
      payload: {
        globalMessageDialog: {
          open: false,
          title: '',
          message: '',
          cancelText: 'Cancel',
        },
      },
    });
  };

  const handleClick = (item: { configKey?: string; path: string }) => {
    if (role === 100) {
      dispatch({
        type: 'common',
        payload: {
          globalMessageDialog: {
            open: true,
            title: 'Registration',
            message:
              item.configKey === 'shoppingLists'
                ? 'Please create an account, or login to create a shopping list.'
                : 'To receive full access to buyer portal, please register. It will take 2 minutes.',
            cancelText: 'Cancel',
            saveText: registerEnabled ? 'Register' : '',
            saveFn: jumpRegister,
          },
        },
      });

      return;
    }

    navigate(item.path);
    if (isMobile && closeSidebar) {
      closeSidebar(false);
    }
  };

  useEffect(() => {
    let isHasSubsidiariesCompanyPermission = false;
    const { hash } = window.location;
    const url = hash.split('#')[1] || '';
    const routes = getAllowedRoutes(globalState).filter((route) => route.isMenuItem);

    if (url) {
      const routeItem = getAllowedRoutes(globalState).find((item) => {
        return matchPath(item.path, url);
      });

      if (routeItem && routeItem?.subsidiariesCompanyKey) {
        const { permissionCodes } = routeItem;

        const code = permissionCodes?.includes(',')
          ? permissionCodes.split(',')[0].trim()
          : permissionCodes;

        isHasSubsidiariesCompanyPermission = validatePermissionWithComparisonType({
          code,
          level: 3,
        });
      }
    }

    const subsidiariesPermission = getSubsidiariesPermission(routes);

    store.dispatch(setPagesSubsidiariesPermission(subsidiariesPermission));

    store.dispatch(
      setCompanyHierarchyInfoModules({
        isHasCurrentPagePermission: isHasSubsidiariesCompanyPermission,
      }),
    );
  }, [selectCompanyHierarchyId, globalState, navigate]);

  const newRoutes = useMemo(() => {
    let routes = getAllowedRoutes(globalState).filter((route) => route.isMenuItem);

    const subsidiariesPermission = getSubsidiariesPermission(routes);

    if (selectCompanyHierarchyId) {
      routes = routes.filter((route) =>
        route?.subsidiariesCompanyKey
          ? subsidiariesPermission[route.subsidiariesCompanyKey]
          : false,
      );
    } else {
      routes = routes.filter((route) => {
        if (route?.subsidiariesCompanyKey === 'companyHierarchy') {
          return isEnabledCompanyHierarchy && subsidiariesPermission[route.subsidiariesCompanyKey];
        }
        return true;
      });
    }

    return routes;

    // ignore permissions because verifyCompanyLevelPermissionByCode method with permissions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectCompanyHierarchyId, permissions, globalState, isEnabledCompanyHierarchy]);

  const activePath = (path: string) => {
    if (location.pathname === path) {
      B3SStorage.set('prevPath', path);
      return true;
    }

    if (location.pathname.includes('orderDetail')) {
      const gotoOrderPath =
        B3SStorage.get('prevPath') === '/company-orders' ? '/company-orders' : '/orders';
      if (path === gotoOrderPath) return true;
    }

    if (location.pathname.includes('shoppingList') && path === '/shoppingLists') {
      return true;
    }

    if (location.pathname.includes('/quoteDetail') || location.pathname.includes('/quoteDraft')) {
      if (path === '/quotes') return true;
    }

    return false;
  };

  const optionWidth = isMobile ? '100%' : '214px';

  const listItemButtonSx = {
    height: '50px',
    width: optionWidth,
    bgcolor: '#F7F7F7',
    color: '#0067A0',
    borderRadius: 0,
    justifyContent: 'flex-start',
    px: '16px',
    '&.Mui-selected': {
      bgcolor: '#0067A0',
      color: '#F7F7F7',
    },
    '&:hover': {
      bgcolor: '#F7F7F7',
    },
    '&.Mui-selected:hover': {
      bgcolor: '#0067A0',
    },
  } as const;

  const listItemTextProps = {
    primaryTypographyProps: {
      sx: {
        fontFamily: 'Lato, sans-serif',
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: '24px',
        color: 'inherit',
      },
    },
  } as const;

  return (
    <List
      disablePadding
      sx={{
        width: optionWidth,
        maxWidth: optionWidth,
        bgcolor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {newRoutes.map((item) => {
        if (item.name === 'Quotes') {
          const { pathname } = location;
          return (
            <ListItem key={item.path} disablePadding sx={{ width: '100%' }}>
              <Badge
                badgeContent={
                  quoteDetailHasNewMessages && pathname.includes('quoteDetail') ? '' : 0
                }
                variant="dot"
                sx={{
                  width: '100%',
                  '& .MuiBadge-badge.MuiBadge-dot': {
                    width: 8,
                    height: 8,
                    bgcolor: '#0067A0',
                    right: 18,
                    top: 20,
                  },
                }}
              >
                <ListItemButton
                  sx={listItemButtonSx}
                  onClick={() => handleClick(item)}
                  selected={activePath(item.path)}
                >
                  <ListItemText primary={b3Lang(item.idLang)} {...listItemTextProps} />
                </ListItemButton>
              </Badge>
            </ListItem>
          );
        }
        return (
          <ListItem key={item.path} disablePadding sx={{ width: '100%' }}>
            <ListItemButton
              sx={listItemButtonSx}
              onClick={() => handleClick(item)}
              selected={activePath(item.path)}
            >
              <ListItemText primary={b3Lang(item.idLang)} {...listItemTextProps} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
