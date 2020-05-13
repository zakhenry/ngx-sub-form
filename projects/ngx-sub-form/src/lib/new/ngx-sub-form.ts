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

export type NgxSubFormOptions<ControlInterface> = {
  formControls: Controls<ControlInterface>;
  formGroupOptions?: FormGroupOptions<ControlInterface>;
  emitNullOnDestroy?: boolean;
  componentHooks: ComponentHooks;
} & (ArrayPropertyKey<ControlInterface> extends never
  ? {} // no point defining `createFormArrayControl` if there's // not a single array in the `ControlInterface`
  : NgxSubFormWithArrayOptions<ControlInterface>);

const optionsHasInstructionsToCreateArrays = <ControlInterface, FormInterface>(
  a: NgxSubFormRemapOptions<ControlInterface, FormInterface>,
): a is NgxSubFormRemapOptions<ControlInterface, FormInterface> & NgxSubFormWithArrayOptions<FormInterface> => true;

export type NgxSubFormRemapOptions<ControlInterface, FormInterface> = NgxSubFormOptions<FormInterface> & {
  toFormGroup: (obj: ControlInterface) => FormInterface;
  fromFormGroup: (formValue: FormInterface) => ControlInterface;
};

// not needed anymore
// const isRemap = <ControlInterface, FormInterface>(
//   options: any,
// ): options is NgxSubFormRemapOptions<ControlInterface, FormInterface> => {
//   return true;
// };

export function createSubForm<ControlInterface, FormInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxSubFormRemapOptions<ControlInterface, FormInterface>,
): NgxSubForm<FormInterface>;
export function createSubForm<ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxSubFormOptions<ControlInterface>,
): NgxSubForm<ControlInterface>;
export function createSubForm<ControlInterface, FormInterface = ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  options: NgxSubFormOptions<FormInterface> | NgxSubFormRemapOptions<ControlInterface, FormInterface>,
): NgxSubForm<FormInterface> {
  const mergedOptions: NgxSubFormRemapOptions<ControlInterface, FormInterface> = {
    // the following 2 `as any` are required as for example with the `fromFormGroup`
    // we expect `FormInterface --> ControlInterface` but when doing `fromFormGroup: v => v`
    // the type is `FormInterface --> FormInterface` and we'd get an error (hence the cast)
    // in the first place, we need to provide those 2 functions as if we're not into a remap
    // form we need to declare those 2 functions (to return the same value only)
    fromFormGroup: v => (v as any) as ControlInterface,
    toFormGroup: v => (v as any) as FormInterface,
    ...options,
  };

  const { formGroup, defaultValues, formControlNames, formArrays } = createFormDataFromOptions<FormInterface>(
    mergedOptions,
  );

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
    map(value => (isNullOrUndefined(value) ? defaultValues : mergedOptions.toFormGroup(value))),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  const broadcastValueToParent$: Observable<ControlInterface> = transformedValue$.pipe(
    switchMap(() => formGroup.valueChanges.pipe(delay(0))),
    map(value => mergedOptions.fromFormGroup(value)),
  );

  const emitNullOnDestroy$: Observable<null> =
    // emit null when destroyed by default
    isNullOrUndefined(mergedOptions.emitNullOnDestroy) || mergedOptions.emitNullOnDestroy
      ? // ngOnDestroy$.pipe(mapTo(null))
        mergedOptions.componentHooks.ngOnDestroy$.pipe(mapTo(null))
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
          optionsHasInstructionsToCreateArrays(mergedOptions) ? mergedOptions.createFormArrayControl : null,
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
    .pipe(takeUntil(mergedOptions.componentHooks.ngOnDestroy$))
    .subscribe();

  // following cannot be part of `forkJoin(sideEffects)`
  // because it uses `takeUntilDestroyed` which destroys
  // the subscription when the component is being destroyed
  // and therefore prevents the emit of the null value if needed
  registerOnChange$
    .pipe(
      switchMap(onChange => emitNullOnDestroy$.pipe(tap(value => onChange(value)))),
      takeUntil(mergedOptions.componentHooks.ngOnDestroy$.pipe(delay(0))),
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
