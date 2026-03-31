import type { ValidationResult } from "../types/calendar";

export const createValidationResult = (
  errors: string[] = [],
  warnings: string[] = [],
): ValidationResult => ({
  valid: errors.length === 0,
  errors,
  warnings,
});

export const mergeValidationResults = (
  ...results: ValidationResult[]
): ValidationResult =>
  createValidationResult(
    results.flatMap((result) => result.errors),
    results.flatMap((result) => result.warnings),
  );
