import { FormControl } from '@angular/forms';
import { dueDateNotInPast } from './task-validators';

describe('dueDateNotInPast', () => {
  const validate = (value: string) => dueDateNotInPast(() => '2026-11-21')(new FormControl(value));

  it('rejects a date before today', () => {
    expect(validate('2026-11-20')).toEqual({ dueDateInPast: true });
  });

  it('accepts today and later dates', () => {
    expect(validate('2026-11-21')).toBeNull();
    expect(validate('2026-12-01')).toBeNull();
  });

  it('accepts an empty value so that a required validator can report it instead', () => {
    expect(validate('')).toBeNull();
  });
});
