import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Dialog } from 'primeng/dialog';
import { TaskDraft } from '../data/task';
import { TaskDetailStore } from '../data/task-detail-store';
import { TaskLookupStore } from '../data/task-lookup-store';
import { TaskForm } from '../ui/task-form';

/** Dialog for creating a new task or editing an existing one. */
@Component({
  selector: 'app-task-edit',
  imports: [Dialog, TranslocoPipe, TaskForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [header]="headerKey() | transloco"
      [visible]="open()"
      [modal]="true"
      [draggable]="false"
      [closeAriaLabel]="'common.closeDialog' | transloco"
      [style]="{ width: '34rem' }"
      [breakpoints]="{ '640px': '95vw' }"
      (visibleChange)="$event || cancel()"
    >
      @if (open()) {
        @if (store.creating() || store.taskValue()) {
          <app-task-form
            [task]="store.taskValue()"
            [assignees]="lookup.assigneesValue()"
            [today]="today"
            [saving]="saving()"
            [errorMessage]="failed() ? ('edit.saveFailed' | transloco) : undefined"
            (save)="save($event)"
            (cancelled)="cancel()"
          />
        } @else if (store.taskError()) {
          <p role="alert">{{ 'edit.loadFailed' | transloco }}</p>
        } @else {
          <p>{{ 'edit.loading' | transloco }}</p>
        }
      }
    </p-dialog>
  `,
})
export class TaskEdit {
  protected readonly store = inject(TaskDetailStore);
  protected readonly lookup = inject(TaskLookupStore);

  /** Today's local date as `YYYY-MM-DD` (the `en-CA` locale formats dates that way). */
  protected readonly today = new Date().toLocaleDateString('en-CA');

  protected readonly open = computed(() => this.store.creating() || this.store.editId() !== null);
  /** The message key of the dialog header. */
  protected readonly headerKey = computed(() =>
    this.store.creating() ? 'edit.newTask' : 'edit.editTask',
  );
  protected readonly saving = computed(
    () => this.store.createIsPending() || this.store.updateIsPending(),
  );
  /** `true` after the last save failed. The store closes the dialog itself after a success. */
  protected readonly failed = signal(false);

  private readonly document = inject(DOCUMENT);
  /** What had focus when the dialog opened (e.g. the New Task button), to give focus back. */
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => {
        if (open) {
          this.opener = this.document.activeElement as HTMLElement | null;
        } else {
          this.opener?.focus();
          this.opener = null;
        }
      });
    });
  }

  protected async save(draft: TaskDraft): Promise<void> {
    this.failed.set(false);
    const id = this.store.editId();
    const result =
      id === null ? await this.store.create(draft) : await this.store.update({ id, draft });
    this.failed.set(result.status === 'error');
  }

  protected cancel(): void {
    this.failed.set(false);
    this.store.cancelEdit();
  }
}
