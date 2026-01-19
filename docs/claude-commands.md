# Claude Code Slash Commands: Complete Guide

This guide explains how to create custom slash commands in Claude Code. It's designed for both AI agents and developers who want to extend Claude Code's functionality with reusable, parameterized commands.

## Table of Contents

1. [Introduction](#introduction)
2. [Command Structure](#command-structure)
3. [Creating Your First Command](#creating-your-first-command)
4. [Working with Arguments](#working-with-arguments)
5. [Command Examples](#command-examples)
6. [Best Practices](#best-practices)
7. [Advanced Patterns](#advanced-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

Claude Code slash commands are reusable prompts stored as Markdown files that you can invoke with a simple syntax. They allow you to:

- **Automate repetitive tasks** with consistent prompts
- **Standardize workflows** across your team
- **Create parameterized commands** for flexible operations
- **Build complex workflows** from simple building blocks

### Basic Syntax

Commands are invoked using:
```
/commandname
/commandname "argument1" "argument2"
```

Each command corresponds to a Markdown file in the `.claude/commands/` directory.

---

## Command Structure

### Directory Layout

```
your-project/
├── .claude/
│   └── commands/
│       ├── commit.md
│       ├── test.md
│       └── review.md
└── ...
```

### File Naming Rules

1. **Filename becomes command name**: `commit.md` → `/commit`
2. **Use lowercase letters**: `my-command.md` → `/my-command`
3. **Use hyphens for spaces**: `code-review.md` → `/code-review`
4. **Underscores work too**: `code_review.md` → `/code_review`

### Command File Structure

Each command file is a Markdown document that:

1. **Describes what the command does** (for AI understanding)
2. **Provides instructions to Claude** (the actual prompt)
3. **May include `$ARGUMENTS`** placeholder for parameters
4. **Can reference files** using `@file.md` syntax

Example structure:
```markdown
# Command Name

Brief description of what this command does.

## Instructions

Step-by-step instructions for Claude to follow when this command is invoked.

## Notes

Any additional context, constraints, or considerations.
```

---

## Creating Your First Command

### Step 1: Create the Commands Directory

```bash
mkdir -p .claude/commands
```

### Step 2: Create a Simple Command

Create `.claude/commands/greet.md`:

```markdown
# Greet the User

Greet the user in a friendly and professional manner.

## Instructions

1. Say hello to the user
2. Ask how you can help them today
3. Be concise but warm

## Notes

- Keep the greeting brief (1-2 sentences)
- Maintain a professional yet approachable tone
```

### Step 3: Use the Command

In Claude Code, simply type:
```
/greet
```

---

## Working with Arguments

### The `$ARGUMENTS` Keyword

The `$ARGUMENTS` keyword is a special placeholder that captures parameters passed to your command.

### Basic Argument Syntax

```markdown
# Process Item

Process the following item: $ARGUMENTS

## Instructions

1. Read the provided item
2. Analyze it carefully
3. Provide your assessment
```

Usage: `/process "analyze the user authentication flow"`

### Multiple Arguments

When multiple arguments are passed, `$ARGUMENTS` contains all of them as a single string.

```markdown
# Code Review

Review the following code: $ARGUMENTS

## Instructions

1. Check for bugs and issues
2. Suggest improvements
3. Verify best practices
```

Usage: `/review "fix the login bug" "add error handling"`

### Argument Validation

Always validate arguments before processing:

```markdown
# Create Feature

Create a new feature based on: $ARGUMENTS

## Instructions

1. Verify that $ARGUMENTS is provided and not empty
2. If no arguments provided, ask the user what feature they want to create
3. If arguments provided, proceed with feature creation
4. Follow these requirements:
   - Feature name: extracted from $ARGUMENTS
   - Implementation: follow project conventions
   - Tests: include unit and integration tests
```

---

## Command Examples

### Example 1: Simple Command (No Arguments)

**File:** `.claude/commands/status.md`

```markdown
# Check Status

Check the current status of the project.

## Instructions

1. Run `git status` to check for uncommitted changes
2. List any modified files
3. Check if there are any merge conflicts
4. Provide a summary of the repository state
```

**Usage:** `/status`

---

### Example 2: Command with Required Arguments

**File:** `.claude/commands/commit.md`

```markdown
# Create Commit

Create a git commit with the message: $ARGUMENTS

## Instructions

1. Check current git status with `git status`
2. Stage all changes with `git add .`
3. Create commit with the provided message
4. Use the commit message format: "$ARGUMENTS"
5. Show the commit hash after creation
6. Run `git status` again to confirm clean state

## Notes

- Always verify the commit message before creating the commit
- Include Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
```

**Usage:** `/commit "fix user authentication bug"`

---

### Example 3: Command with Optional Arguments

**File:** `.claude/commands/test.md`

```markdown
# Run Tests

Run tests for the project$ARGUMENTS

## Instructions

1. If no arguments provided, run all tests:
   - Execute `bun run test` or `npm test`
   - Show the test output summary
2. If arguments provided (e.g., specific file or pattern):
   - Run tests only for the specified file/pattern
   - Show detailed output for those tests

## Examples

- `/test` - Run all tests
- `/test auth` - Run authentication tests
- `/test UserService.test.ts` - Run specific test file

## Notes

- Always show test results summary
- Report any failures with details
- Suggest fixes for common test failures
```

**Usage:**
- `/test` - Run all tests
- `/test "UserService.test.ts"` - Run specific file

---

### Example 4: Command with Validation

**File:** `.claude/commands/fix.md`

```markdown
# Fix Issue

Fix the following issue: $ARGUMENTS

## Instructions

1. **Validate Input:**
   - If $ARGUMENTS is empty or not provided, ask: "What issue would you like me to fix?"
   - If $ARGUMENTS is provided, proceed with step 2

2. **Understand the Issue:**
   - Read the issue description carefully
   - Identify the root cause
   - Determine the scope of changes needed

3. **Implement Fix:**
   - Create a new branch: `fix/issue-description`
   - Make the necessary code changes
   - Test the fix thoroughly
   - Commit changes with descriptive message

4. **Verify:**
   - Run tests to ensure no regressions
   - Check that the fix resolves the issue
   - Document any side effects

## Notes

- Always create a new branch before fixing issues
- Write tests for bug fixes when possible
- Include before/after descriptions in commit messages
```

**Usage:** `/fix "login fails for users with special characters in password"`

---

### Example 5: Multi-Step Workflow Command

**File:** `.claude/commands/feature.md`

```markdown
# Create Feature

Implement a new feature: $ARGUMENTS

## Instructions

### Phase 1: Planning

1. **Validate Input:**
   - If $ARGUMENTS is empty, ask: "What feature would you like me to create?"
   - If provided, extract: feature name, requirements, acceptance criteria

2. **Research:**
   - Search for similar features in the codebase
   - Identify patterns and conventions to follow
   - List files that need to be modified

### Phase 2: Implementation

3. **Create Branch:**
   - Run: `git checkout -b feature/feature-name`
   - Use the feature name from $ARGUMENTS

4. **Implementation:**
   - Create/update necessary files
   - Follow existing code patterns
   - Include error handling
   - Add type definitions

### Phase 3: Testing

5. **Tests:**
   - Write unit tests for new functionality
   - Write integration tests
   - Ensure all tests pass

6. **Documentation:**
   - Update relevant documentation
   - Add code comments for complex logic
   - Create/update README if needed

### Phase 4: Commit

7. **Create Spec File:**
   - Create `specs/XXX-feature-name.md` with detailed plan

8. **Commit:**
   - Stage changes: `git add .`
   - Commit with message: "feat: feature-name"
   - Include Co-Authored-By

## Notes

- Always use TypeScript strict mode
- Follow the project's code style guide
- Run linter before committing
- Test on both development and production scenarios
```

**Usage:** `/feature "add user authentication with OAuth2"`

---

### Example 6: Command with File References

**File:** `.claude/commands/review-pr.md`

```markdown
# Review Pull Request

Review a pull request based on @pr-guidelines.md

PR Description: $ARGUMENTS

## Instructions

1. **Read PR Guidelines:**
   - Reference @pr-guidelines.md for review criteria
   - Understand the review checklist

2. **Analyze Changes:**
   - Review $ARGUMENTS to understand PR context
   - Check the diff for modified files
   - Verify the changes align with guidelines

3. **Provide Review:**
   - List approval criteria that pass
   - List any issues or concerns
   - Suggest improvements if needed
   - Overall assessment (approve/request changes)

## Notes

- Be constructive and specific in feedback
- Reference code lines when pointing out issues
- Consider both functionality and code quality
```

**Usage:** `/review-pr "Add dark mode support to UI components"`

---

## Best Practices

### 1. Command Naming

**DO:**
- Use descriptive, action-oriented names: `test`, `commit`, `deploy`
- Use hyphens for multi-word commands: `code-review`, `run-tests`
- Keep names short and memorable

**DON'T:**
- Use overly generic names: `do`, `run`, `execute`
- Use special characters (except hyphens/underscores)
- Make names too long: `perform-comprehensive-code-review-of-all-changes`

### 2. Command Description

Every command should start with a clear description:

```markdown
# Command Name

One-sentence description of what this command does and when to use it.

## Instructions
...
```

### 3. Argument Handling

**Always validate arguments:**

```markdown
# Good: With validation
## Instructions
1. Check if $ARGUMENTS is provided
2. If empty, ask user for input
3. If provided, process the input

# Bad: No validation
## Instructions
1. Process $ARGUMENTS (will fail if empty)
```

**Provide usage examples:**

```markdown
## Examples

- `/command` - Default behavior
- `/command "arg1"` - With argument
- `/command "arg1" "arg2"` - Multiple arguments
```

### 4. Security Considerations

**Critical Security Rules:**

1. **Never expose secrets** through command arguments
   - Don't pass API keys, passwords, or tokens via $ARGUMENTS
   - Use environment variables or secure configuration instead

2. **Sanitize input** before processing
   - Validate file paths to prevent directory traversal
   - Check argument types and ranges
   - Escape special characters when passing to shell commands

3. **Never log sensitive data**
   - Don't include $ARGUMENTS in commit messages if it might contain secrets
   - Be cautious with error messages that might leak information

**Example of secure command:**

```markdown
# Deploy

Deploy to environment: $ARGUMENTS

## Instructions

1. Validate that $ARGUMENTS is either "staging" or "production"
2. If invalid, show error and list valid environments
3. If valid, proceed with deployment
4. Use environment-specific config (never hardcode secrets)

## Security Notes

- Never pass API keys or secrets via command arguments
- Use secure environment variables for sensitive data
- Verify environment before deploying
```

### 5. Command Organization

Organize commands by scope:

```
.claude/
├── commands/
│   ├── git/
│   │   ├── commit.md
│   │   ├── push.md
│   │   └── branch.md
│   ├── test/
│   │   ├── unit.md
│   │   ├── integration.md
│   │   └── e2e.md
│   └── code/
│       ├── review.md
│       ├── refactor.md
│       └── document.md
```

### 6. Documentation within Commands

Include clear sections:

```markdown
# Command Name

Brief description.

## Context

When to use this command and what it accomplishes.

## Instructions

Step-by-step instructions for Claude.

## Examples

Example usage with different arguments.

## Notes

Important considerations, constraints, or warnings.
```

### 7. Error Handling

Design commands to handle errors gracefully:

```markdown
# Process Data

Process the data file: $ARGUMENTS

## Instructions

1. **Validate Input:**
   - Check if $ARGUMENTS is provided (error if not)
   - Check if file exists (error if not found)
   - Check if file is readable (error if permission denied)

2. **Error Messages:**
   - If validation fails, show helpful error message
   - Suggest how to fix the issue
   - Don't proceed if errors are found

3. **Processing:**
   - Only process if all validations pass
```

---

## Advanced Patterns

### Pattern 1: Conditional Logic

```markdown
# Optimize

Optimize the codebase$ARGUMENTS

## Instructions

1. **Check for Arguments:**
   - If $ARGUMENTS is empty: optimize entire codebase
   - If $ARGUMENTS contains file name: optimize only that file

2. **Optimization Steps:**
   - For entire codebase: run linter, check for unused code, update dependencies
   - For single file: check for optimizations specific to that file

3. **Report:**
   - List optimizations made
   - Show performance improvements
```

### Pattern 2: Interactive Commands

```markdown
# Configure

Configure project settings$ARGUMENTS

## Instructions

1. **If $ARGUMENTS provided:**
   - Apply the configuration directly
   - Example: `/configure "typescript:strict"`

2. **If $ARGUMENTS not provided:**
   - Ask user what they want to configure
   - Show available configuration options
   - Guide them through the configuration process

## Configuration Options

- TypeScript strict mode: "typescript:strict"
- Enable tests: "tests:on"
- Set port: "port:3000"
```

### Pattern 3: Chain Commands

Commands can reference other commands:

```markdown
# CI Pipeline

Run full CI pipeline$ARGUMENTS

## Instructions

1. First, run `/test` to execute all tests
2. Then, run `/lint` to check code quality
3. Then, run `/build` to verify production build
4. If all pass, run `/deploy "staging"`
5. Report overall pipeline status

## Notes

- Stop pipeline if any step fails
- Report which step failed and why
- Suggest fixes for common failures
```

### Pattern 4: File-Aware Commands

```markdown
# Analyze File

Analyze the specified file: $ARGUMENTS

## Instructions

1. **Get File Context:**
   - Read the file specified in $ARGUMENTS
   - Check file type and extension
   - Determine appropriate analysis based on file type

2. **Analysis:**
   - For `.ts` files: check TypeScript usage, types, interfaces
   - For `.tsx` files: check React patterns, component structure
   - For `.md` files: check documentation quality, formatting
   - For `.json` files: validate JSON structure and schema

3. **Report:**
   - Provide findings specific to file type
   - Suggest improvements
   - Note any issues or concerns
```

---

## Troubleshooting

### Command Not Found

**Problem:** Command doesn't work when invoked

**Solutions:**
1. Verify file exists in `.claude/commands/`
2. Check filename matches command name (case-sensitive)
3. Ensure file has `.md` extension
4. Restart Claude Code if recently added

### Arguments Not Working

**Problem:** `$ARGUMENTS` is empty or not being captured

**Solutions:**
1. Check that you're passing arguments after the command: `/command "args"`
2. Verify `$ARGUMENTS` is spelled correctly (all caps)
3. Add validation to check if arguments are provided
4. Use quotes around arguments with spaces

### Commands Too Long

**Problem:** Complex commands become hard to maintain

**Solutions:**
1. Break into smaller, focused commands
2. Use command chaining (Pattern 3)
3. Extract common logic into separate commands
4. Use file references (`@file.md`) to share content

### Performance Issues

**Problem:** Commands execute slowly

**Solutions:**
1. Add clear execution steps to avoid ambiguity
2. Specify exact commands to run (avoid vague instructions)
3. Add timeouts for long-running operations
4. Cache results when appropriate

---

## Sources and References

- [Slash commands - Claude Code Docs](https://code.claude.com/docs/en/slash-commands) - Official documentation
- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices) - Official Anthropic guide (April 18, 2025)
- [Claude Code Tips & Tricks: Custom Slash Commands](https://cloudartisan.com/posts/2025-04-14-claude-code-tips-slash-commands/) - Community guide (April 14, 2025)
- [How I Create Simple But Beautiful Reusable Claude Code Slash Commands](https://medium.com/@joe.njenga/how-i-create-simple-but-beautiful-reusable-claude-code-slash-commands-that-save-me-hours-a7682291664c) - Tutorial with examples
- [Collection of useful slash commands for Claude Code CLI](https://github.com/artemgetmann/claude-slash-commands) - GitHub repository with examples
- [How to Speed Up Your Claude Code Experience with Slash Commands](https://alexop.dev/posts/claude-code-slash-commands-guide/) - Technical guide (November 22, 2025)
- [Your complete guide to slash commands Claude Code](https://www.eesel.ai/blog/slash-commands-claude-code) - Comprehensive guide (September 8, 2025)
- [Claude Code CLI Cheatsheet](https://shipyard.build/blog/claude-code-cheat-sheet/) - Quick reference (August 17, 2025)
- [How I use Claude Code (+ my best tips)](https://www.builder.io/blog/claude-code) - Tips and tricks (July 11, 2025)
- [How to Create Custom Slash Commands in Claude Code](https://en.bioerrorlog.work/entry/claude-code-custom-slash-command) - Direct tutorial (September 18, 2025)

---

## Quick Reference

### Basic Command Template

```markdown
# Command Name

Brief description of what this command does.

## Instructions

1. First step
2. Second step
3. Third step

## Notes

Any important notes or constraints.
```

### Command with Arguments Template

```markdown
# Command Name

Description: $ARGUMENTS

## Instructions

1. Validate $ARGUMENTS is provided
2. Process the arguments
3. Provide output

## Examples

- `/command` - Default behavior
- `/command "arg1"` - With argument
```

### Common $ARGUMENTS Patterns

```markdown
# Check if provided
If $ARGUMENTS is empty or not provided:
  - Ask user for input
  - Show usage instructions

# File reference
Process file: $ARGUMENTS
- Check if file exists
- Read file contents
- Perform operation

# Multiple steps
Step 1: Use $ARGUMENTS
Step 2: Transform $ARGUMENTS
Step 3: Output result
```

---

## Summary

Claude Code slash commands are powerful tools for automating workflows and standardizing development practices. Key takeaways:

1. **Simple to create**: Just add Markdown files to `.claude/commands/`
2. **Flexible**: Support arguments via `$ARGUMENTS` keyword
3. **Composable**: Can chain and reference other commands
4. **Secure**: Follow security best practices when handling input
5. **Maintainable**: Use clear structure and documentation

For more examples and community contributions, check the [GitHub collection of slash commands](https://github.com/artemgetmann/claude-slash-commands).
