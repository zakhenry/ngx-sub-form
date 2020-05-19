import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { RootFComponent } from './root-f/root-f.component';
import { SharedModule } from './shared/shared.module';
import { TestNewVersionComponent } from './test-new-version/test-new-version.component';

@NgModule({
  declarations: [AppComponent, TestNewVersionComponent, RootFComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {
        path: 'rewrite',
        loadChildren: () => import('./main-rewrite/main.module').then(x => x.MainModule),
      },
      {
        path: '',
        loadChildren: () => import('./main/main.module').then(x => x.MainModule),
      },
    ]),
    SharedModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
