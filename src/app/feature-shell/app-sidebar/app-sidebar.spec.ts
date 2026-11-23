import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppSidebar } from './app-sidebar';

@Component({ template: '' })
class Screen {}

describe('AppSidebar', () => {
  async function open(url: string): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const sidebar = TestBed.createComponent(AppSidebar);
    sidebar.detectChanges();
    await sidebar.whenStable();
    sidebar.detectChanges();
    return sidebar.nativeElement;
  }

  const link = (root: HTMLElement, name: string) =>
    Array.from(root.querySelectorAll<HTMLAnchorElement>('a')).find(
      (item) => item.textContent?.trim() === name,
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Screen },
          { path: 'tasks', component: Screen },
          { path: 'analytics', component: Screen },
        ]),
      ],
    });
  });

  it('links to the dashboard, the tasks and the analytics', async () => {
    const root = await open('/');

    expect(link(root, 'Dashboard')?.getAttribute('href')).toBe('/');
    expect(link(root, 'Tasks')?.getAttribute('href')).toBe('/tasks');
    expect(link(root, 'Analytics')?.getAttribute('href')).toBe('/analytics');
  });

  it('marks the current screen', async () => {
    const root = await open('/tasks');

    expect(link(root, 'Tasks')?.getAttribute('aria-current')).toBe('page');
    expect(link(root, 'Dashboard')?.getAttribute('aria-current')).toBeNull();
  });

  it('shows Calendar, Team and Settings as unavailable instead of linking nowhere', async () => {
    const root = await open('/');

    for (const name of ['Calendar', 'Team', 'Settings']) {
      expect(link(root, name)).toBeUndefined();
      const item = Array.from(root.querySelectorAll('[aria-disabled="true"]')).find((element) =>
        element.textContent?.includes(name),
      );
      expect(item).toBeDefined();
    }
  });

  it('writes the navigation in Arabic when that language is active', async () => {
    TestBed.inject(TranslocoService).setActiveLang('ar');
    const root = await open('/');

    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('التنقل الرئيسي');
    expect(link(root, 'لوحة التحكم')?.getAttribute('href')).toBe('/');
    expect(link(root, 'المهام')?.getAttribute('href')).toBe('/tasks');
    expect(link(root, 'التحليلات')?.getAttribute('href')).toBe('/analytics');
    expect(link(root, 'مهمة جديدة')?.getAttribute('href')).toBe('/tasks?newTask=true');
    const disabled = Array.from(root.querySelectorAll('[aria-disabled="true"]')).map((item) =>
      item.textContent?.trim(),
    );
    expect(disabled).toEqual(['التقويمقريبًا', 'الفريققريبًا', 'الإعداداتقريبًا']);
  });

  it('keeps the search term when switching between screens with a board', async () => {
    const root = await open('/tasks?q=api');

    expect(link(root, 'Dashboard')?.getAttribute('href')).toBe('/?q=api');
    expect(link(root, 'Tasks')?.getAttribute('href')).toBe('/tasks?q=api');
  });

  it('has a New Task link that opens the create dialog on the tasks screen', async () => {
    const root = await open('/analytics');

    expect(link(root, 'New Task')?.getAttribute('href')).toBe('/tasks?newTask=true');
  });
});
