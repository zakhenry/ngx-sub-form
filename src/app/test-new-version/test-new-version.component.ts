import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { createSubForm } from '../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form';
import { subformComponentProviders } from '../../../projects/ngx-sub-form/src/lib/ngx-sub-form-utils';

interface Sub {
  subPropA: string[];
}

@Component({
  selector: 'app-test-new-version',
  templateUrl: './test-new-version.component.html',
  styleUrls: ['./test-new-version.component.css'],
  providers: subformComponentProviders(TestNewVersionComponent),
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestNewVersionComponent {
  ngxSubForm = createSubForm<Sub>(this, {
    formControls: {
      subPropA: new FormArray([], Validators.required),
    },
    createFormArrayControl: (key, value) => {
      if (key === 'subPropA') {
        return new FormControl(value, [Validators.required]);
      }

      return new FormControl();
    },
    // formGroupOptions: {
    //   validators: [
    //     formGroup => {
    //       if (formGroup.value.subPropA !== 'wow') {
    //         return {
    //           subPropANotWow: true,
    //         };
    //       }

    //       return null;
    //     },
    //   ],
    // },
  });

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
