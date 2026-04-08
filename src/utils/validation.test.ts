import { describe, it, expect } from 'vitest';
import { validateAge, validateFullName, validateMoveInDate, validateBudget } from './validation';

describe('Validation Utilities', () => {
  describe('validateAge', () => {
    it('should return null for valid age', () => {
      expect(validateAge(25)).toBeNull();
      expect(validateAge('25')).toBeNull();
      expect(validateAge(18)).toBeNull();
      expect(validateAge(99)).toBeNull();
    });

    it('should return error message for invalid age', () => {
      expect(validateAge(17)).toBeDefined();
      expect(validateAge(100)).toBeDefined();
      expect(validateAge('abc')).toBeDefined();
      expect(validateAge('')).toBeDefined();
    });
  });

  describe('validateFullName', () => {
    it('should return null for valid names', () => {
      expect(validateFullName('John Doe')).toBeNull();
    });

    it('should return error for empty or short names', () => {
      expect(validateFullName('')).toBeDefined();
      expect(validateFullName(' ')).toBeDefined();
      expect(validateFullName('A')).toBeDefined();
    });
  });

  describe('validateMoveInDate', () => {
    it('should return null for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const dateStr = future.toISOString().split('T')[0];
      expect(validateMoveInDate(dateStr)).toBeNull();
    });

    it('should return error for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      const dateStr = past.toISOString().split('T')[0];
      expect(validateMoveInDate(dateStr)).toBeDefined();
    });
  });

  describe('validateBudget', () => {
    it('should return null for valid range', () => {
      expect(validateBudget(500, 1000)).toBeNull();
      expect(validateBudget(0, 0)).toBeNull();
    });

    it('should return error for invalid range or negative values', () => {
      expect(validateBudget(1000, 500)).toBeDefined();
      expect(validateBudget(-100, 500)).toBeDefined();
    });
  });
});
