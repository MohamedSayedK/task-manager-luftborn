import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { TaskDetailStore } from '../../tasks/data/task-detail-store';
import { TaskEdit } from '../../tasks/feature-edit/task-edit/task-edit';
import { TaskSearch } from '../../tasks/feature-search/task-search/task-search';

/**
 * The tasks screen. Features may not import each other, so this page at the app root puts the
 * board and the create/edit dialog side by side. They talk through `TaskDetailStore`.
 *
 * The router feeds two query parameters in: `q` is the search term from the header, and
 * `newTask=true` (from the sidebar button) opens the create dialog once.
 */
@Component({
  selector: 'app-tasks-page',
  imports: [TaskSearch, TaskEdit],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks-page.html',
})
export class TasksPage {
  private readonly detail = inject(TaskDetailStore);
  private readonly router = inject(Router);

  readonly q = input('');
  readonly newTask = input<string>();

  constructor() {
    effect(() => {
      if (this.newTask() === 'true') {
        untracked(() => {
          this.detail.startCreate();
          void this.router.navigate([], {
            queryParams: { newTask: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        });
      }
    });
  }
}
