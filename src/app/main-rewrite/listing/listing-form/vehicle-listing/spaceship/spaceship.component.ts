import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { getObservableLifecycle, ObservableLifecycle } from 'ngx-observable-lifecycle';
import { subformComponentProviders } from 'ngx-sub-form';
import { Spaceship, VehicleType } from 'src/app/interfaces/vehicle.interface';
import { createForm } from '../../../../../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form';
import { FormType } from '../../../../../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form.types';

@ObservableLifecycle()
@Component({
  selector: 'app-spaceship',
  templateUrl: './spaceship.component.html',
  styleUrls: ['./spaceship.component.scss'],
  providers: subformComponentProviders(SpaceshipComponent),
})
export class SpaceshipComponent {
  public form = createForm<Spaceship>(this, {
    formType: FormType.SUB,
    formControls: {
      color: new FormControl(null, { validators: [Validators.required] }),
      canFire: new FormControl(false, { validators: [Validators.required] }),
      crewMembers: new FormControl(null, { validators: [Validators.required] }),
      wingCount: new FormControl(null, { validators: [Validators.required] }),
      vehicleType: new FormControl(VehicleType.SPACESHIP, { validators: [Validators.required] }),
    },
    componentHooks: {
      onDestroy: getObservableLifecycle(this).onDestroy,
    },
  });
}