import { Component } from '@angular/core';
import { concat, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { RootF } from './root-f/root-f.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public value$: Observable<RootF> = concat(
    of({
      a: {
        subPropA: ['test!'],
      },
    }),
    of({
      a: {
        subPropA: ['test!', 'wow'],
      },
    }).pipe(delay(2000)),
  );
}
