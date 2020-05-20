import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { subformComponentProviders } from 'ngx-sub-form';
import { Subject } from 'rxjs';
import { createForm } from '../../../../../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form';
import { FormType } from '../../../../../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form.types';
import { DroidType, Languages, ProtocolDroid } from '../../../../../interfaces/droid.interface';

@Component({
  selector: 'app-protocol-droid',
  templateUrl: './protocol-droid.component.html',
  styleUrls: ['./protocol-droid.component.scss'],
  providers: subformComponentProviders(ProtocolDroidComponent),
})
export class ProtocolDroidComponent {
  public Languages = Languages;

  private onDestroy$: Subject<void> = new Subject();

  public form = createForm<ProtocolDroid>(this, {
    formType: FormType.SUB,
    formControls: {
      color: new FormControl(null, { validators: [Validators.required] }),
      name: new FormControl(null, { validators: [Validators.required] }),
      droidType: new FormControl(DroidType.PROTOCOL, { validators: [Validators.required] }),
      spokenLanguages: new FormControl(null, { validators: [Validators.required] }),
    },
    componentHooks: {
      ngOnDestroy$: this.onDestroy$.asObservable(),
    },
  });

  public ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
