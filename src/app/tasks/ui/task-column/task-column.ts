import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Skeleton } from 'primeng/skeleton';
import { Task, TaskStatus } from '../../data/task';
import { Move } from '../../util/task-order';
import { TaskCard } from '../task-card/task-card';

@Component({
  selector: 'app-task-column',
  imports: [CdkDrag, CdkDropList, Skeleton, TaskCard, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './task-column.scss',
  templateUrl: './task-column.html',
})
export class TaskColumn {
  readonly label = input.required<string>();
  /** The status of the tasks this column holds. A card dropped here gets it. */
  readonly status = input.required<TaskStatus>();
  /** The tasks to show, in the order to show them. */
  readonly tasks = input.required<Task[]>();
  /** Today's date as `YYYY-MM-DD`. */
  readonly today = input.required<string>();
  /** While `true`, grey placeholders stand in for the cards. */
  readonly loading = input(false);

  /** While `false`, cards cannot be dragged, for example while a move is being saved. */
  readonly draggable = input(true);

  protected readonly placeholders = [1, 2, 3];

  readonly edit = output<Task>();
  readonly remove = output<Task>();
  /** A card was dropped on this column. The parent decides what that means. */
  readonly moved = output<Move>();

  protected drop(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    this.moved.emit({
      taskId: event.item.data.id,
      to: event.container.data,
      index: event.currentIndex,
    });
  }
}
