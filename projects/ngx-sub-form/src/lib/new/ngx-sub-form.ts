import { ɵmarkDirty as markDirty } from '@angular/core';
import { EMPTY, forkJoin, Observable } from 'rxjs';
import { delay, map, mapTo, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { isNullOrUndefined } from '../ngx-sub-form-utils';
import {
  createFormDataFromOptions,
  getControlValueAccessorBindings,
  getFormGroupErrors,
  handleFArray as handleFormArrays,
  patchClassInstance,
} from './helpers';
import {
  ControlValueAccessorComponentInstance,
  FormBindings,
  FormType,
  NgxFormOptions,
  NgxRootForm,
  NgxRootFormOptions,
  NgxSubForm,
  NgxSubFormArrayOptions,
  NgxSubFormOptions,
  NgxSubFormRemapOptions,
} from './ngx-sub-form.types';

const optionsHasInstructionsToCreateArrays = <ControlInterface, FormInterface>(
  a: NgxSubFormOptions<ControlInterface, FormInterface>,
): a is NgxSubFormOptions<ControlInterface, FormInterface> & NgxSubFormArrayOptions<FormInterface> => true;

const isRemap = <ControlInterface, FormInterface>(
  options: any,
): options is NgxSubFormRemapOptions<ControlInterface, FormInterface> => {
  const opt = options as NgxSubFormRemapOptions<ControlInterface, FormInterface>;
  return !!opt.fromFormGroup && !!opt.toFormGroup;
};

export function createForm<ControlInterface, FormInterface = ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  formType: FormType.ROOT,
  options: NgxRootFormOptions<ControlInterface, FormInterface>,
): NgxRootForm<FormInterface>;
export function createForm<ControlInterface, FormInterface = ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  formType: FormType.SUB,
  options: NgxSubFormOptions<ControlInterface, FormInterface>,
): NgxSubForm<FormInterface>;
export function createForm<ControlInterface, FormInterface = ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
  formType: FormType,
  options: NgxFormOptions<ControlInterface, FormInterface>,
): NgxSubForm<FormInterface> {
  const mergedOptions: NgxFormOptions<ControlInterface, FormInterface> = {
    // the following 2 `as any` are required as for example with the `fromFormGroup`
    // we expect `FormInterface --> ControlInterface` but when doing `fromFormGroup: v => v`
    // the type is `FormInterface --> FormInterface` and we'd get an error (hence the cast)
    // in the first place, we need to provide those 2 functions as if we're not into a remap
    // form we need to declare those 2 functions (to return the same value only)
    fromFormGroup: v => v,
    toFormGroup: v => v,
    ...options,
  };

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

  // const { writeValue$, registerOnChange$, registerOnTouched$, setDisabledState$ } = getControlValueAccessorBindings<
  const componentHooks = getControlValueAccessorBindings<ControlInterface>(componentInstance);

  const writeValue$: FormBindings<ControlInterface>['writeValue$'] =
    formType === FormType.SUB
      ? componentHooks.writeValue$
      : (options as NgxRootFormOptions<ControlInterface, FormInterface>).input$;

  const registerOnChange$: FormBindings<ControlInterface>['registerOnChange$'] =
    formType === FormType.SUB
      ? componentHooks.registerOnChange$
      : // @todo
        (null as any);

  const setDisabledState$: FormBindings<ControlInterface>['setDisabledState$'] =
    formType === FormType.SUB
      ? componentHooks.setDisabledState$
      : (options as NgxRootFormOptions<ControlInterface, FormInterface>).disabled$;

  const transformedValue$: Observable<FormInterface> = writeValue$.pipe(
    map(value => {
      if (isNullOrUndefined(value)) {
        return defaultValues;
      }

      if (isRemap<ControlInterface, FormInterface>(options)) {
        return options.toFormGroup(value);
      }

      // if it's not a remap component, the ControlInterface === the FormInterface
      return (value as any) as FormInterface;
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  const broadcastValueToParent$: Observable<ControlInterface> = transformedValue$.pipe(
    switchMap(() => formGroup.valueChanges.pipe(delay(0))),
    map(value =>
      isRemap<ControlInterface, FormInterface>(options)
        ? options.fromFormGroup(value)
        : // if it's not a remap component, the ControlInterface === the FormInterface
          ((value as any) as ControlInterface),
    ),
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
          optionsHasInstructionsToCreateArrays<ControlInterface, FormInterface>(options)
            ? options.createFormArrayControl
            : null,
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
