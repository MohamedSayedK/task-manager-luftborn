import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { injectTranslate } from './inject-translate';

describe('injectTranslate', () => {
  it('translates a key, filling in its values', () => {
    const translate = TestBed.runInInjectionContext(() => injectTranslate());

    expect(translate('board.deleteHeader')).toBe('Delete task');
    expect(translate('card.actions', { title: 'Fix login bug' })).toBe('Actions for Fix login bug');
  });

  it('makes a computed value follow the active language', () => {
    const translate = TestBed.runInInjectionContext(() => injectTranslate());
    const label = computed(() => translate('common.retry'));
    expect(label()).toBe('Retry');

    TestBed.inject(TranslocoService).setActiveLang('ar');

    expect(label()).toBe('إعادة المحاولة');
  });
});
