import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';

@Component({
  selector: 'app-pilot-briefing',
  templateUrl: './pilot-briefing.component.html',
  styleUrls: ['./pilot-briefing.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PilotBriefingComponent {
  briefingForm: FormGroup;
  briefingData: any = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.briefingForm = this.fb.group({
      reportTypes: this.fb.group({
        METAR: [false],
        TAF: [false],
        SIGMET: [false]
      }, { validators: this.requireAtLeastOneSelection }),
      airports: [''],
      countries: ['']
    }, { validators: this.requireAtLeastOneCriteria });
  }

  requireAtLeastOneSelection = (formGroup: FormGroup) => {
    const reportTypes = formGroup.get('reportTypes');
    if (reportTypes && Object.values(reportTypes.value).every(val => val === false)) {
      return { requireAtLeastOneSelection: true };
    }
    return null;
  }

  requireAtLeastOneCriteria = (formGroup: FormGroup) => {
    const airports = formGroup.get('airports')?.value;
    const countries = formGroup.get('countries')?.value;
    
    if (!airports && !countries) {
      return { requireAtLeastOneCriteria: true };
    }
    return null;
  }

  onSubmit() {
    if (this.briefingForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    const formValue = this.briefingForm.value;
    const selectedReports = Object.keys(formValue.reportTypes)
      .filter(key => formValue.reportTypes[key])
      .map(key => key === 'TAF' ? 'TAF_LONGTAF' : key);
    const airports = formValue.airports.split(' ').map((code: string) => code.trim().toUpperCase()).filter(Boolean);
    const countries = formValue.countries.split(' ').map((code: string) => code.trim().toUpperCase()).filter(Boolean);

    const requestPayload = {
      id: 'query01',
      method: 'query',
      params: [
        {
          id: 'briefing01',
          reportTypes: selectedReports,
          stations: airports,
          countries: countries
        }
      ],
    };

    console.log('Request Payload:', requestPayload);

    this.http.post<any>('https://ogcie.iblsoft.com/ria/opmetquery', requestPayload)
      .subscribe(response => {
        console.log('Response:', response);
        this.briefingData = this.processResponse(response.result);
      }, error => {
        console.error('Error fetching briefing data:', error);
      });
  }

  processResponse(data: any) {
    return data.reduce((acc: any, item: any) => {
      acc[item.stationId] = [...acc[item.stationId] || [], item];
      return acc;
    }, {});
  }

  formatReportTime(reportTime: string) {
    return moment(reportTime).locale('sk').format('LLLL');
  }

  highlightText(text: string): string {
    return text.replace(/\b(BKN|FEW|SCT)(\d{3})\b/g, (match, p1, p2) => {
      const color = parseInt(p2, 10) <= 30 ? 'blue' : 'red';
      return `<span class="${color}">${match}</span>`;
    });
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
