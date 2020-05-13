import { ChangeDetectionStrategy, Component, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { createForm } from '../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form';
import { FormType } from '../../../projects/ngx-sub-form/src/lib/new/ngx-sub-form.types';

export interface RootF {
  a: {
    subPropA: string[];
  };
}

@Component({
  selector: 'app-root-f',
  templateUrl: './root-f.component.html',
  styleUrls: ['./root-f.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RootFComponent {
  private input$: Subject<RootF | undefined> = new Subject();
  @Input() set value(value: RootF | undefined) {
    this.input$.next(value);
  }

  @Output() valueUpdate: Subject<RootF> = new Subject();

  public condition = true;

  private onDestroy$: Subject<void> = new Subject();

  ngxSubForm = createForm<RootF>(this, {
    formType: FormType.ROOT,
    disabled$: of(false),
    input$: this.input$,
    output$: this.valueUpdate,
    formControls: {
      a: new FormControl({ subPropA: [] }, Validators.required),
    },
    componentHooks: {
      ngOnDestroy$: this.onDestroy$.asObservable(),
    },
  });

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
