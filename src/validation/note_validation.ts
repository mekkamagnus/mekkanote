// src/validation/note_validation.ts
import { Validation } from '../utils/validation.ts';
import { AppError } from '../../models/app_error.ts';

export class NoteValidation {
  static validateNoteContent(content: string): Validation<AppError, string> {
    const errors: AppError[] = [];

    if (!content || content.trim().length === 0) {
      errors.push(AppError.create('EMPTY_CONTENT', 'Note content cannot be empty'));
    }

    if (content.length > 10000) {
      errors.push(AppError.create('CONTENT_TOO_LONG', 'Note content exceeds maximum length of 10,000 characters'));
    }

    // Validate org-mode syntax basics
    const invalidHeadlines = this.validateHeadlines(content);
    errors.push(...invalidHeadlines);

    if (errors.length > 0) {
      return Validation.failure(errors);
    }

    return Validation.success(content);
  }

  static validateFilename(filename: string): Validation<AppError, string> {
    const errors: AppError[] = [];

    if (!filename || filename.trim().length === 0) {
      errors.push(AppError.create('EMPTY_FILENAME', 'Filename cannot be empty'));
    }

    if (!filename.endsWith('.org')) {
      errors.push(AppError.create('INVALID_EXTENSION', 'Filename must have .org extension'));
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      errors.push(AppError.create('INVALID_PATH', 'Filename cannot contain path traversal characters'));
    }

    if (errors.length > 0) {
      return Validation.failure(errors);
    }

    return Validation.success(filename);
  }

  private static validateHeadlines(content: string): AppError[] {
    const errors: AppError[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^\*+\s/)) {
        // Validate headline level (H1-H6)
        const asteriskCount = line.match(/^\*+/)?.[0]?.length || 0;
        if (asteriskCount > 6) {
          errors.push(AppError.create(
            'INVALID_HEADLINE_LEVEL', 
            `Headline at line ${i + 1} exceeds maximum level of 6`
          ));
        }

        // Validate headline content
        const headlineContent = line.replace(/^\*+\s+/, '');
        if (!headlineContent.trim()) {
          errors.push(AppError.create(
            'EMPTY_HEADLINE', 
            `Headline at line ${i + 1} cannot be empty`
          ));
        }
      }
    }

    return errors;
  }
}