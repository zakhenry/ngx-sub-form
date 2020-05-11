import { ɵmarkDirty as markDirty } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EMPTY, forkJoin, Observable } from 'rxjs';
import { delay, map, mapTo, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ArrayPropertyKey, ArrayPropertyValue, Controls, isNullOrUndefined } from '../ngx-sub-form-utils';
import { FormGroupOptions } from '../ngx-sub-form.types';
import {
  ComponentHooks,
  ControlValueAccessorComponentInstance,
  createFormDataFromOptions,
  getControlValueAccessorBindings,
  getFormGroupErrors,
  handleFArray as handleFormArrays,
  NgxSubForm,
  patchClassInstance,
} from './helpers';

export interface NgxSubFormWithArrayOptions<FormInterface> {
  createFormArrayControl?: (
    key: ArrayPropertyKey<FormInterface>,
    value: ArrayPropertyValue<FormInterface>,
  ) => FormControl;
}

export type NgxSubFormOptions<FormInterface> = {
  formControls: Controls<FormInterface>;
  formGroupOptions?: FormGroupOptions<FormInterface>;
  emitNullOnDestroy?: boolean;
  componentHooks: ComponentHooks;
} & (ArrayPropertyKey<FormInterface> extends never
  ? {} // no point defining `createFormArrayControl` if there's // not a single array in the `FormInterface`
  : NgxSubFormWithArrayOptions<FormInterface>);

const optionsHasInstructionsToCreateArrays = <ControlInterface, FormInterface>(
  a: NgxSubFormRemapOptions<ControlInterface, FormInterface>,
): a is NgxSubFormRemapOptions<ControlInterface, FormInterface> & NgxSubFormWithArrayOptions<FormInterface> => true;

export type NgxSubFormRemapOptions<ControlInterface, FormInterface> = NgxSubFormOptions<FormInterface> & {
  toFormGroup: (obj: ControlInterface) => FormInterface;
  fromFormGroup: (formValue: FormInterface) => ControlInterface;
};

export function createRemapSubForm<ControlInterface, FormInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxSubFormRemapOptions<ControlInterface, FormInterface>,
): NgxSubForm<FormInterface> {
  const { formGroup, defaultValues, formControlNames, formArrays } = createFormDataFromOptions<
    ControlInterface,
    FormInterface
  >(options);

  // this doesn't work for now see issue on the function
  // as a hack I'm asking to get within options an observable for some hooks...
  // const { ngOnDestroy$ } = getComponentHooks(componentInstance);

  // define the `validate` method to improve errors
  // and support nested errors
  patchClassInstance(componentInstance, {
    validate: () => {
      if (formGroup.valid) {
        return null;
      }

      return getFormGroupErrors<ControlInterface, FormInterface>(formGroup);
    },
  });

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

  const emitNullOnDestroy$: Observable<null> =
    // emit null when destroyed by default
    isNullOrUndefined(options.emitNullOnDestroy) || options.emitNullOnDestroy
      ? // ngOnDestroy$.pipe(mapTo(null))
        options.componentHooks.ngOnDestroy$.pipe(mapTo(null))
      : EMPTY;

  const sideEffects = {
    broadcastValueToParent$: registerOnChange$.pipe(
      switchMap(onChange => broadcastValueToParent$.pipe(tap(value => onChange(value)))),
    ),
    applyUpstreamUpdateOnLocalForm$: transformedValue$.pipe(
      tap(value => {
        handleFormArrays<FormInterface>(
          formArrays,
          value,
          optionsHasInstructionsToCreateArrays(options) ? options.createFormArrayControl : null,
        );

        formGroup.reset(value);

        // support `changeDetection: ChangeDetectionStrategy.OnPush`
        // on the component hosting a form
        markDirty(componentInstance);
      }),
    ),
    setDisabledState$: setDisabledState$.pipe(
      tap((shouldDisable: boolean) => {
        shouldDisable ? formGroup.disable() : formGroup.enable();
      }),
    ),
  };

  forkJoin(sideEffects)
    .pipe(takeUntil(options.componentHooks.ngOnDestroy$))
    .subscribe();

  // following cannot be part of `forkJoin(sideEffects)`
  // because it uses `takeUntilDestroyed` which destroys
  // the subscription when the component is being destroyed
  // and therefore prevents the emit of the null value if needed
  registerOnChange$
    .pipe(
      switchMap(onChange => emitNullOnDestroy$.pipe(tap(value => onChange(value)))),
      takeUntil(options.componentHooks.ngOnDestroy$.pipe(delay(0))),
      // takeUntil(ngOnDestroy$.pipe(delay(0))),
    )
    .subscribe();

  return {
    formGroup,
    formControlNames,
    get formGroupErrors() {
      return getFormGroupErrors<ControlInterface, FormInterface>(formGroup);
    },
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
