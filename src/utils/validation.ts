/**
 * Validates a user's age.
 * Must be between 18 and 99.
 */
export function validateAge(age: number | string): string | null {
  const numAge = Number(age);
  if (!age || isNaN(numAge) || numAge < 18 || numAge > 99) {
    return 'Please enter a valid age (18–99).';
  }
  return null;
}

/**
 * Validates a full name.
 */
export function validateFullName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Full name is required.';
  }
  if (name.trim().length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  return null;
}

/**
 * Validates a move-in date.
 * Must not be in the past.
 */
export function validateMoveInDate(date: string): string | null {
  if (!date) {
    return 'Move-in date is required.';
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return 'Move-in date cannot be in the past.';
  }
  return null;
}

/**
 * Validates budget range.
 */
export function validateBudget(min: number, max: number): string | null {
  if (min < 0 || max < 0) {
    return 'Budget cannot be negative.';
  }
  if (min > max) {
    return 'Minimum budget cannot be greater than maximum budget.';
  }
  return null;
}
