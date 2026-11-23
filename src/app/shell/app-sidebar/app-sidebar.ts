import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

/** Navigation on the left. Calendar, Team and Settings have no feature yet and stay disabled. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.open]': 'open()' },
  styleUrl: './app-sidebar.scss',
  templateUrl: './app-sidebar.html',
})
export class AppSidebar {
  /** On small screens the sidebar is a drawer. This is whether it is open. */
  readonly open = input(false);
}
