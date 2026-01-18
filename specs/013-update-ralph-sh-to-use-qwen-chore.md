# Chore: Update ralph.sh to use qwen instead of amp

## Chore Description
Update the `scripts/ralph/ralph.sh` script to use the `qwen` CLI tool instead of the `amp` CLI tool. The script currently uses `amp --dangerously-allow-all` to run Ralph autonomously, and needs to be updated to use `qwen` with the appropriate flags for non-interactive prompt mode and YOLO mode (auto-approve all actions).

## Relevant Files
Use these files to resolve the chore:

- **scripts/ralph/ralph.sh**
  - This is the main Ralph automation script that needs to be updated
  - Currently uses `amp --dangerously-allow-all` on line 63
  - Needs to be changed to use `qwen` with `-y` (yolo mode) and prompt from stdin

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Update the amp command to qwen in ralph.sh

- Locate line 63 in `scripts/ralph/ralph.sh` which contains: `amp --dangerously-allow-all`
- Replace `amp --dangerously-allow-all` with `qwen -y` (where `-y` is the yolo/auto-approve flag)
- The command reads from stdin via the pipe: `cat "$SCRIPT_DIR/prompt.md" | ...`
- Keep the stderr redirection and output capture logic the same: `2>&1 | tee /dev/stderr`
- Keep the `|| true` at the end to prevent the script from exiting on qwen failures

### Verify the updated command

- The new command should be: `OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | qwen -y 2>&1 | tee /dev/stderr) || true`
- Ensure the `-y` flag is present for yolo mode (auto-approve all tools)
- Ensure stdin piping from prompt.md is maintained
- Ensure output capturing and stderr redirection remain intact

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `cat scripts/ralph/ralph.sh | grep -q "qwen -y" && echo "✓ qwen command found"` - Verify the qwen command is present
- `cat scripts/ralph/ralph.sh | grep -q "amp" && echo "✗ amp still present" || echo "✓ amp removed"` - Verify amp has been removed
- `bash -n scripts/ralph/ralph.sh && echo "✓ Script syntax is valid"` - Validate bash script syntax

## Notes
- **Qwen flag reference from `qwen --help`:**
  - `-y, --yolo`: Automatically accept all actions (YOLO mode)
  - The positional prompt or stdin is used for the prompt content (no `-p` flag needed when piping from stdin)
  - `--approval-mode yolo` is an alternative to `-y` but `-y` is shorter and clearer

- **Current behavior:** The script runs amp in autonomous mode, reads the prompt from prompt.md via stdin, captures output, and checks for completion signal

- **Required behavior:** Same functionality but using qwen with yolo mode instead of amp

- **No other changes needed:** The rest of the script logic (output parsing, completion detection, archiving, etc.) remains the same
