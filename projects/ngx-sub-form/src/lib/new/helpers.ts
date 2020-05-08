import { ControlValueAccessor, Validator } from '@angular/forms';
import { Observable, ReplaySubject } from 'rxjs';
import { ControlsNames, TypedFormGroup } from '../ngx-sub-form-utils';

export const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export type Nilable<T> = T | null | undefined;

export interface NgxSubForm<FormInterface> {
  readonly formGroup: TypedFormGroup<FormInterface>;
  readonly formControlNames: ControlsNames<FormInterface>;
  // readonly formGroupErrors: FormErrors<FormInterface>;
}

export type ControlValueAccessorComponentInstance = Object &
  // ControlValueAccessor methods are called
  // directly by Angular and expects a value
  // so we have to define it within ngx-sub-form
  // and this should *never* be overridden by the component
  Partial<Record<keyof ControlValueAccessor, never> & Record<keyof Validator, never>>;

const patchClassInstance = (componentInstance: any, obj: Object) => {
  Object.entries(obj).forEach(([key, newMethod]) => {
    componentInstance[key] = newMethod;
  });
};

export interface FormBindings<ControlInterface> {
  readonly writeValue$: Observable<Nilable<ControlInterface>>;
  readonly registerOnChange$: Observable<(formValue: ControlInterface) => void>;
  readonly registerOnTouched$: Observable<(_: any) => void>;
  readonly setDisabledState$: Observable<boolean>;
}

export const getControlValueAccessorBindings = <ControlInterface>(
  componentInstance: ControlValueAccessorComponentInstance,
): FormBindings<ControlInterface> => {
  const writeValue$$: ReplaySubject<Nilable<ControlInterface>> = new ReplaySubject(1);
  const registerOnChange$$: ReplaySubject<(formValue: ControlInterface) => void> = new ReplaySubject(1);
  const registerOnTouched$$: ReplaySubject<(_: any) => void> = new ReplaySubject(1);
  const setDisabledState$$: ReplaySubject<boolean> = new ReplaySubject(1);

  const controlValueAccessorPatch: Required<ControlValueAccessor> = {
    writeValue: (obj: Nilable<any>): void => {
      writeValue$$.next(obj);
    },
    registerOnChange: (fn: (formValue: ControlInterface) => void): void => {
      registerOnChange$$.next(fn);
    },
    registerOnTouched: (fn: () => void): void => {
      registerOnTouched$$.next(fn);
    },
    setDisabledState: (shouldDisable: boolean | undefined): void => {
      setDisabledState$$.next(shouldDisable);
    },
  };

  patchClassInstance(componentInstance, controlValueAccessorPatch);

  return {
    writeValue$: writeValue$$.asObservable(),
    registerOnChange$: registerOnChange$$.asObservable(),
    registerOnTouched$: registerOnTouched$$.asObservable(),
    setDisabledState$: setDisabledState$$.asObservable(),
  };
};
// const safelyPatchClassInstance = (componentInstance: any, obj: Object) => {
//   Object.entries(obj).forEach(([key, newMethod]) => {
//     const previousMethod = componentInstance[key];

//     componentInstance[key] = (...args: any[]) => {
//       if (previousMethod) {
//         previousMethod.apply(componentInstance);
//       }

//       newMethod(args);
//     };
//   });
// };
