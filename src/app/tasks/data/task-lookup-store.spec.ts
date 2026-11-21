import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Assignee } from './task';
import { TaskLookupStore } from './task-lookup-store';

const USERS: Assignee[] = [
  { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' },
  { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 'sarah.smith@company.com' },
];

describe('TaskLookupStore', () => {
  let store: InstanceType<typeof TaskLookupStore>;
  let http: HttpTestingController;

  /** Waits until the resource has applied the flushed response. */
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TaskLookupStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts with an empty list while loading', () => {
    TestBed.tick();

    expect(store.assigneesValue()).toEqual([]);
    expect(store.assigneesIsLoading()).toBe(true);
    http.expectOne('/api/users');
  });

  it('exposes the loaded assignees', async () => {
    TestBed.tick();
    http.expectOne('/api/users').flush(USERS);
    await settle();

    expect(store.assigneesValue()).toEqual(USERS);
    expect(store.assigneesIsLoading()).toBe(false);
  });

  it('keeps the previous assignees when a reload fails', async () => {
    TestBed.tick();
    http.expectOne('/api/users').flush(USERS);
    await settle();

    store.reload();
    TestBed.tick();
    http.expectOne('/api/users').flush('boom', { status: 500, statusText: 'Server Error' });
    await settle();

    expect(store.assigneesError()).toBeDefined();
    expect(store.assigneesValue()).toEqual(USERS);
  });
});
