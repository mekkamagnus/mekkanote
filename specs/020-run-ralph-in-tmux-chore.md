# Chore: Run Ralph in a new tmux window in 'mekkanote' session

## Chore Description
Launch the Ralph Loop script (ralph.sh) in a new tmux window within the existing 'mekkanote' tmux session. This allows the Ralph AI agent to run continuously in the background while keeping the work accessible for monitoring.

## Relevant Files
Use these files to resolve the chore:

- **scripts/ralph/ralph.sh** - Ralph Loop script that needs to be executed
  - Main script that runs the Ralph AI agent
  - Processes the PRD and implements user stories
  - Located at /home/mekael/Documents/mekkanote/scripts/ralph/ralph.sh

- **scripts/ralph/prd.json** - Product requirements document
  - Contains all user stories for Ralph to work on
  - Ralph reads this to determine what to implement

- **tmux** - Terminal multiplexer (external tool)
  - Used to create persistent terminal sessions
  - Allows running processes in background windows

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Verify the mekkanote tmux session exists

- Check if tmux session 'mekkanote' exists using `tmux list-sessions`
- If session doesn't exist, create it with `tmux new-session -d -s mekkanote`
- Verify session is running before proceeding

### Step 2: Check existing windows in the session

- List all windows in the mekkanote session using `tmux list-windows -t mekkanote`
- Note the current window indices to avoid conflicts
- Identify the next available window number

### Step 3: Create a new window for Ralph

- Create a new window in the mekkanote session using `tmux new-window -t mekkanote -n ralph`
- This creates a window named "ralph" for easy identification
- Window will be created with the default shell (bash)

### Step 4: Navigate to the project directory in the new window

- Send commands to the new window to change to the correct directory
- Use `tmux send-keys -t mekkanote:ralph 'cd /home/mekael/Documents/mekkanote' Enter`
- This ensures Ralph runs from the correct working directory

### Step 5: Start the Ralph Loop script

- Execute the ralph.sh script in the new window
- Use `tmux send-keys -t mekkanote:ralph 'cd scripts/ralph && bash ralph.sh' Enter`
- Script will start processing the PRD and implementing user stories
- Output will be visible in the ralph window

### Step 6: Verify Ralph is running

- Check that the ralph window is active
- Use `tmux list-windows -t mekkanote` to confirm the window exists
- Optionally, attach to the ralph window to see startup output
- Detach from the session to let Ralph run in background

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `tmux list-sessions | grep mekkanote` - Verify mekkanote session exists
- `tmux list-windows -t mekkanote | grep ralph` - Verify ralph window exists in session
- `tmux send-keys -t mekkanote:ralph 'pwd' Enter && sleep 1 && tmux capture-pane -t mekkanote:ralph -p | grep mekkanote` - Verify ralph is in correct directory
- `tmux capture-pane -t mekkanote:ralph -p | head -20` - Check Ralph output in the window

## Notes

- The Ralph Loop script runs continuously until all user stories are complete
- Monitor Ralph's progress by attaching to the window: `tmux attach -t mekkanote:ralph`
- To detach from the window, press `Ctrl+B` then `D`
- Kill Ralph if needed: `tmux kill-window -t mekkanote:ralph`
- Ralph processes user stories in priority order (lowest number first)
- Check progress.txt file for Ralph's progress: `scripts/ralph/progress.txt`
- Ralph may take several minutes to hours depending on the number of stories
- The script handles its own error recovery and state management
