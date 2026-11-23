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
import { Assignee, Task, TaskDraft, TaskPriority, TaskStatus } from '../../data/task';
import { injectTranslate } from '../../util/inject-translate';
import { dueDateNotInPast } from '../../util/task-validators';

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
  styleUrl: './task-form.scss',
  templateUrl: './task-form.html',
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
