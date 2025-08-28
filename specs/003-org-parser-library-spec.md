# Spec: Org Parser Library

## High Level Objectives

**Org Parser Library:**
As a developer, I want to extract org-mode parsing and serialization logic into a dedicated library, so that I can maintain clean separation of concerns and enable reusable org-mode functionality across different storage backends.

**Type-Safe Org Document Model:**
As a developer, I want comprehensive TypeScript types for org-mode documents, so that I can have compile-time safety and better IDE support when working with org-mode structures.

## Low-level Objectives

- **Org Parser Library:**
  - Extract org-mode parsing logic from FileSystemManager into standalone library
  - Implement type-safe parser and serializer interfaces with comprehensive org-mode support
  - Support :PROPERTIES: blocks, document metadata, and hierarchical headlines
  - Provide UUID-based document identification and org-mode date formatting
- **MekkaNote Integration:**
  - Create adapter pattern for seamless integration with existing Note interface
  - Maintain backward compatibility with current FileSystemManager API
  - Support bidirectional conversion between Note and OrgDocument types
- **Testing:**
  - Unit tests for parser and serializer with comprehensive org-mode format coverage
  - Integration tests for MekkaNote adapter functionality
  - Property-based testing for round-trip parsing/serialization consistency

## 1. Overview

This specification covers the extraction of org-mode parsing and serialization functionality from the current FileSystemManager into a dedicated, reusable library. The library will provide type-safe parsing of org-mode documents with full support for :PROPERTIES: blocks, document metadata, hierarchical headlines, and standard org-mode conventions as required by the note storage troubleshooting specification.

## 2. Core Concepts

### 2.1 User Experience

- **Clean API:** Developers interact with simple parse/serialize methods that handle complex org-mode format details internally
- **Type Safety:** Full TypeScript support with comprehensive types for all org-mode document structures and properties
- **Backward Compatibility:** Existing MekkaNote functionality continues to work unchanged through adapter pattern integration

### 2.2 Backend Logic

- **Modular Architecture:** Separate parser, serializer, and utility modules with clear interface boundaries
- **Factory Pattern:** Centralized creation of parser and serializer instances with consistent configuration
- **Adapter Integration:** Clean integration layer that bridges org-mode library with MekkaNote's Note interface

## 3. Implementation Details

### 3.1 Frontend (types/org-types.ts)

- Define comprehensive TypeScript interfaces for OrgDocument, OrgHeadline, OrgMetadata, and OrgProperty structures
- Implement Map-based property storage for efficient key-value property management
- Support hierarchical headline structures with nested children and multiple property levels
- Provide strongly-typed status enums for TODO/DONE/NEXT headline states

### 3.2 Backend (parser/org-parser.ts, serializer/org-serializer.ts)

- Implement StandardOrgParser class with regex-based parsing for :PROPERTIES: blocks and document metadata
- Create StandardOrgSerializer class with proper org-mode format output including property block formatting
- Support hierarchical headline parsing with recursive children processing and proper indentation
- Handle org-mode date formats ([YYYY-MM-DD Weekday HH:MM]) with timezone-aware parsing

### 3.3 Database (integration/mekkanote-org-adapter.ts)

- Create MekkanoteOrgAdapter for bidirectional Note ↔ OrgDocument conversion with property preservation
- Maintain UUID-based note identification using crypto.randomUUID() with uppercase formatting
- Support automatic created/updated timestamp management with org-mode date format compliance
- Preserve existing FileSystemManager API surface through adapter pattern delegation

## 4. Testing Strategy

- **Unit Tests (test/org-parser.test.ts):**
  - Test :PROPERTIES: block parsing with various property types and edge cases
  - Test document metadata parsing (#+title, #+author, #+tags) with format validation
  - Test headline parsing with all status types, tags, and nested property structures
  - Test round-trip consistency (parse → serialize → parse) with property preservation
- **Integration Tests (test/mekkanote-adapter.test.ts):**
  - Test Note to OrgDocument conversion with metadata preservation and UUID handling
  - Test OrgDocument to Note conversion with proper property extraction and type coercion
  - Test adapter integration with FileSystemManager using real file system operations
- **Property-Based Tests (test/org-roundtrip.test.ts):**
  - Generate random org documents and verify parse/serialize consistency across all property types
  - Test edge cases with malformed properties blocks and recovery behavior
  - Validate date format parsing and serialization accuracy with timezone handling

## 5. Benefits

- **Separation of Concerns:** Clean extraction of org-mode logic from file system management enables better maintainability
- **Type Safety:** Comprehensive TypeScript types prevent runtime errors and improve developer experience with IntelliSense support
- **Reusability:** Standalone library can be used by other storage backends or org-mode tools beyond MekkaNote
- **Testability:** Isolated parsing logic enables comprehensive unit testing without file system dependencies
- **Standards Compliance:** Full org-mode format compliance ensures compatibility with standard org-mode tools and workflows

## 6. File Structure

```
.
├── src/
│   └── lib/
│       └── org/
│           ├── types/
│           │   └── org-types.ts           # New - TypeScript interfaces
│           ├── parser/
│           │   └── org-parser.ts          # New - Parsing implementation
│           ├── serializer/
│           │   └── org-serializer.ts      # New - Serialization implementation
│           ├── utils/
│           │   └── org-utils.ts           # New - Utility functions
│           ├── factory/
│           │   └── org-factory.ts         # New - Factory pattern
│           └── integration/
│               └── mekkanote-org-adapter.ts # New - MekkaNote integration
├── specs/
│   └── org-parser-library-spec.md        # This document
├── test/
│   ├── org-parser.test.ts                # New - Parser unit tests
│   ├── org-serializer.test.ts            # New - Serializer unit tests
│   ├── mekkanote-adapter.test.ts         # New - Integration tests
│   └── org-roundtrip.test.ts             # New - Property-based tests
└── utils/
    └── file_system_manager.ts             # Modified - Extract org logic to library
```

## 7. Affected Files

- **New Files:**
  - `src/lib/org/types/org-types.ts` - Core TypeScript interfaces for org-mode documents
  - `src/lib/org/parser/org-parser.ts` - Parser implementation with regex-based parsing
  - `src/lib/org/serializer/org-serializer.ts` - Serializer implementation with format compliance
  - `src/lib/org/utils/org-utils.ts` - Utility functions for UUID generation and date formatting
  - `src/lib/org/factory/org-factory.ts` - Factory pattern for parser/serializer creation
  - `src/lib/org/integration/mekkanote-org-adapter.ts` - MekkaNote integration adapter
  - `test/org-parser.test.ts` - Comprehensive parser unit tests
  - `test/org-serializer.test.ts` - Serializer unit tests with format validation
  - `test/mekkanote-adapter.test.ts` - Integration tests for adapter functionality
  - `test/org-roundtrip.test.ts` - Property-based tests for consistency validation
- **Modified Files:**
  - `utils/file_system_manager.ts` - Refactor to use org parser library through adapter pattern