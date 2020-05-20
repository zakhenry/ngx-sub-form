import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { subformComponentProviders } from 'ngx-sub-form';
import { Subject } from 'rxjs';
import { OneVehicle, Spaceship, Speeder, VehicleType } from 'src/app/interfaces/vehicle.interface';
import { UnreachableCase } from 'src/app/shared/utils';
import { createForm } from '../../../../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form';
import { FormType } from '../../../../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form.types';

export interface OneVehicleForm {
  speeder: Speeder | null;
  spaceship: Spaceship | null;
  vehicleType: VehicleType | null;
}

@Component({
  selector: 'app-vehicle-product',
  templateUrl: './vehicle-product.component.html',
  styleUrls: ['./vehicle-product.component.scss'],
  providers: subformComponentProviders(VehicleProductComponent),
})
export class VehicleProductComponent {
  public VehicleType = VehicleType;

  private onDestroy$: Subject<void> = new Subject();

  public form = createForm<OneVehicle, OneVehicleForm>(this, {
    formType: FormType.SUB,
    formControls: {
      speeder: new FormControl(null),
      spaceship: new FormControl(null),
      vehicleType: new FormControl(null, { validators: [Validators.required] }),
    },
    toFormGroup: (obj: OneVehicle): OneVehicleForm => {
      return {
        speeder: obj.vehicleType === VehicleType.SPEEDER ? obj : null,
        spaceship: obj.vehicleType === VehicleType.SPACESHIP ? obj : null,
        vehicleType: obj.vehicleType,
      };
    },
    fromFormGroup: (formValue: OneVehicleForm): OneVehicle => {
      switch (formValue.vehicleType) {
        case VehicleType.SPEEDER:
          return formValue.speeder as any; // todo
        case VehicleType.SPACESHIP:
          return formValue.spaceship as any; // todo
        case null:
          return null as any; //todo
        default:
          throw new UnreachableCase(formValue.vehicleType);
      }
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
