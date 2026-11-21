import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

describe('translated messages', () => {
  let transloco: TranslocoService;

  const say = (key: string, params?: Record<string, unknown>) => transloco.translate(key, params);

  beforeEach(() => {
    transloco = TestBed.inject(TranslocoService);
  });

  describe('in English', () => {
    beforeEach(() => transloco.setActiveLang('en'));

    it('uses the singular for one and the plural otherwise', () => {
      expect(say('card.dueIn', { count: 1 })).toBe('Due in 1 day');
      expect(say('card.dueIn', { count: 3 })).toBe('Due in 3 days');
      expect(say('card.overdueBy', { count: 2 })).toBe('Overdue by 2 days');
    });

    it('describes a change of a task by its kind', () => {
      expect(say('activity.entry', { type: 'created', title: 'Write docs' })).toBe(
        'Task "Write docs" was created',
      );
      expect(say('activity.entry', { type: 'deleted', title: 'Write docs' })).toBe(
        'Task "Write docs" was deleted',
      );
    });
  });

  describe('in Arabic', () => {
    beforeEach(() => transloco.setActiveLang('ar'));

    it.each([
      [0, 'مستحقة خلال 0 يوم'],
      [1, 'مستحقة خلال يوم واحد'],
      [2, 'مستحقة خلال يومين'],
      [3, 'مستحقة خلال 3 أيام'],
      [11, 'مستحقة خلال 11 يومًا'],
      [100, 'مستحقة خلال 100 يوم'],
    ])('picks the right plural form for %i days', (count, expected) => {
      expect(say('card.dueIn', { count })).toBe(expected);
    });

    it('keeps Latin digits, like the rest of the page', () => {
      expect(say('card.overdueBy', { count: 3 })).toBe('متأخرة 3 أيام');
    });

    it('describes a change of a task by its kind', () => {
      expect(say('activity.entry', { type: 'created', title: 'Write docs' })).toBe(
        'تم إنشاء المهمة "Write docs"',
      );
    });
  });
});
