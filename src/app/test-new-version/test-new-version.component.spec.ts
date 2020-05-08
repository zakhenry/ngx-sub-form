import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestNewVersionComponent } from './test-new-version.component';

describe('TestNewVersionComponent', () => {
  let component: TestNewVersionComponent;
  let fixture: ComponentFixture<TestNewVersionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestNewVersionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestNewVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
