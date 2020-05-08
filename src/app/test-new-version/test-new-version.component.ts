import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { createSubForm } from '../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form';
import { subformComponentProviders } from '../../../projects/ngx-sub-form/src/lib/ngx-sub-form-utils';

interface Sub {
  subPropA: string;
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
      subPropA: new FormControl(null, Validators.required),
    },
    formGroupOptions: {
      validators: [
        formGroup => {
          if (formGroup.value.subPropA !== 'wow') {
            return {
              subPropANotWow: true,
            };
          }

          return null;
        },
      ],
    },
  });
}
