import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Assignee, Task, TaskDraft, TaskPriority, TaskStatus } from '../data/task';
import { injectTranslate } from '../util/inject-translate';
import { dueDateNotInPast } from '../util/task-validators';

/** Labels are message keys, translated when the options are built. */
const PRIORITIES: { labelKey: string; value: TaskPriority }[] = [
  { labelKey: 'common.priority.high', value: 'high' },
  { labelKey: 'common.priority.medium', value: 'medium' },
  { labelKey: 'common.priority.low', value: 'low' },
];

const STATUSES: { labelKey: string; value: TaskStatus }[] = [
  { labelKey: 'common.status.todo', value: 'todo' },
  { labelKey: 'common.status.inProgress', value: 'in_progress' },
  { labelKey: 'common.status.done', value: 'done' },
];

/** Message key to show per control and validator error key. */
const ERROR_KEYS: Record<string, Record<string, string>> = {
  title: {
    required: 'form.errors.titleRequired',
    minlength: 'form.errors.titleMin',
    maxlength: 'form.errors.titleMax',
  },
  description: { maxlength: 'form.errors.descriptionMax' },
  dueDate: {
    required: 'form.errors.dueRequired',
    dueDateInPast: 'form.errors.dueInPast',
  },
  assignee: { required: 'form.errors.assigneeRequired' },
};

/** Presentational form for creating or editing a task. Emits a draft, never talks to a store. */
@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, TranslocoPipe, Button, InputText, Select, Textarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    small {
      color: var(--app-error-text);
    }

    .field > span,
    label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--app-text-secondary);
    }

    .row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="task-title">{{ 'form.title' | transloco }}</label>
        <input
          pInputText
          id="task-title"
          formControlName="title"
          [attr.aria-invalid]="error('title') ? true : null"
          [attr.aria-describedby]="error('title') ? 'task-title-error' : null"
        />
        @if (error('title'); as key) {
          <small id="task-title-error" role="alert">{{ key | transloco }}</small>
        }
      </div>
      <div class="field">
        <label for="task-description">{{ 'form.description' | transloco }}</label>
        <textarea
          pTextarea
          id="task-description"
          rows="3"
          formControlName="description"
          [attr.aria-invalid]="error('description') ? true : null"
          [attr.aria-describedby]="error('description') ? 'task-description-error' : null"
        ></textarea>
        @if (error('description'); as key) {
          <small id="task-description-error" role="alert">{{ key | transloco }}</small>
        }
      </div>
      <div class="row">
        <div class="field">
          <span aria-hidden="true">{{ 'form.priority' | transloco }}</span>
          <p-select
            [ariaLabel]="'form.priority' | transloco"
            [options]="priorities()"
            optionLabel="label"
            optionValue="value"
            formControlName="priority"
          />
        </div>
        <div class="field">
          <span aria-hidden="true">{{ 'form.status' | transloco }}</span>
          <p-select
            [ariaLabel]="'form.status' | transloco"
            [options]="statuses()"
            optionLabel="label"
            optionValue="value"
            formControlName="status"
          />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label for="task-due-date">{{ 'form.dueDate' | transloco }}</label>
          <input
            pInputText
            id="task-due-date"
            type="date"
            formControlName="dueDate"
            [attr.aria-invalid]="error('dueDate') ? true : null"
            [attr.aria-describedby]="error('dueDate') ? 'task-due-date-error' : null"
          />
          @if (error('dueDate'); as key) {
            <small id="task-due-date-error" role="alert">{{ key | transloco }}</small>
          }
        </div>
        <div class="field">
          <span aria-hidden="true">{{ 'form.assignee' | transloco }}</span>
          <p-select
            [ariaLabel]="'form.assignee' | transloco"
            [options]="assignees()"
            optionLabel="name"
            dataKey="id"
            formControlName="assignee"
            [invalid]="!!error('assignee')"
          />
          @if (error('assignee'); as key) {
            <small role="alert">{{ key | transloco }}</small>
          }
        </div>
      </div>
      <fieldset formArrayName="tags">
        <legend>{{ 'form.tags' | transloco }}</legend>
        @for (tag of tags.controls; track tag; let position = $index) {
          <div class="tag">
            <input
              pInputText
              [formControlName]="position"
              [attr.aria-label]="'form.tagN' | transloco: { n: position + 1 }"
            />
            <p-button
              type="button"
              icon="pi pi-times"
              severity="secondary"
              [text]="true"
              [ariaLabel]="'form.removeTagN' | transloco: { n: position + 1 }"
              (onClick)="removeTag(position)"
            />
          </div>
        }
        <p-button
          type="button"
          [label]="'form.addTag' | transloco"
          icon="pi pi-plus"
          severity="secondary"
          size="small"
          (onClick)="addTag()"
        />
      </fieldset>
      @if (errorMessage(); as message) {
        <small role="alert">{{ message }}</small>
      }
      <footer>
        <p-button
          type="button"
          [label]="'common.cancel' | transloco"
          severity="secondary"
          (onClick)="cancelled.emit()"
        />
        <p-button
          type="submit"
          [label]="'common.save' | transloco"
          [disabled]="saving()"
          [loading]="saving()"
        />
      </footer>
    </form>
  `,
})
export class TaskForm {
  /** The task to edit. Leave it out to create a new task. It may arrive after the form shows. */
  readonly task = input<Task>();
  readonly assignees = input.required<Assignee[]>();
  /** Today's date as `YYYY-MM-DD`. */
  readonly today = input.required<string>();
  /** While `true`, the Save button is disabled so the task is not sent twice. */
  readonly saving = input(false);
  /** Shown when the last save failed. */
  readonly errorMessage = input<string>();

  readonly save = output<TaskDraft>();
  readonly cancelled = output<void>();

  private readonly translate = injectTranslate();
  protected readonly priorities = computed(() =>
    PRIORITIES.map(({ labelKey, value }) => ({ label: this.translate(labelKey), value })),
  );
  protected readonly statuses = computed(() =>
    STATUSES.map(({ labelKey, value }) => ({ label: this.translate(labelKey), value })),
  );

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: ['', [Validators.required, dueDateNotInPast(() => this.earliestDueDate())]],
    assignee: [null as Assignee | null, Validators.required],
    tags: this.fb.array<string>([]),
  });

  constructor() {
    effect(() => {
      const task = this.task();
      if (task) {
        untracked(() => this.fill(task));
      }
    });
  }

  /** An existing task may already be overdue, so only a new task needs a due date from today. */
  private earliestDueDate(): string {
    return this.task() ? '' : this.today();
  }

  private fill(task: Task): void {
    const { tags, ...fields } = task;
    this.form.patchValue(fields);
    this.tags.clear();
    for (const tag of tags) {
      this.tags.push(this.fb.control(tag));
    }
  }

  protected readonly tags = this.form.controls.tags;

  protected addTag(): void {
    this.tags.push(this.fb.control(''));
  }

  protected removeTag(position: number): void {
    this.tags.removeAt(position);
  }

  /** The message key for the first error of a touched control, or `null` when there is none. */
  protected error(name: keyof typeof ERROR_KEYS): string | null {
    const control = this.form.get(name);
    const key = control?.touched ? Object.keys(control.errors ?? {})[0] : undefined;
    return key ? (ERROR_KEYS[name][key] ?? null) : null;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    const { assignee, tags, ...value } = this.form.getRawValue();
    if (this.form.valid && assignee) {
      this.save.emit({
        ...value,
        assignee,
        tags: tags.map((tag) => tag.trim()).filter((tag) => tag !== ''),
      });
    }
  }
}
