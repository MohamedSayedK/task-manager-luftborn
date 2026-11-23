import { Routes } from '@angular/router';

/**
 * Route data `search: true` marks a screen with a task board, so the header shows its search
 * box there. The `q` and `new` query parameters reach the screens as inputs. A route `title` is a
 * message key: the heading and the document title translate it.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'screens.dashboard',
    data: { search: true },
    loadComponent: () =>
      import('./feature-pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'tasks',
    title: 'screens.tasks',
    data: { search: true },
    loadComponent: () => import('./feature-pages/tasks-page/tasks-page').then((m) => m.TasksPage),
  },
  {
    path: 'analytics',
    title: 'screens.analytics',
    loadComponent: () =>
      import('./feature-pages/analytics-page/analytics-page').then((m) => m.AnalyticsPage),
  },
];
