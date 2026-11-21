import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { PrimeNG } from 'primeng/config';
import { PrimeNgTranslation } from './primeng-translation';

describe('PrimeNgTranslation', () => {
  const aria = () => TestBed.inject(PrimeNG).getTranslation('aria');
  const emptyMessage = () => TestBed.inject(PrimeNG).getTranslation('emptyMessage');

  function start(): void {
    TestBed.inject(PrimeNgTranslation);
  }

  it('gives PrimeNG its texts in the active language at the start', () => {
    start();

    expect(emptyMessage()).toBe('No results found');
    expect(aria()['listLabel']).toBe('Option List');
  });

  it('gives PrimeNG Arabic texts when the language changes, and English again after', () => {
    start();

    TestBed.inject(TranslocoService).setActiveLang('ar');
    expect(emptyMessage()).toBe('لا توجد نتائج');
    expect(TestBed.inject(PrimeNG).getTranslation('emptyFilterMessage')).toBe('لا توجد نتائج');
    expect(aria()['listLabel']).toBe('قائمة الخيارات');

    TestBed.inject(TranslocoService).setActiveLang('en');
    expect(emptyMessage()).toBe('No results found');
  });

  it('gives PrimeNG the word for the close button of a message in both languages', () => {
    start();
    expect(aria()['close']).toBe('Close');

    TestBed.inject(TranslocoService).setActiveLang('ar');

    expect(aria()['close']).toBe('إغلاق');
  });

  it('keeps the other built-in aria texts of PrimeNG', () => {
    start();

    TestBed.inject(TranslocoService).setActiveLang('ar');

    expect(aria()['maximizeLabel']).toBe('Maximize');
  });
});
