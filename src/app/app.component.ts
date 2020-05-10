import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public formGroup: FormGroup = new FormGroup({
    a: new FormControl({ subPropA: ['test'] }),
  });

  constructor() {
    this.formGroup.valueChanges.subscribe(x => console.log('[PARENT] form updated:', x));

    setTimeout(() => {
      // console.log('[PARENT] updating form 1');
      this.formGroup.setValue({ a: { subPropA: ['test', 'ok2'] } }, { emitEvent: false });
    }, 2000);
    //
    // setTimeout(() => {
    //   console.log('[PARENT] updating form 2');
    //   this.formGroup.setValue({ a: 'hello 2' });
    // }, 4000);
  }
}
