import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MenuItem } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { Tag } from 'primeng/tag';
import { Task, TaskPriority } from '../data/task';
import { completedLabel, dueLabel, isOverdue } from '../util/task-due';

type TagSeverity = 'danger' | 'warn' | 'success';

const PRIORITIES: Record<TaskPriority, { labelKey: string; severity: TagSeverity }> = {
  high: { labelKey: 'common.priority.high', severity: 'danger' },
  medium: { labelKey: 'common.priority.medium', severity: 'warn' },
  low: { labelKey: 'common.priority.low', severity: 'success' },
};

@Component({
  selector: 'app-task-card',
  imports: [Avatar, Button, Menu, Tag, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './task-card.scss',
  templateUrl: './task-card.html',
})
export class TaskCard {
  readonly task = input.required<Task>();
  /** Today's date as `YYYY-MM-DD`, used to work out the due label and overdue state. */
  readonly today = input.required<string>();

  readonly edit = output<void>();
  readonly remove = output<void>();

  private readonly transloco = inject(TranslocoService);
  private readonly editLabel = toSignal(this.transloco.selectTranslate('common.edit'));
  private readonly deleteLabel = toSignal(this.transloco.selectTranslate('common.delete'));

  protected readonly actions = computed<MenuItem[]>(() => [
    { label: this.editLabel(), icon: 'pi pi-pencil', command: () => this.edit.emit() },
    { label: this.deleteLabel(), icon: 'pi pi-trash', command: () => this.remove.emit() },
  ]);

  protected readonly priority = computed(() => PRIORITIES[this.task().priority]);
  protected readonly firstName = computed(() => this.task().assignee.name.split(' ')[0]);
  protected readonly overdue = computed(() => isOverdue(this.task(), this.today()));
  /** "Due in 3 days" or "Overdue by 1 day" while open, "Completed today" once done. */
  protected readonly dueText = computed(
    () => dueLabel(this.task(), this.today()) ?? completedLabel(this.task(), this.today()),
  );
  protected readonly statusIcon = computed(() => {
    if (this.overdue()) {
      return 'pi pi-exclamation-triangle';
    }
    return this.task().status === 'done' ? 'pi pi-check-circle' : 'pi pi-calendar';
  });
}
