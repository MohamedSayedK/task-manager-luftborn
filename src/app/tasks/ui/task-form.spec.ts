import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { Assignee, Task, TaskDraft } from '../data/task';
import { TaskForm } from './task-form';

const JOHN: Assignee = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john.doe@company.com',
};
const SARAH: Assignee = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah.smith@company.com',
};

describe('TaskForm', () => {
  let fixture: ComponentFixture<TaskForm>;
  let form: HTMLElement;
  let saved: TaskDraft[];
  let cancelled: number;

  function render(inputs: Record<string, unknown> = {}): void {
    fixture = TestBed.createComponent(TaskForm);
    fixture.componentRef.setInput('assignees', [JOHN, SARAH]);
    fixture.componentRef.setInput('today', '2026-11-21');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    saved = [];
    cancelled = 0;
    fixture.componentInstance.save.subscribe((draft) => saved.push(draft));
    fixture.componentInstance.cancelled.subscribe(() => cancelled++);
    fixture.detectChanges();
    form = fixture.nativeElement;
  }

  /** The text, date or textarea control that belongs to the label with this text. */
  function field(label: string): HTMLInputElement {
    const labelElement = Array.from(form.querySelectorAll('label')).find(
      (item) => item.textContent?.trim() === label,
    );
    return form.querySelector<HTMLInputElement>(`#${labelElement?.htmlFor}`)!;
  }

  function type(label: string, text: string): void {
    const control = field(label);
    control.value = text;
    control.dispatchEvent(new Event('input'));
  }

  /** Opens the dropdown with the given aria-label and clicks the option with the given label. */
  function pickOption(dropdown: string, option: string): void {
    form.querySelector<HTMLElement>(`[aria-label="${dropdown}"]`)?.click();
    fixture.detectChanges();
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .find((item) => item.textContent?.trim() === option)
      ?.click();
    fixture.detectChanges();
  }

  const button = (label: string) =>
    Array.from(form.querySelectorAll('button')).find((item) => item.textContent?.trim() === label);

  function submit(): void {
    button('Save')?.click();
    fixture.detectChanges();
  }

  /** Fills in every required field with valid values; tests then break one of them. */
  function fillValid(): void {
    type('Title', 'Write docs');
    type('Due date', '2026-12-01');
    pickOption('Assignee', 'John Doe');
  }

  const alerts = () =>
    Array.from(form.querySelectorAll('[role="alert"]')).map((item) => item.textContent?.trim());

  describe('in Arabic', () => {
    beforeEach(() => TestBed.inject(TranslocoService).setActiveLang('ar'));

    it('words the labels, the legend and the buttons', () => {
      render();

      const labels = Array.from(form.querySelectorAll('label')).map((item) =>
        item.textContent?.trim(),
      );
      expect(labels).toEqual(['العنوان', 'الوصف', 'تاريخ الاستحقاق']);
      const captions = Array.from(form.querySelectorAll('.field > span')).map((item) =>
        item.textContent?.trim(),
      );
      expect(captions).toEqual(['الأولوية', 'الحالة', 'المسؤول']);
      expect(form.querySelector('legend')?.textContent?.trim()).toBe('الوسوم');
      for (const name of ['إضافة وسم', 'إلغاء', 'حفظ']) {
        expect(button(name)).toBeDefined();
      }
    });

    it('words the priority and status dropdowns and their options', () => {
      render();

      const dropdown = (name: string) => form.querySelector<HTMLElement>(`[aria-label="${name}"]`);
      expect(dropdown('الأولوية')?.textContent).toContain('متوسطة');
      expect(dropdown('الحالة')?.textContent).toContain('للتنفيذ');
      dropdown('الأولوية')?.click();
      fixture.detectChanges();
      const options = Array.from(document.body.querySelectorAll('[role="option"]')).map((item) =>
        item.textContent?.trim(),
      );
      expect(options).toEqual(['عالية', 'متوسطة', 'منخفضة']);
    });

    it('says in Arabic that there is no assignee to pick', () => {
      render({ assignees: [] });

      form.querySelector<HTMLElement>('[aria-label="المسؤول"]')?.click();
      fixture.detectChanges();

      expect(document.body.querySelector('[role="listbox"]')?.textContent).toContain(
        'لا توجد نتائج',
      );
    });

    it('words the messages for the required fields', () => {
      render();

      button('حفظ')?.click();
      fixture.detectChanges();

      expect(alerts()).toEqual(['العنوان مطلوب', 'تاريخ الاستحقاق مطلوب', 'المسؤول مطلوب']);
    });

    it('words the messages for a title, description and date that are not allowed', () => {
      render();
      const set = (selector: string, text: string) => {
        const control = form.querySelector<HTMLInputElement>(selector)!;
        control.value = text;
        control.dispatchEvent(new Event('input'));
      };

      set('#task-title', 'ab');
      set('#task-description', 'x'.repeat(501));
      set('#task-due-date', '2026-11-20');
      button('حفظ')?.click();
      fixture.detectChanges();
      expect(alerts()).toContain('يجب أن يتكون العنوان من 3 أحرف على الأقل');
      expect(alerts()).toContain('يجب ألا يزيد الوصف عن 500 حرف');
      expect(alerts()).toContain('لا يمكن أن يكون تاريخ الاستحقاق في الماضي');

      set('#task-title', 'x'.repeat(101));
      fixture.detectChanges();
      expect(alerts()).toContain('يجب ألا يزيد العنوان عن 100 حرف');
    });

    it('words the fields and buttons of a tag', () => {
      render();

      button('إضافة وسم')?.click();
      fixture.detectChanges();

      expect(form.querySelector('input[aria-label="الوسم 1"]')).not.toBeNull();
      expect(form.querySelector('button[aria-label="إزالة الوسم 1"]')).not.toBeNull();
    });
  });

  it('does not emit and asks for a title when the title is empty', () => {
    render();

    fillValid();
    type('Title', '');
    submit();

    expect(saved).toEqual([]);
    expect(alerts()).toContain('Title is required');
  });

  it('rejects a title shorter than 3 characters', () => {
    render();

    fillValid();
    type('Title', 'ab');
    submit();

    expect(saved).toEqual([]);
    expect(alerts()).toContain('Title needs at least 3 characters');
  });

  it('rejects a title longer than 100 characters', () => {
    render();

    fillValid();
    type('Title', 'x'.repeat(101));
    submit();

    expect(saved).toEqual([]);
    expect(alerts()).toContain('Title can have at most 100 characters');
  });

  it('rejects a description longer than 500 characters', () => {
    render();

    fillValid();
    type('Description', 'x'.repeat(501));
    submit();

    expect(saved).toEqual([]);
    expect(alerts()).toContain('Description can have at most 500 characters');
  });

  it('asks for a due date when it is empty', () => {
    render();

    fillValid();
    type('Due date', '');
    submit();

    expect(saved).toEqual([]);
    expect(alerts()).toContain('Due date is required');
  });

  it('asks for an assignee when none is picked', () => {
    render();

    type('Title', 'Write docs');
    type('Due date', '2026-12-01');
    submit();

    expect(saved).toEqual([]);
    expect(alerts()).toContain('Assignee is required');
  });

  it('rejects a due date in the past for a new task', () => {
    render();

    fillValid();
    type('Due date', '2026-11-20');
    submit();

    expect(saved).toEqual([]);
    expect(alerts()).toContain('Due date cannot be in the past');
  });

  function typeTag(position: number, text: string): void {
    const control = form.querySelector<HTMLInputElement>(`input[aria-label="Tag ${position}"]`)!;
    control.value = text;
    control.dispatchEvent(new Event('input'));
  }

  it('saves the tags added with the Add tag button', () => {
    render();

    fillValid();
    button('Add tag')?.click();
    fixture.detectChanges();
    typeTag(1, 'Backend');
    button('Add tag')?.click();
    fixture.detectChanges();
    typeTag(2, 'Critical');
    submit();

    expect(saved[0].tags).toEqual(['Backend', 'Critical']);
  });

  it('drops a tag that was removed again', () => {
    render();

    fillValid();
    button('Add tag')?.click();
    button('Add tag')?.click();
    fixture.detectChanges();
    typeTag(1, 'Backend');
    typeTag(2, 'Critical');
    form.querySelector<HTMLElement>('button[aria-label="Remove tag 1"]')?.click();
    fixture.detectChanges();
    submit();

    expect(saved[0].tags).toEqual(['Critical']);
  });

  it('leaves out tags that were left blank', () => {
    render();

    fillValid();
    button('Add tag')?.click();
    button('Add tag')?.click();
    fixture.detectChanges();
    typeTag(1, '  ');
    typeTag(2, ' Critical ');
    submit();

    expect(saved[0].tags).toEqual(['Critical']);
  });

  describe('editing an existing task', () => {
    const TASK: Task = {
      id: 'task-001',
      title: 'Fix login bug',
      description: 'Users cannot log in',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-11-01',
      assignee: SARAH,
      tags: ['Backend'],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };

    it('accepts a due date in the past because the task may already be overdue', () => {
      render({ task: TASK });

      submit();

      expect(saved).toHaveLength(1);
      expect(alerts()).not.toContain('Due date cannot be in the past');
    });

    it('starts with the values of the task and saves them with the changes', () => {
      render({ task: TASK });

      expect(field('Title').value).toBe('Fix login bug');
      expect(field('Description').value).toBe('Users cannot log in');
      expect(field('Due date').value).toBe('2026-11-01');
      expect(form.querySelector('[aria-label="Tag 1"]')).not.toBeNull();
      type('Title', 'Fix login redirect');
      submit();

      expect(saved).toEqual([
        {
          title: 'Fix login redirect',
          description: 'Users cannot log in',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2026-11-01',
          assignee: SARAH,
          tags: ['Backend'],
        },
      ]);
    });
  });

  it('tells the parent when the user cancels', () => {
    render();

    button('Cancel')?.click();

    expect(cancelled).toBe(1);
    expect(saved).toEqual([]);
  });

  it('disables the Save button while a save is in progress', () => {
    render({ saving: true });

    expect(button('Save')?.disabled).toBe(true);
  });

  it('shows the error of a failed save', () => {
    render({ errorMessage: 'Could not save the task. Try again.' });

    expect(alerts()).toContain('Could not save the task. Try again.');
  });

  it('emits the filled-in task when saved', () => {
    render();

    type('Title', 'Write docs');
    type('Description', 'Document the API');
    type('Due date', '2026-12-01');
    pickOption('Priority', 'High');
    pickOption('Status', 'In Progress');
    pickOption('Assignee', 'Sarah Smith');
    submit();

    expect(saved).toEqual([
      {
        title: 'Write docs',
        description: 'Document the API',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-01',
        assignee: SARAH,
        tags: [],
      },
    ]);
  });
});
