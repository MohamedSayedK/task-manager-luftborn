import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Skeleton } from 'primeng/skeleton';
import { Task, TaskStatus } from '../data/task';
import { Move } from '../util/task-order';
import { TaskCard } from './task-card';

@Component({
  selector: 'app-task-column',
  imports: [CdkDrag, CdkDropList, Skeleton, TaskCard, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 0.75rem;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--app-border);
    }

    h2 {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--app-text-secondary);
    }

    .count {
      min-width: 1.5rem;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      background: var(--app-border);
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
      color: var(--app-text-secondary);
    }

    // Tall enough that an empty column is still a place to drop a card.
    .cards {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 5rem;
      border-radius: 0.5rem;
    }

    // Another column's card is being dragged: show where it can go.
    .cards.cdk-drop-list-receiving {
      outline: 2px dashed var(--p-primary-color);
      outline-offset: 0.25rem;
    }

    // An empty column says so, and stays a place to drop a card.
    .empty {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 1.5rem 1rem;
      border: 1px dashed var(--app-border);
      border-radius: 0.5rem;
      text-align: center;
      color: var(--app-text-muted);
      animation: app-fade-in 300ms ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .empty {
        animation: none;
      }
    }

    .empty i {
      margin-block-end: 0.25rem;
      font-size: 1.5rem;
    }

    .empty p {
      margin: 0;
      font-size: 0.8125rem;
    }

    .empty-title {
      font-weight: 600;
      color: var(--app-text-secondary);
    }

    app-task-card {
      cursor: grab;
    }

    app-task-card.cdk-drag-disabled {
      cursor: default;
    }
  `,
  template: `
    <section [attr.aria-label]="label()" [attr.aria-busy]="loading() || null">
      <header>
        <h2>{{ label() }}</h2>
        @if (!loading()) {
          <span class="count">
            {{ tasks().length
            }}<span class="sr-only">
              {{ 'board.taskWord' | transloco: { count: tasks().length } }}</span
            >
          </span>
        }
      </header>
      <div
        class="cards"
        cdkDropList
        [cdkDropListData]="status()"
        [cdkDropListDisabled]="loading() || !draggable()"
        (cdkDropListDropped)="drop($event)"
      >
        @if (loading()) {
          @for (placeholder of placeholders; track placeholder) {
            <p-skeleton height="9rem" borderRadius="0.5rem" />
          }
        } @else if (tasks().length === 0) {
          <div class="empty">
            <i class="pi pi-inbox" aria-hidden="true"></i>
            <p class="empty-title">{{ 'board.emptyColumn' | transloco }}</p>
            <p class="empty-hint">{{ 'board.emptyColumnHint' | transloco }}</p>
          </div>
        }
        @for (task of tasks(); track task.id) {
          <app-task-card
            cdkDrag
            [cdkDragData]="task"
            [cdkDragDisabled]="!draggable()"
            [cdkDragStartDelay]="{ touch: 250, mouse: 0 }"
            [task]="task"
            [today]="today()"
            (edit)="edit.emit(task)"
            (remove)="remove.emit(task)"
          />
        }
      </div>
    </section>
  `,
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
