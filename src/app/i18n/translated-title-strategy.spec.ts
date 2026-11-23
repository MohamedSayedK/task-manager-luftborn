import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { TranslatedTitleStrategy } from './translated-title-strategy';

@Component({ template: '' })
class Screen {}

describe('TranslatedTitleStrategy', () => {
  beforeEach(() => {
    document.title = '';
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'tasks', component: Screen, title: 'screens.tasks' },
          { path: 'analytics', component: Screen, title: 'screens.analytics' },
        ]),
        { provide: TitleStrategy, useExisting: TranslatedTitleStrategy },
      ],
    });
  });

  async function open(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
  }

  it('sets the document title to the translated title of the screen', async () => {
    await open('/tasks');

    expect(document.title).toBe('Tasks');
  });

  it('translates the title again when the language changes', async () => {
    await open('/tasks');

    TestBed.inject(TranslocoService).setActiveLang('ar');
    await vi.waitFor(() => expect(document.title).toBe('المهام'));
  });

  it('follows the screen to the next title', async () => {
    await open('/tasks');
    await open('/analytics');

    expect(document.title).toBe('Analytics');
  });
});
