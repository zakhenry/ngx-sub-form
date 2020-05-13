import { ControlValueAccessor } from '@angular/forms';
import { ControlValueAccessorComponentInstance, NgxSubForm } from './helpers';
import { createRemapSubForm, createSubForm, NgxSubFormOptions } from './ngx-sub-form';

export interface NgxRootForm<FormInterface> extends NgxSubForm<FormInterface> {}

export type NgxRootFormOptions<FormInterface> = NgxSubFormOptions<FormInterface> & {
  // todo
};

export type NgxRootFormRemapOptions<ControlInterface, FormInterface> = NgxRootFormOptions<FormInterface> & {
  toFormGroup: (obj: ControlInterface) => FormInterface;
  fromFormGroup: (formValue: FormInterface) => ControlInterface;
};

const isRemap = <ControlInterface, FormInterface>(
  options: any,
): options is NgxRootFormRemapOptions<ControlInterface, FormInterface> => {
  return true;
};

const controlValueAccessorMap: Record<keyof ControlValueAccessor, true> = {
  writeValue: true,
  registerOnChange: true,
  registerOnTouched: true,
  setDisabledState: true,
};

const controlValueAccessorKeys: (keyof Required<ControlValueAccessor>)[] = Object.keys(
  controlValueAccessorMap,
) as (keyof Required<ControlValueAccessor>)[];

const componentImplementsControlValueAccessor = (
  componentInstance: any,
): componentInstance is Required<ControlValueAccessor> => {
  return controlValueAccessorKeys.every(key => !!componentInstance[key]);
};

export function createRootForm<ControlInterface, FormInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxRootFormRemapOptions<ControlInterface, FormInterface>,
): NgxRootForm<FormInterface>;
export function createRootForm<ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxRootFormOptions<ControlInterface>,
): NgxRootForm<ControlInterface>;
export function createRootForm<ControlInterface, FormInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxRootFormOptions<ControlInterface> | NgxRootFormRemapOptions<ControlInterface, FormInterface>,
): any {
  const subForm = (() => {
    if (isRemap<ControlInterface, FormInterface>(options)) {
      return createRemapSubForm<ControlInterface, FormInterface>(componentInstance, options);
    } else {
      options;
      return (createSubForm<ControlInterface>(componentInstance, options) as any) as NgxSubForm<FormInterface>;
    }
  })();

  if (!componentImplementsControlValueAccessor(componentInstance)) {
    throw new Error(`[RootForm] the internal sub form is not implementing correctly ControlValueAccessor`);
  }

  componentInstance.writeValue();

  return null as any;
}

// interface A {
//   propA: number;
// }
// interface B {
//   propB: number;
// }

// const a = createRootForm<A>({}, { componentHooks: null as any, formControls: null as any });
// a.formGroup.value.
