import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Task, TaskPriority, TaskStatus } from '../data/task';
import { TaskDetailStore } from '../data/task-detail-store';
import { TaskLookupStore } from '../data/task-lookup-store';
import { TaskColumn } from '../ui/task-column';
import { injectTranslate } from '../util/inject-translate';
import { Move, planMove, sortColumn } from '../util/task-order';
import { TaskColumns, TaskSearchStore } from './task-search-store';

/** Labels are message keys, translated where they are shown. */
const COLUMNS: { status: TaskStatus; labelKey: string }[] = [
  { status: 'todo', labelKey: 'common.status.todo' },
  { status: 'in_progress', labelKey: 'common.status.inProgress' },
  { status: 'done', labelKey: 'common.status.done' },
];

const STATUS_TABS: { labelKey: string; value: TaskStatus | null }[] = [
  { labelKey: 'board.all', value: null },
  ...COLUMNS.map(({ status, labelKey }) => ({ labelKey, value: status })),
];

const PRIORITY_OPTIONS: { labelKey: string; value: TaskPriority | null }[] = [
  { labelKey: 'board.allPriorities', value: null },
  { labelKey: 'common.priority.high', value: 'high' },
  { labelKey: 'common.priority.medium', value: 'medium' },
  { labelKey: 'common.priority.low', value: 'low' },
];

@Component({
  selector: 'app-task-search',
  // One group, so a card can be dropped on any column.
  hostDirectives: [CdkDropListGroup],
  imports: [ReactiveFormsModule, TranslocoPipe, Button, Dialog, Select, SelectButton, TaskColumn],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5rem;
      align-items: start;
      padding: 1.5rem;
    }

    .filters {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: var(--app-surface);
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
    }

    .error {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--app-error-border);
      border-radius: 0.5rem;
      background: var(--app-error-bg);
      color: var(--app-error-text);
    }

    // The grey inactive tab text is a shade too light for 4.5:1 on the grey tab bar.
    p-selectbutton {
      --p-togglebutton-color: var(--app-text-secondary);
      --p-togglebutton-checked-background: var(--p-primary-color);
      --p-togglebutton-checked-color: var(--p-primary-contrast-color);
      --p-togglebutton-content-checked-background: var(--p-primary-color);
    }

    .new-task {
      margin-inline-start: auto;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    @media (max-width: 900px) {
      :host {
        grid-template-columns: minmax(0, 1fr);
        padding: 1rem;
      }

      // Tabs on their own row, then both dropdowns and the New Task button on one row.
      .filters {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
      }

      p-selectbutton {
        grid-column: 1 / -1;
      }

      p-select {
        width: 100%;
      }

      .new-task {
        margin-inline-start: 0;
      }
    }

    // On a phone the controls form a grid: tabs on one full row, the two dropdowns side by side
    // and the New Task button full width, which is also the only way to create a task there.
    @media (max-width: 600px) {
      .filters {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        padding: 0.75rem;
      }

      p-selectbutton,
      .new-task {
        grid-column: 1 / -1;
      }

      p-selectbutton {
        display: flex;
        --p-togglebutton-padding: 0.5rem 0.25rem;
      }

      p-selectbutton ::ng-deep .p-togglebutton {
        flex: 1 1 auto;
        white-space: nowrap;
      }

      p-select {
        width: 100%;
        font-size: 0.875rem;
        --p-select-padding-x: 0.625rem;
        --p-select-dropdown-width: 2rem;
      }

      .new-task {
        margin-inline-start: 0;
      }

      .new-task ::ng-deep .p-button {
        width: 100%;
      }
    }

    // The narrowest phones have no room for two dropdowns side by side.
    @media (max-width: 360px) {
      .filters {
        grid-template-columns: minmax(0, 1fr);
      }

      p-selectbutton ::ng-deep .p-togglebutton {
        font-size: 0.8125rem;
      }
    }
  `,
  templateUrl: './task-search.html',
})
export class TaskSearch {
  protected readonly store = inject(TaskSearchStore);
  /**
   * The tasks of each column in the order shown. It follows the store, and a drop changes it at
   * once, before the move is saved, so a card does not jump back while the request runs.
   */
  protected readonly columnTasks = linkedSignal<TaskColumns>(() => {
    const columns = this.store.columns();
    return {
      todo: sortColumn(columns.todo, this.today),
      in_progress: sortColumn(columns.in_progress, this.today),
      done: sortColumn(columns.done, this.today),
    };
  });
  private readonly lookup = inject(TaskLookupStore);
  protected readonly detail = inject(TaskDetailStore);
  private readonly document = inject(DOCUMENT);
  protected readonly columns = COLUMNS;
  private readonly translate = injectTranslate();
  protected readonly statusTabs = computed(() =>
    STATUS_TABS.map(({ labelKey, value }) => ({ label: this.translate(labelKey), value })),
  );
  // The store outlives this component, so the controls start from the filters it holds.
  protected readonly status = new FormControl(this.store.status() ?? null);
  protected readonly priorityOptions = computed(() =>
    PRIORITY_OPTIONS.map(({ labelKey, value }) => ({ label: this.translate(labelKey), value })),
  );
  protected readonly priority = new FormControl(this.store.priority() ?? null);
  protected readonly assignee = new FormControl(this.store.assigneeId() ?? null);
  /** Matched against title and description. The page owns the search box and passes it in. */
  readonly search = input('');
  /** The first option clears the assignee filter: `id: null` maps to "no filter". */
  protected readonly assigneeOptions = computed(() => [
    { id: null, name: this.translate('board.allAssignees') },
    ...this.lookup.assigneesValue(),
  ]);
  /** Today's local date as `YYYY-MM-DD` (the `en-CA` locale formats dates that way). */
  protected readonly today = new Date().toLocaleDateString('en-CA');

  /** `true` after a dropped card could not be saved, until the next move. */
  protected readonly moveFailed = signal(false);

  /** The task the user is asked about before it is deleted. `null` while no question is open. */
  protected readonly pendingDelete = signal<Task | null>(null);

  /** Shows a dropped card at once and saves it. The board reloads when the store counts it. */
  protected async moveTask(move: Move): Promise<void> {
    const plan = planMove(this.columnTasks(), move);
    if (!plan) {
      return;
    }
    this.moveFailed.set(false);
    this.columnTasks.set(plan.columns);
    const result = await this.detail.move(plan);
    if (result.status === 'error') {
      // The board on screen is not what was saved, so show what the API has.
      this.moveFailed.set(true);
      this.store.reload();
    }
  }

  /** Asks first. The board reloads once the store counts the change after the delete. */
  protected confirmRemove(task: Task): void {
    this.pendingDelete.set(task);
  }

  /** Closes the question and gives focus back to the menu button of that card. */
  protected cancelDelete(): void {
    const task = this.pendingDelete();
    if (!task) {
      return;
    }
    this.pendingDelete.set(null);
    const label = this.translate('card.actions', { title: task.title });
    Array.from(this.document.querySelectorAll<HTMLElement>('button[aria-label]'))
      .find((button) => button.getAttribute('aria-label') === label)
      ?.focus();
  }

  protected deleteConfirmed(): void {
    const task = this.pendingDelete();
    this.pendingDelete.set(null);
    if (task) {
      void this.detail.remove(task);
    }
  }

  constructor() {
    // A create, update or delete somewhere else (e.g. the edit dialog) changed the tasks.
    effect(() => {
      if (this.detail.changeCount() > 0) {
        untracked(() => this.store.reload());
      }
    });

    this.status.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((status) => this.store.setFilters({ status: status ?? undefined }));
    this.priority.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((priority) => this.store.setFilters({ priority: priority ?? undefined }));
    this.assignee.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((assigneeId) => this.store.setFilters({ assigneeId: assigneeId ?? undefined }));
    effect(() => this.store.setFilters({ search: this.search() }));
  }
}
