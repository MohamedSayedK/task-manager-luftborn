import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Subject, switchMap } from 'rxjs';

/**
 * Sets the browser tab title from a route `title`, which is a message key. The title is written
 * again when the language changes, once that language's texts are loaded.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);
  private readonly keys = new Subject<string>();

  constructor() {
    super();
    this.keys
      .pipe(
        switchMap((key) => this.transloco.selectTranslate(key)),
        takeUntilDestroyed(),
      )
      .subscribe((text) => this.title.setTitle(text));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot);
    if (key) {
      this.keys.next(key);
    }
  }
}
