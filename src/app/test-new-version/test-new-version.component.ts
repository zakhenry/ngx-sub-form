import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { createForm } from '../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form';
import { FormType } from '../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form.types';
import { subformComponentProviders } from '../../../projects/ngx-sub-form/src/lib/ngx-sub-form-utils';

interface Sub {
  subPropA: string[];
}

interface Sub2 {
  subPropB: string[];
}

@Component({
  selector: 'app-test-new-version',
  templateUrl: './test-new-version.component.html',
  styleUrls: ['./test-new-version.component.css'],
  providers: subformComponentProviders(TestNewVersionComponent),
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestNewVersionComponent implements OnDestroy {
  private onDestroy$: Subject<void> = new Subject();

  ngxSubForm = createForm<Sub, Sub2>(this, FormType.SUB, {
    formControls: {
      subPropB: new FormArray([], Validators.required),
    },
    createFormArrayControl: (key, value) => {
      if (key === 'subPropB') {
        return new FormControl(value, [Validators.required]);
      }

      return new FormControl();
    },
    toFormGroup: obj => ({ subPropB: obj.subPropA }),
    fromFormGroup: formValue => ({ subPropA: formValue.subPropB }),
    componentHooks: {
      ngOnDestroy$: this.onDestroy$.asObservable(),
    },
    formGroupOptions: {
      validators: [
        formGroup => {
          if (formGroup.value.subPropB.length) {
            return {
              subPropANotWow: true,
            };
          }

          return null;
        },
      ],
    },
  });

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  constructor() {
    // setTimeout(() => {
    //   (this as any).ngOnDestroy();
    // }, 1000);
    // this.ngxSubForm.formGroup.get('subPropA')?.controls
  }

  // ngOnDestroy() {
  //   console.log('HHELO!');
  // }
}
