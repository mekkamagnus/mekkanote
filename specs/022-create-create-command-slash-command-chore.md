# Chore: Create '/create-command' custom slash command

## Chore Description
Create a meta slash command `/create-command` that helps users create new Claude Code slash commands interactively. This command should:

1. Read and understand the `docs/claude-commands.md` documentation to guide the creation process
2. Support two modes:
   - **Interactive mode**: When called with no arguments (`/create-command`), ask the user a series of questions to gather all necessary information
   - **Direct mode**: When called with arguments (`/create-command "command-name" "description"`), use the provided information

The command should:
- Guide users through defining command name, description, instructions, examples, and notes
- Validate command names (lowercase, hyphens allowed)
- Create the `.claude/commands/` directory if it doesn't exist
- Generate properly formatted Markdown files following the structure documented in `docs/claude-commands.md`
- Support argument handling with `$ARGUMENTS` placeholder
- Include best practices and validation from the documentation
- Show a preview of the command before creating it
- Provide helpful feedback and next steps after creation

## Relevant Files
Use these files to resolve the chore:

- **docs/claude-commands.md**
  - Contains the complete guide on how to structure Claude Code slash commands
  - Provides templates, examples, and best practices
  - Includes information about argument handling with `$ARGUMENTS`
  - Documents security considerations and validation patterns
  - This is the source of truth for command structure

- **.claude/commands/create-command.md** (NEW FILE)
  - The meta command file to be created
  - Will contain the interactive prompt logic
  - Will reference `docs/claude-commands.md` using `@` syntax
  - Will guide users through command creation process

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create the .claude/commands directory structure

- Create `.claude/commands/` directory if it doesn't exist
- Verify the directory structure is in place
- Ensure proper permissions for writing command files

### Step 2: Design the command creation flow

- Define the questions to ask in interactive mode:
  1. Command name (what to type after `/`)
  2. Brief description (one sentence)
  3. Does it need arguments? (yes/no)
  4. If yes: argument description and usage examples
  5. Step-by-step instructions for Claude
  6. Any additional notes or constraints
  7. Usage examples (if arguments are used)

- Plan the validation logic:
  - Command name must be lowercase
  - Command name can contain hyphens and underscores only
  - Command name must be descriptive (not generic like "do" or "run")
  - Description should be clear and concise

### Step 3: Create the create-command.md file

- Create `.claude/commands/create-command.md` with the following structure:

```markdown
# Create Command

Create a new Claude Code slash command: $ARGUMENTS

## Instructions

### Phase 1: Understand the Request

1. **Read the Documentation:**
   - Reference @docs/claude-commands.md to understand command structure
   - Review templates and best practices
   - Understand argument handling patterns

2. **Determine Mode:**
   - If $ARGUMENTS is provided: Parse as direct mode (command name and description)
   - If $ARGUMENTS is empty: Enter interactive mode

### Phase 2: Interactive Mode (No Arguments)

If $ARGUMENTS is empty or not provided:

1. **Ask the following questions one at a time:**

   **Question 1:** What should the command be called?
   - This is what users will type after `/`
   - Example: `test`, `code-review`, `deploy-staging`
   - Must be lowercase, can use hyphens or underscores

   **Question 2:** What does this command do?
   - Provide a brief one-sentence description
   - Example: "Run all tests and show summary"

   **Question 3:** Does this command need arguments?
   - Yes: Users will pass information like `/command "argument"`
   - No: Command works without any input

   **Question 4:** (If yes to arguments) How should arguments be used?
   - Describe what the arguments represent
   - Example: "The arguments specify which test file to run"

   **Question 5:** What should Claude do when this command is invoked?
   - Provide step-by-step instructions
   - Be specific and actionable
   - Example: "1. Run bun test, 2. Check results, 3. Show summary"

   **Question 6:** (Optional) Any additional notes or constraints?
   - Security considerations
   - Prerequisites or dependencies
   - Common pitfalls to avoid

   **Question 7:** (Optional) Want to add usage examples?
   - Show how to use the command with different arguments
   - Example: `/test` runs all tests, `/test auth` runs auth tests

2. **Generate the Command File:**
   - Create `.claude/commands/{command-name}.md`
   - Use the structure from @docs/claude-commands.md
   - Include all sections: Command Name, Description, Instructions, Examples, Notes
   - Add `$ARGUMENTS` placeholder if the command uses arguments
   - Follow the templates from the documentation

3. **Show Preview:**
   - Display the generated command file content
   - Ask for confirmation before creating

4. **Create the File:**
   - If confirmed: Write the file to `.claude/commands/`
   - Show success message with usage example
   - Suggest testing the new command

### Phase 3: Direct Mode (With Arguments)

If $ARGUMENTS is provided:

1. **Parse Arguments:**
   - First argument: command name
   - Second argument (optional): description
   - Additional arguments (optional): usage context

2. **Validate Command Name:**
   - Check if lowercase
   - Check if only contains hyphens/underscores
   - If invalid, show error and ask for correction

3. **Gather Missing Information:**
   - If description not provided, ask for it
   - Ask for step-by-step instructions
   - Ask about argument requirements
   - Ask for additional notes

4. **Generate and Create:**
   - Generate the command file
   - Show preview
   - Create if confirmed

### Phase 4: Validation and Creation

Before creating any command file:

1. **Validate the Command:**
   - Command name is not empty
   - Command name follows naming rules (lowercase, hyphens/underscores)
   - Description is provided
   - Instructions are clear and actionable
   - File doesn't already exist (warn if it does)

2. **Check for Security Issues:**
   - Look for potential security risks in instructions
   - Warn about exposing secrets through arguments
   - Check for dangerous operations (delete, force push, etc.)
   - Add security notes if needed

3. **Create the Command File:**
   - Ensure `.claude/commands/` directory exists
   - Write the command file with proper Markdown structure
   - Use the template from @docs/claude-commands.md
   - Include all relevant sections

4. **Verify Creation:**
   - Confirm file was created successfully
   - Show the file path
   - Display usage example
   - Suggest testing the command

## Command Template Structure

When creating new commands, use this structure:

```markdown
# {Command Name}

{Brief description}

## Instructions

{Step-by-step instructions for Claude}

## Examples

- `/{command-name}` - {What it does}
- `/{command-name} "arg1"` - {What it does with argument}

## Notes

{Any additional notes or constraints}
```

## Notes

- Always reference @docs/claude-commands.md for the latest patterns
- Command names become the filename: `my-command.md` → `/my-command`
- Use `$ARGUMENTS` placeholder in commands that accept parameters
- Always validate command names before creating files
- Warn users if a command with the same name already exists
- Follow best practices from the documentation:
  - Use descriptive, action-oriented names
  - Include clear instructions
  - Add usage examples
  - Document any constraints or security considerations
- After creating a command, suggest testing it immediately
- Keep commands focused and simple
- Break complex commands into smaller, composable ones
```

### Step 4: Test the create-command functionality

- Test interactive mode by running `/create-command` with no arguments
- Verify all questions are asked in sequence
- Test direct mode with arguments
- Verify command file generation follows the correct structure
- Test validation logic (invalid names, existing files, etc.)
- Verify preview and confirmation flow

### Step 5: Add helper commands and examples

- Create example commands to demonstrate the system:
  - Simple command (no arguments)
  - Command with required arguments
  - Command with optional arguments
- Document these examples in the command instructions
- Use them as reference implementations

### Step 6: Finalize and document

- Ensure the command references `@docs/claude-commands.md` correctly
- Add inline comments explaining each section
- Include error handling for edge cases
- Add helpful feedback messages
- Document the expected output flow

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `test -f .claude/commands/create-command.md` - Verify the meta command file exists
- `grep -q "@docs/claude-commands.md" .claude/commands/create-command.md` - Verify it references the documentation
- `grep -c "##" .claude/commands/create-command.md | awk '{if($1>=8) print "OK"; else print "FAIL"}'` - Verify proper structure (at least 8 sections)
- `grep -q "\$ARGUMENTS" .claude/commands/create-command.md` - Verify argument handling is included
- `grep -q "interactive mode" .claude/commands/create-command.md` - Verify interactive mode is documented
- `grep -q "validation" .claude/commands/create-command.md` - Verify validation logic is included
- Test the command by running `/create-command` and verifying interactive flow works
- Test creating a sample command using the meta command
- Verify the sample command follows the correct structure

## Notes

- This is a meta-command - it creates other commands
- The command should be educational and guide users through the process
- Interactive mode should ask one question at a time for better UX
- Always show a preview before creating files
- Include validation to prevent malformed commands
- Reference the documentation as the source of truth
- The command should handle both creation and updates (warn on existing files)
- Consider adding `--help` functionality to show command creation guide
- Make the command output clear and actionable
- After creating a command, provide next steps (testing, documentation, etc.)
