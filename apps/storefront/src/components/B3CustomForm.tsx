import { Grid } from '@mui/material';
import type { GridProps } from '@mui/material/Grid';

import B3UI from './form/ui';
import {
  B2BControlMultiTextField,
  B3ControlAutocomplete,
  B3ControlCheckbox,
  B3ControlFileUpload,
  B3ControlPicker,
  B3ControlProductRadio,
  B3ControlRadioGroup,
  B3ControlRectangle,
  B3ControlSelect,
  B3ControlSwatchRadio,
  B3ControlTextField,
} from './form';

export default function B3CustomForm(props: B3UI.B3CustomFormProps) {
  const {
    formFields,
    errors,
    control,
    getValues,
    setValue,
    setError,
    containerProps,
    ...restProps
  } = props;

  const {
    spacing: gridSpacing,
    rowSpacing,
    columnSpacing,
    ...restContainerProps
  } = (containerProps || {}) as GridProps;

  const spacingProps: Partial<GridProps> = {};

  if (rowSpacing !== undefined) {
    spacingProps.rowSpacing = rowSpacing;
  }

  if (columnSpacing !== undefined) {
    spacingProps.columnSpacing = columnSpacing;
  }

  if (gridSpacing !== undefined || (rowSpacing === undefined && columnSpacing === undefined)) {
    spacingProps.spacing = gridSpacing ?? 2;
  }

  const renderFormFields = (fields: any) =>
    fields.map((field: B3UI.B3CustomFormValue) => {
      const { fieldType } = field;
      return (
        <Grid item key={field.name} xs={field.xs || 6} id="b3-customForm-id-name">
          <>
            {['text', 'number', 'password', 'multiline'].includes(fieldType) && (
              <B3ControlTextField {...field} {...restProps} errors={errors} control={control} />
            )}
            {['checkbox'].includes(fieldType) && (
              <B3ControlCheckbox
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                getValues={getValues}
              />
            )}
            {['radio'].includes(fieldType) && (
              <B3ControlRadioGroup {...field} {...restProps} errors={errors} control={control} />
            )}
            {['dropdown'].includes(fieldType) && (
              <B3ControlSelect
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}
            {['date'].includes(fieldType) && (
              <B3ControlPicker
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )}
            {['files'].includes(fieldType) && (
              <B3ControlFileUpload
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                setValue={setValue}
                setError={setError}
              />
            )}
            {['rectangle'].includes(fieldType) && (
              <B3ControlRectangle
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}
            {['productRadio'].includes(fieldType) && (
              <B3ControlProductRadio
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}
            {['swatch'].includes(fieldType) && (
              <B3ControlSwatchRadio
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}
            {['roleAutocomplete'].includes(fieldType) && (
              <B3ControlAutocomplete
                {...field}
                {...restProps}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )}
            {['multiInputText'].includes(fieldType) && (
              <B2BControlMultiTextField
                {...restProps}
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                setError={setError}
                getValues={getValues}
              />
            )}
          </>
        </Grid>
      );
    });

  return (
    <Grid container {...spacingProps} {...restContainerProps}>
      {formFields && renderFormFields(formFields)}
    </Grid>
  );
}
