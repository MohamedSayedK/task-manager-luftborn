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
  styles: `
    :host {
      display: block;
      animation: app-rise-in 220ms ease-out;
    }

    article {
      transition:
        box-shadow 150ms ease,
        border-color 150ms ease;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 0.5rem;
    }

    article:hover {
      box-shadow: 0 0.125rem 0.5rem rgb(0 0 0 / 0.1);
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }

      article {
        transition: none;
      }
    }

    article.overdue {
      background: var(--app-error-bg);
      border-color: var(--app-error-border);
      border-inline-start: 4px solid var(--app-error-accent);
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    p-tag {
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--app-text);
    }

    p {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--app-text-muted);
    }

    .status {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--app-text-muted);
    }

    .done .status {
      color: var(--app-positive-text);
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    // A tag is a pill, so it stands out from the description above it.
    .tags span {
      padding: 0.125rem 0.625rem;
      border: 1px solid var(--app-tag-border);
      border-radius: 999px;
      background: var(--app-tag-bg);
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.25rem;
      color: var(--app-tag-text);
    }

    footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--app-border);
      font-size: 0.8125rem;
      color: var(--app-text-secondary);
    }

    .overdue footer {
      border-top-color: var(--app-error-border);
    }

    p-avatar {
      --p-avatar-width: 1.75rem;
      --p-avatar-height: 1.75rem;
      --p-avatar-font-size: 0.6875rem;
      --p-avatar-background: var(--p-blue-700);
      --p-avatar-color: #ffffff;
      font-weight: 700;
    }
  `,
  template: `
    <article [class.overdue]="overdue()" [class.done]="task().status === 'done'">
      <div class="head">
        <p-tag [value]="priority().labelKey | transloco" [severity]="priority().severity" />
        <p-button
          icon="pi pi-ellipsis-v"
          severity="secondary"
          size="small"
          [text]="true"
          [rounded]="true"
          [ariaLabel]="'card.actions' | transloco: { title: task().title }"
          (onClick)="menu.toggle($event)"
        />
        <p-menu #menu [popup]="true" [model]="actions()" appendTo="main" />
      </div>
      <h3>{{ task().title }}</h3>
      <p>{{ task().description }}</p>
      @if (dueText(); as text) {
        <span class="status">
          <i [class]="statusIcon()" aria-hidden="true"></i>
          {{ text.key | transloco: text.params }}
        </span>
      }
      @if (task().tags.length > 0) {
        <div class="tags">
          @for (tag of task().tags; track tag) {
            <span>{{ tag }}</span>
          }
        </div>
      }
      <footer>
        <p-avatar [label]="task().assignee.avatar" shape="circle" aria-hidden="true" />
        <span [attr.title]="task().assignee.name"
          ><bdi>@{{ firstName() }}</bdi></span
        >
      </footer>
    </article>
  `,
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
