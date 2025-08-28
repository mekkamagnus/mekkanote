# Spec: Server Initialization

## High Level Objectives

**Server Initialization:**
As a developer, I want the server to properly initialize the application before starting, so that data directories are created and the application can persist notes to the filesystem.

## Low-level Objectives

- **Server Initialization:**
  - Call AppService.initialize() before Deno.serve()
  - Create required data directories (notes/, folders/, attachments/)
  - Handle initialization errors gracefully
  - Provide clear startup logging
- **Testing:**
  - Verify directory creation on successful initialization
  - Test error handling for permission issues
  - Ensure backward compatibility with mock data fallback

## 1. Overview
This specification covers proper server initialization in MekkaNote to ensure the application creates necessary data directories and can persist notes to the filesystem instead of using mock data.

## 2. Core Concepts

### 2.1 User Experience
- **Transparent Initialization:** Users should see clear startup messages indicating initialization progress
- **Error Handling:** Clear error messages if initialization fails due to permission issues
- **Persistence:** Notes should be properly saved to the filesystem after initialization

### 2.2 Backend Logic
- **Initialization Sequence:** AppService.initialize() must complete before server startup
- **Directory Creation:** Recursive creation of data directories with proper permissions
- **Dependency Injection:** Proper setup of file system and cache adapters
- **Error Propagation:** Graceful handling and reporting of initialization failures

## 3. Implementation Details

### 3.1 Backend (src/main.ts)
- Replace current simple server startup with proper initialization sequence
- Import required dependencies: createFileSystemAdapter, createCacheAdapter
- Implement async initialization function with error handling
- Add comprehensive logging for initialization steps
- Ensure server only starts after successful initialization

### 3.2 Configuration (implicit)
- Use ./mekkanote-data as default base path
- Require --allow-read --allow-write Deno permissions
- Support both development and production environments

## 4. Testing Strategy

- **Manual Testing (initialization):**
  - Verify console output shows initialization steps
  - Check that ./mekkanote-data/ directory structure exists
  - Test note creation via API to verify persistence
- **Manual Testing (error handling):**
  - Test permission denied scenarios
  - Verify graceful exit with clear error messages
- **Automated Testing (future):**
  - Unit tests for initialization sequence
  - Integration tests for directory creation

## 5. Benefits

- **Data Persistence:** Notes are properly saved to filesystem instead of using mock data
- **Professional Setup:** Proper application initialization follows production best practices
- **Error Resilience:** Clear error handling prevents silent failures
- **Developer Experience:** Comprehensive logging helps with debugging

## 6. File Structure

```
.
├── specs/
│   └── server-initialization-spec.md  # This document
├── src/
│   └── main.ts                        # Modified
└── test/
    └── server-init.test.ts            # New (future)
```

## 7. Affected Files

- **Modified Files:**
  - `src/main.ts`
- **Dependencies:**
  - `src/services/AppService.ts`
  - `src/services/FileSystemAdapter.ts` 
  - `src/services/CacheAdapter.ts`

## Usage Instructions

1. Implement the initialization sequence in src/main.ts
2. Add proper error handling and logging
3. Test with deno run --allow-net --allow-read --allow-write src/main.ts
4. Verify directory creation and note persistence