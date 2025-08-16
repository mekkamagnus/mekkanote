# MekkaNote Development Workflow and Tooling

This document outlines the essential workflow and tooling for developing MekkaNote, designed to guide a solo developer (myself) through setting up the environment, contributing code, and utilizing the chosen tools effectively.

## 1. Project Structure Overview

MekkaNote is organized as a monorepo, which means all related projects (frontend, backend, AI services, shared libraries) are housed within a single Git repository. This simplifies dependency management, code sharing, and overall project coordination.

The primary directories you'll encounter are:

- `frontend/`: Contains the HTMX/Nunjucks client-side application.
- `backend/`: Contains the Node.js/TypeScript Fastify server.
- `ai-services/`: Contains the Deno/TypeScript services for AI functionalities.
- `shared/`: For common utilities, types, and interfaces used across different services.
- `docs/`: Project documentation, including this file.

## 2. Local Development Environment Setup

To get MekkaNote running locally, follow these steps:

### Prerequisites

Ensure you have the following installed on your system:

- **Deno (v1.30 or higher):** Primary runtime for backend and AI services.
  - Verify installation: `deno --version`
- **Node.js (v18 or higher):** Fallback runtime only if Deno cannot handle specific tasks.
  - Verify installation: `node -v`
- **Git:** For version control.
  - Verify installation: `git --version`
- **Docker:** For containerization (optional for local development).
  - Verify installation: `docker --version`

### Installation Steps

1.  **Clone the Repository:**

    ```bash
    git clone [repository-url]
    cd mekkanote
    ```

2.  **Install Node.js Dependencies:**
    Navigate to the `backend/` and `frontend/` directories and install their respective dependencies.

    ```bash
    cd backend
    npm install
    cd ../frontend
    npm install
    cd .. # Return to monorepo root
    ```

3.  **Install Deno Dependencies (for AI Services):**
    Navigate to the `ai-services/` directory and install the required TypeScript/Deno modules.

    ```bash
    cd ai-services
    deno cache --lock=lock.json --lock-write deps.ts
    cd .. # Return to monorepo root
    ```

4.  **Environment Variables:**
    Create a `.env` file in the `backend/` directory (and potentially `ai-services/` if needed) based on a `.env.example` (if provided) or the project's requirements. This will include API keys (e.g., OpenAI) and other configurations.

### Running the Application Locally

1.  **Start the Backend Server:**

    ```bash
    cd backend
    npm run dev # Or `npm start` for production build
    ```

    The backend will typically run on `http://localhost:3000` (or as configured).

2.  **Start the AI Services:**

    ```bash
    cd ai-services
    deno run --allow-net --allow-env --allow-read --allow-write mod.ts
    ```

    Ensure the AI service is accessible by the backend as configured (e.g., `http://localhost:5000`).

3.  **Access the Frontend:**
    Once the backend is running, open your web browser and navigate to the backend's address (e.g., `http://localhost:3000`). The HTMX frontend will be served by the Node.js backend.

## 3. Code Contribution Guidelines

To maintain code quality and consistency:

- **Linting & Formatting:**

  - **TypeScript/JavaScript:** Use ESLint and Prettier. Ensure your IDE is configured to format on save.
  - **Python:** Use Black for formatting and Flake8 for linting.
  - Run linting/formatting checks before committing:

    ```bash
    # In backend/ or frontend/
    npm run lint
    npm run format

    # In ai-services/
    black .
    flake8 .
    ```

- **Commit Messages:** Follow a conventional commit style (e.g., `feat: add new feature`, `fix: resolve bug`).
- **Branching Strategy:** Use feature branches for new work, merging into `main` via pull requests.

## 4. Testing Strategy

Automated tests are crucial for ensuring stability.

- **Unit Tests:** Focus on individual functions or components.
- **Integration Tests:** Verify interactions between different parts of the system (e.g., backend API endpoints with database).
- **Running Tests:**

  ```bash
  # In backend/ or frontend/
  npm test

  # In ai-services/
  pytest
  ```

## 5. Tooling

### Integrated Development Environment (IDE)

- **VS Code:** Highly recommended due to its excellent support for TypeScript, Python, and a rich ecosystem of extensions.

### Essential VS Code Extensions

- **ESLint:** Integrates ESLint into VS Code.
- **Prettier - Code formatter:** Formats your code consistently.
- **Docker:** For working with Docker containers.
- **GitLens:** Enhances Git capabilities within VS Code.
- **Tailwind CSS IntelliSense:** Provides auto-completion, linting, and hover info for Tailwind CSS.
- **HTMX IntelliSense (if available):** Look for extensions that provide HTMX-specific completions.

### Version Control

- **Git:** Used for all source code management. Familiarity with basic Git commands (clone, add, commit, push, pull, branch, merge, rebase) is essential.

### Package Managers

- **npm:** For Node.js/TypeScript dependencies.

## 6. Debugging

Effective debugging is key to resolving issues quickly.

### Backend (Node.js/TypeScript) Debugging

1.  **VS Code Debugger:**

    - Open the `backend/` folder in VS Code.
    - Go to the "Run and Debug" view (Ctrl+Shift+D or Cmd+Shift+D).
    - Create a `launch.json` configuration (if not already present) for Node.js. A typical configuration might look like:
      ```json
      {
        "version": "0.2.0",
        "configurations": [
          {
            "type": "node",
            "request": "launch",
            "name": "Launch Backend",
            "skipFiles": ["<node_internals>/**"],
            "program": "${workspaceFolder}/src/index.ts", // Adjust to your main entry file
            "preLaunchTask": "npm: build", // If you need to compile TypeScript first
            "outFiles": [
              "${workspaceFolder}/dist/**/*.js" // Adjust to your compiled JS output
            ]
          }
        ]
      }
      ```
    - Set breakpoints in your TypeScript code.
    - Start debugging.

2.  **Console Logging:** Use `console.log()` statements for quick inspections.

### Frontend (HTMX) Debugging

1.  **Browser Developer Tools:**
    - Use your browser's built-in developer tools (F12 or right-click -> Inspect).
    - **Elements Tab:** Inspect the DOM and HTMX attributes.
    - **Network Tab:** Monitor HTMX requests, responses, and headers. Look for `HX-Request`, `HX-Trigger`, etc.
    - **Console Tab:** Check for JavaScript errors or `console.log` output from any inline scripts or HTMX event handlers.
    - **Sources Tab:** Debug any client-side JavaScript.

### AI Services (Deno/TypeScript) Debugging

1.  **VS Code Deno Debugger:**

    - Open the `ai-services/` folder in VS Code.
    - Ensure the Deno extension is installed and activated.
    - Create a `launch.json` configuration for Deno. Example:
      ```json
      {
        "version": "0.2.0",
        "configurations": [
          {
            "name": "Deno: Debug AI Services",
            "request": "launch",
            "type": "deno",
            "program": "${workspaceFolder}/mod.ts",
            "runtimeExecutable": "deno",
            "runtimeArgs": ["run", "--inspect-brk", "--allow-all"],
            "attachSimplePort": 9229
          }
        ]
      }
      ```
    - Set breakpoints in your TypeScript code.
    - Start debugging.

2.  **Console Logging:** Use `console.log()` statements for quick inspections.

This document provides a foundational guide for developing MekkaNote. Adhering to these guidelines will ensure a smooth and efficient development process.
