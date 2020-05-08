import { AbstractControlOptions, FormGroup } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { delay, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  Controls,
  ControlsNames,
  ControlsType,
  isNullOrUndefined,
  takeUntilDestroyed,
  TypedFormGroup,
} from '../ngx-sub-form-utils';
import { FormGroupOptions } from '../ngx-sub-form.types';
import {
  ControlValueAccessorComponentInstance,
  deepCopy,
  getControlValueAccessorBindings,
  NgxSubForm,
} from './helpers';

export interface NgxSubFormOptions<FormInterface> {
  formControls: Controls<FormInterface>;
  formGroupOptions?: FormGroupOptions<FormInterface>;
}

export interface NgxSubFormRemapOptions<ControlInterface, FormInterface> extends NgxSubFormOptions<FormInterface> {
  toFormGroup: (obj: ControlInterface) => FormInterface;
  fromFormGroup: (formValue: FormInterface) => ControlInterface;
}

export function createRemapSubForm<ControlInterface, FormInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxSubFormRemapOptions<ControlInterface, FormInterface>,
): NgxSubForm<FormInterface> {
  const formGroup: TypedFormGroup<FormInterface> = new FormGroup(
    options.formControls,
    options.formGroupOptions as AbstractControlOptions,
  ) as TypedFormGroup<FormInterface>;
  const defaultValues: FormInterface = deepCopy(formGroup.value);
  const formGroupKeys: (keyof FormInterface)[] = Object.keys(defaultValues) as (keyof FormInterface)[];
  const formControlNames: ControlsNames<FormInterface> = formGroupKeys.reduce<ControlsNames<FormInterface>>(
    (acc, curr) => {
      acc[curr] = curr;
      return acc;
    },
    {} as ControlsNames<FormInterface>,
  );

  const formControls: ControlsType<FormInterface> = formGroup.controls;

  const { writeValue$, registerOnChange$, registerOnTouched$, setDisabledState$ } = getControlValueAccessorBindings<
    ControlInterface
  >(componentInstance);

  const transformedValue$: Observable<FormInterface> = writeValue$.pipe(
    map(value => (isNullOrUndefined(value) ? defaultValues : options.toFormGroup(value))),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  const broadcastValueToParent$: Observable<ControlInterface> = transformedValue$.pipe(
    switchMap(() => formGroup.valueChanges.pipe(delay(0))),
    map(value => options.fromFormGroup(value)),
  );

  const sideEffects = {
    broadcastValueToParent$: registerOnChange$.pipe(
      switchMap(onChange => broadcastValueToParent$.pipe(tap(value => onChange(value)))),
    ),
    applyUpstreamUpdateOnLocalForm$: transformedValue$.pipe(tap(value => formGroup.reset(value))),
    setDisabledState$: setDisabledState$.pipe(
      tap((shouldDisable: boolean) => {
        shouldDisable ? formGroup.disable() : formGroup.enable();
      }),
    ),
  };

  forkJoin(sideEffects)
    .pipe(takeUntilDestroyed(componentInstance))
    .subscribe();

  // @todo
  // componentInstance.validate = () => {};

  return {
    formGroup,
    formControlNames,
    // get formGroupErrors() {
    //   let errorsCount: number = 0;
    //   const formErrors: FormErrors<ControlInterface> = Object.entries<OneOfControlsTypes>(formControls).reduce<
    //     Exclude<FormErrors<ControlInterface>, null>
    //   >((acc, [key, value]) => {
    //     if (value.errors) {
    //       // @todo remove any
    //       acc[key as keyof ControlInterface] = value.errors as any;
    //       errorsCount++;
    //     }
    //     return acc;
    //   }, {});

    //   if (!formGroup.errors && !errorsCount) {
    //     return null;
    //   }

    //   return Object.assign({}, formGroup.errors ? { formGroup: formGroup.errors } : {}, formErrors);
    // },
  };
}

export function createSubForm<ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxSubFormOptions<ControlInterface>,
): NgxSubForm<ControlInterface> {
  return createRemapSubForm<ControlInterface, ControlInterface>(componentInstance, {
    ...options,
    toFormGroup: val => val,
    fromFormGroup: val => val,
  });
}
