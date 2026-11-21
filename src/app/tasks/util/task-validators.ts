import { ValidatorFn } from '@angular/forms';

/**
 * Rejects a due date before today. ISO dates (`YYYY-MM-DD`) compare correctly as strings.
 * An empty value is valid here; pair it with `Validators.required` to report it.
 *
 * @param today reads today's date as `YYYY-MM-DD` when the control is validated
 */
export function dueDateNotInPast(today: () => string): ValidatorFn {
  return (control) => {
    const value = control.value as string;
    return value && value < today() ? { dueDateInPast: true } : null;
  };
}
