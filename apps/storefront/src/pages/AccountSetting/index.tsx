import { useContext, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import trim from 'lodash-es/trim';

import { B3CustomForm } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks';
import useStorageState from '@/hooks/useStorageState';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import {
  checkUserBCEmail,
  checkUserEmail,
  getB2BAccountFormFields,
  getB2BAccountSettings,
  getBCAccountSettings,
  updateB2BAccountSettings,
  updateBCAccountSettings,
} from '@/shared/service/b2b';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole, UserTypes } from '@/types';
import { Fields, ParamProps } from '@/types/accountSetting';
import { B3SStorage, channelId, platform, snackbar } from '@/utils';

import { deCodeField, getAccountFormFields } from '../Registered/config';

import { getAccountSettingsFields, getPasswordModifiedFields } from './config';
import { UpgradeBanner } from './UpgradeBanner';
import { b2bSubmitDataProcessing, bcSubmitDataProcessing, initB2BInfo, initBcInfo } from './utils';

type FieldInputProps = {
  sx?: SxProps<Theme>;
  [key: string]: unknown;
};

type FieldMuiTextFieldProps = {
  style?: CSSProperties;
  [key: string]: unknown;
};

type FieldLabelProps = {
  sx?: SxProps<Theme>;
  [key: string]: unknown;
};

type AccountFormField = Partial<Fields> & {
  sx?: SxProps<Theme>;
  InputProps?: FieldInputProps;
  muiTextFieldProps?: FieldMuiTextFieldProps;
  InputLabelProps?: FieldLabelProps;
  labelName?: string;
  labelSpacing?: string | number;
  labelSx?: SxProps<Theme>;
  labelColon?: boolean;
};

const appendSx = (
  existing: SxProps<Theme> | undefined,
  addition: SxProps<Theme>,
): SxProps<Theme> => {
  if (!existing) {
    return addition;
  }

  if (Array.isArray(existing)) {
    return [...existing, addition] as SxProps<Theme>;
  }

  return [existing, addition] as SxProps<Theme>;
};

function useData() {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customer = useAppSelector(({ company }) => company.customer);
  const role = useAppSelector(({ company }) => company.customer.role);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const companyId = role === 3 && isAgenting ? Number(salesRepCompanyId) : Number(companyInfoId);
  const isBCUser = !isB2BUser || (role === 3 && !isAgenting);
  const isDisplayUpgradeBanner =
    CustomerRole.B2C === customer.role &&
    [UserTypes.B2C, UserTypes.MULTIPLE_B2C].includes(customer.userType) &&
    platform === 'catalyst';

  const validateEmailValue = async (emailValue: string) => {
    if (customer.emailAddress === trim(emailValue)) return true;
    const payload = {
      email: emailValue,
      channelId,
    };

    const { isValid }: { isValid: boolean } = isBCUser
      ? await checkUserBCEmail(payload)
      : await checkUserEmail(payload);

    return isValid;
  };

  const emailValidation = (data: Partial<ParamProps>) => {
    if (data.email !== customer.emailAddress && !data.currentPassword) {
      return false;
    }

    return true;
  };

  const passwordValidation = (data: Partial<ParamProps>) => {
    if (data.password !== data.confirmPassword) {
      return false;
    }

    return true;
  };

  return {
    isBCUser,
    companyId,
    customer,
    validateEmailValue,
    emailValidation,
    passwordValidation,
    isDisplayUpgradeBanner,
  };
}

function AccountSetting() {
  const {
    isBCUser,
    companyId,
    customer,
    validateEmailValue,
    emailValidation,
    passwordValidation,
    isDisplayUpgradeBanner,
  } = useData();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
    setError,
  } = useForm({
    mode: 'onSubmit',
  });

  const [isFinishUpdate, setIsFinishUpdate] = useStorageState<boolean>(
    'sf-isFinishUpdate',
    false,
    sessionStorage,
  );

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const navigate = useNavigate();

  const [accountInfoFormFields, setAccountInfoFormFields] = useState<Partial<Fields>[]>([]);
  const [decryptionFields, setDecryptionFields] = useState<Partial<Fields>[]>([]);
  const [extraFields, setExtraFields] = useState<Partial<Fields>[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [accountSettings, setAccountSettings] = useState<any>({});
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const fn = isBCUser ? getBCAccountSettings : getB2BAccountSettings;

        const params = isBCUser
          ? {}
          : {
              companyId,
            };

        const key = isBCUser ? 'customerAccountSettings' : 'accountSettings';

        const accountFormAllFields = await getB2BAccountFormFields(isBCUser ? 1 : 2);
        const accountFormFields = getAccountFormFields(
          accountFormAllFields.accountFormFields || [],
        );

        const contactInformation = (accountFormFields?.contactInformation || []).filter(
          (item: Partial<Fields>) => item.fieldId !== 'field_email_marketing_newsletter',
        );

        const { additionalInformation = [] } = accountFormFields;

        const { [key]: accountSettings } = await fn(params);

        const fields = isBCUser
          ? initBcInfo(accountSettings, contactInformation, additionalInformation)
          : initB2BInfo(
              accountSettings,
              contactInformation,
              getAccountSettingsFields(),
              additionalInformation,
            );

        const passwordModifiedFields = getPasswordModifiedFields();

        const all = [...fields, ...passwordModifiedFields];

        const roleItem = all.find((item) => item.name === 'role');

        if (roleItem?.fieldType) roleItem.fieldType = 'text';

        setAccountInfoFormFields(all);

        setAccountSettings(accountSettings);

        setDecryptionFields(contactInformation);

        setExtraFields(additionalInformation);
      } finally {
        if (isFinishUpdate) {
          snackbar.success(b3Lang('accountSettings.notification.detailsUpdated'), {
            customType: 'account-settings-success',
          });
          setIsFinishUpdate(false);
        }
        setLoading(false);
        setIsVisible(true);
      }
    };

    init();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinishUpdate]);

  const handleGetUserExtraFields = (
    data: CustomFieldItems,
    accountInfoFields: Partial<Fields>[],
  ) => {
    const userExtraFields = accountInfoFields.filter(
      (item): item is Partial<Fields> & { name: string } =>
        Boolean(item.custom && item.groupId === 1 && item.name),
    );

    return userExtraFields.map((item) => ({
      fieldName: deCodeField(item.name),
      fieldValue: data[item.name],
    }));
  };

  const handleAddUserClick = () => {
    handleSubmit(async (data: CustomFieldItems) => {
      setLoading(true);

      try {
        const isValid = await validateEmailValue(data.email);

        if (!isValid) {
          setError('email', {
            type: 'custom',
            message: b3Lang('accountSettings.notification.emailExists'),
          });
        }

        const emailFlag = emailValidation(data);

        if (!emailFlag) {
          snackbar.error(b3Lang('accountSettings.notification.updateEmailPassword'));
        }

        const passwordFlag = passwordValidation(data);

        if (!passwordFlag) {
          setError('confirmPassword', {
            type: 'manual',
            message: b3Lang('global.registerComplete.passwordMatchPrompt'),
          });
          setError('password', {
            type: 'manual',
            message: b3Lang('global.registerComplete.passwordMatchPrompt'),
          });
        }

        if (isValid && emailFlag && passwordFlag) {
          const dataProcessingFn = isBCUser ? bcSubmitDataProcessing : b2bSubmitDataProcessing;
          const payload = dataProcessingFn(data, accountSettings, decryptionFields, extraFields);

          if (payload) {
            if (!isBCUser) {
              payload.companyId = companyId;
              payload.extraFields = handleGetUserExtraFields(data, accountInfoFormFields);
            }

            if (payload.newPassword === '' && payload.confirmPassword === '') {
              delete payload.newPassword;
              delete payload.confirmPassword;
            }
          }

          if (!payload) {
            snackbar.success(b3Lang('accountSettings.notification.noEdits'));
            return;
          }

          const requestFn = isBCUser ? updateBCAccountSettings : updateB2BAccountSettings;
          await requestFn(payload);

          if (
            (data.password && data.currentPassword) ||
            customer.emailAddress !== trim(data.email)
          ) {
            navigate('/login?loginFlag=loggedOutLogin');
          } else {
            B3SStorage.clear();
            setIsFinishUpdate(true);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  const translatedFields = useMemo(() => {
    const fieldTranslations: Record<string, string> = {
      field_first_name: b3Lang('accountSettings.form.firstName'),
      field_last_name: b3Lang('accountSettings.form.lastName'),
      field_email: b3Lang('accountSettings.form.email'),
      field_phone_number: b3Lang('accountSettings.form.phoneNumber'),
      field_company: b3Lang('accountSettings.form.company'),
      field_role: b3Lang('accountSettings.form.role'),
      field_current_password: b3Lang('accountSettings.form.currentPassword'),
      field_password: b3Lang('accountSettings.form.password'),
      field_confirm_password: b3Lang('accountSettings.form.confirmPassword'),
    };

    const accountFieldWidth = isMobile ? '100%' : '301px';

    const inputRootStyles: SxProps<Theme> = {
      width: accountFieldWidth,
      maxWidth: '100%',
      mb: '10px',
      '& .MuiInputBase-root': {
        width: '100%',
        height: '40px',
        borderRadius: '5px',
        border: '0.2px solid #575757',
        padding: '0 !important',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        fontFamily: "'Lato', sans-serif",
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: '24px',
        verticalAlign: 'middle',
        color: '#000000',
        boxSizing: 'border-box',
      },
      '& .MuiInputBase-root:before, & .MuiInputBase-root:after': {
        borderBottom: '0 !important',
      },
      '& .MuiInputBase-input': {
        padding: '10px',
        fontFamily: "'Lato', sans-serif",
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: '24px',
        verticalAlign: 'middle',
        color: '#000000',
        height: '100%',
        boxSizing: 'border-box',
      },
      '& .MuiInputBase-root:hover': {
        borderColor: '#575757',
        backgroundColor: '#FFFFFF',
      },
      '& .MuiInputBase-root.Mui-focused': {
        borderColor: '#575757',
        backgroundColor: '#FFFFFF',
      },
      '& .MuiInputBase-root.Mui-disabled': {
        borderColor: '#575757',
        backgroundColor: '#FFFFFF',
        color: '#000000',
      },
      '& .MuiInputBase-root.Mui-disabled .MuiInputBase-input': {
        color: '#000000',
        WebkitTextFillColor: '#000000',
      },
    };

    const labelStyles: SxProps<Theme> = {
      fontFamily: "'Lato', sans-serif",
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '24px',
      letterSpacing: 0,
      verticalAlign: 'middle',
      color: '#000000',
    };

    return accountInfoFormFields.map((item) => {
      const field = item as AccountFormField;
      const currentLabel = fieldTranslations[field.fieldId ?? ''] ?? field.label;

      const existingInputProps: FieldInputProps = field.InputProps ?? {};
      const existingMuiTextFieldProps: FieldMuiTextFieldProps = field.muiTextFieldProps ?? {};
      const existingTextFieldStyle = existingMuiTextFieldProps.style ?? {};

      const styledField: AccountFormField = {
        ...field,
        label: currentLabel,
        sx: appendSx(field.sx, inputRootStyles),
        InputProps: {
          ...existingInputProps,
          disableUnderline: true,
        },
        muiTextFieldProps: {
          ...existingMuiTextFieldProps,
          style: {
            ...existingTextFieldStyle,
            fontFamily: "'Lato', sans-serif",
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            verticalAlign: 'middle',
            color: '#000000',
            padding: '10px',
            height: '40px',
          },
        },
        labelName: currentLabel,
        labelSpacing: '10px',
        labelSx: labelStyles,
        labelColon: false,
      };

      return styledField;
    });
  }, [accountInfoFormFields, b3Lang, isMobile]);

  return (
    <B3Spin isSpinning={isLoading} background={backgroundColor}>
      <Box>
        {isDisplayUpgradeBanner && <UpgradeBanner />}
        <Box
          sx={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '301px',
            minHeight: isMobile ? '800px' : '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <B3CustomForm
            formFields={translatedFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />

          <CustomButton
            sx={{
              mt: '28px',
              mb: isMobile ? '20px' : '0',
              width: isMobile ? '100%' : '301px',
              maxWidth: '100%',
              height: '39px',
              borderRadius: '5px',
              padding: '10px',
              gap: '10px',
              fontFamily: "'Lato', sans-serif",
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: 0,
              textAlign: 'center',
              verticalAlign: 'middle',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              visibility: isVisible ? 'visible' : 'hidden',
            }}
            onClick={handleAddUserClick}
            variant="contained"
          >
            {b3Lang('accountSettings.button.saveUpdates')}
          </CustomButton>
        </Box>
      </Box>
    </B3Spin>
  );
}

export default AccountSetting;
