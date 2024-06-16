import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PilotBriefingComponent } from './pilot-briefing.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

describe('PilotBriefingComponent', () => {
  let component: PilotBriefingComponent;
  let fixture: ComponentFixture<PilotBriefingComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PilotBriefingComponent],
      imports: [ReactiveFormsModule, MatCheckboxModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PilotBriefingComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('test_form_invalid_no_report_type_selected', () => {
    component.briefingForm.get('reportTypes.METAR')?.setValue(false);
    component.briefingForm.get('reportTypes.TAF')?.setValue(false);
    component.briefingForm.get('reportTypes.SIGMET')?.setValue(false);
    fixture.detectChanges();

    expect(component.briefingForm.invalid).toBeTrue();
  });

  it('test_form_invalid_no_airports_no_countries', () => {
    component.briefingForm.get('airports')?.setValue('');
    component.briefingForm.get('countries')?.setValue('');
    fixture.detectChanges();

    expect(component.briefingForm.invalid).toBeTrue();
    expect(component.briefingForm.errors?.requireAtLeastOneCriteria).toBeTrue();
  });

  it('test_onSubmit_correct_payload_and_response_handling', () => {
    component.briefingForm.get('reportTypes.METAR')?.setValue(true);
    component.briefingForm.get('airports')?.setValue('JFK');
    component.briefingForm.get('countries')?.setValue('US');
    fixture.detectChanges();

    component.onSubmit();

    const req = httpMock.expectOne('https://ogcie.iblsoft.com/ria/opmetquery');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      jsonrpc: '2.0',
      method: 'query',
      params: [
        {
          id: 'briefing01',
          reportTypes: ['METAR'],
          stations: ['JFK'],
          countries: ['US']
        }
      ],
      id: 'query01'
    });

    req.flush({
      result: [
        { stationId: 'JFK', report: 'METAR report' }
      ]
    });

    expect(component.briefingData).toEqual({
      'JFK': [{ stationId: 'JFK', report: 'METAR report' }]
    });

    httpMock.verify();
  });
});