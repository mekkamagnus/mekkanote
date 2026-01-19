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
