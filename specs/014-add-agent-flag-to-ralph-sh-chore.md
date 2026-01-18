# Chore: Add agent flag functionality to ralph.sh

## Chore Description
Update `scripts/ralph/ralph.sh` to accept an `--agent` flag that allows users to choose between using `qwen` or `claude` as the AI agent. The script should default to `qwen` if no agent is specified. This requires:

1. Adding command-line argument parsing to detect the `--agent` flag
2. Supporting both `--agent qwen` and `--agent claude`
3. Using the appropriate CLI command and flags for each agent:
   - **qwen**: `qwen -y` (yolo mode for auto-approval)
   - **claude**: `claude -p --dangerously-skip-permissions` (print mode with permission bypass)
4. Updating the usage comment to reflect the new flag

## Relevant Files
Use these files to resolve the chore:

- **scripts/ralph/ralph.sh**
  - This is the main Ralph automation script that needs to be updated
  - Currently hardcodes `qwen -y` on line 63
  - Needs argument parsing logic to extract `--agent` flag
  - Needs conditional logic to use different commands based on agent selection
  - Usage comment on line 3 needs updating

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Add argument parsing for --agent flag

- Add argument parsing logic after line 7 (after MAX_ITERATIONS assignment)
- Parse command-line arguments to find `--agent <agent_name>` flag
- Default AGENT variable to "qwen" if not specified
- Validate that the agent is either "qwen" or "claude"
- Exit with error message if invalid agent specified
- Preserve the existing MAX_ITERATIONS positional argument functionality

### Update the usage comment

- Change line 3 from `# Usage: ./ralph.sh [max_iterations]`
- To: `# Usage: ./ralph.sh [--agent qwen|claude] [max_iterations]`
- Add example usage in comments showing both agents

### Add agent command configuration

- Create a conditional block after argument parsing to set agent-specific commands
- Define AGENT_CMD and AGENT_FLAGS variables based on AGENT selection:
  - For qwen: `AGENT_CMD="qwen"`, `AGENT_FLAGS="-y"`
  - For claude: `AGENT_CMD="claude"`, `AGENT_FLAGS="-p --dangerously-skip-permissions"`
- Place this configuration before the main loop (before line 56)

### Update the agent execution line

- Replace line 63: `OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | qwen -y 2>&1 | tee /dev/stderr) || true`
- With: `OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | $AGENT_CMD $AGENT_FLAGS 2>&1 | tee /dev/stderr) || true`
- This uses the configured AGENT_CMD and AGENT_FLAGS variables

### Add informational output

- Add echo statement before the main loop to show which agent is being used
- Format: "Using agent: $AGENT"
- Place this after line 54 (after "Starting Ralph" message)

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `bash -n scripts/ralph/ralph.sh && echo "✓ Script syntax is valid"` - Validate bash script syntax
- `bash scripts/ralph/ralph.sh --help 2>&1 | head -1` - Test script runs without errors (help should trigger error or be ignored)
- `grep -q "AGENT_CMD=" scripts/ralph/ralph.sh && echo "✓ AGENT_CMD variable defined"` - Verify agent command configuration exists
- `grep -q "AGENT_FLAGS=" scripts/ralph/ralph.sh && echo "✓ AGENT_FLAGS variable defined"` - Verify agent flags configuration exists
- `grep -q "\-\-agent" scripts/ralph/ralph.sh && echo "✓ --agent flag parsing present"` - Verify --agent flag parsing is present
- `grep -q "\$AGENT_CMD \$AGENT_FLAGS" scripts/ralph/ralph.sh && echo "✓ Agent variables used in command"` - Verify agent variables are used in execution

## Notes
- **CLI flag reference:**
  - **qwen**: `-y` or `--yolo` for auto-approve all actions
  - **claude**: `-p` (print mode, non-interactive) + `--dangerously-skip-permissions` (bypass permission checks)

- **Backward compatibility:** The script should work exactly as before when run without the `--agent` flag (defaults to qwen)

- **Argument parsing considerations:**
  - Need to handle both `./ralph.sh --agent claude 10` and `./ralph.sh 10 --agent claude`
  - Or require flags to come first: `./ralph.sh --agent claude [max_iterations]`
  - The simplest approach is to parse all arguments looking for `--agent` and use the last positional argument as MAX_ITERATIONS

- **Implementation approach:** Use a simple while loop to parse arguments:
  ```bash
  AGENT="qwen"
  while [[ $# -gt 0 ]]; do
    case $1 in
      --agent)
        AGENT="$2"
        shift 2
        ;;
      *)
        MAX_ITERATIONS="$1"
        shift
        ;;
    esac
  done
  ```

- **No other changes needed:** The rest of the script logic (output parsing, completion detection, archiving, etc.) remains unchanged regardless of which agent is used
