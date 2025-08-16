# MekkaNote MVP Deployment and Infrastructure Plan

This document outlines the detailed deployment and infrastructure plan for the MekkaNote Minimum Viable Product (MVP), leveraging Digital Ocean as the primary hosting environment. The plan is designed to be practical for a solo developer, focusing on efficiency, cost-effectiveness, and alignment with the project's technical architecture.

## 1. Hosting Environment: Digital Ocean Setup

Given the solo developer constraint and the need for a flexible environment, Digital Ocean's App Platform combined with a dedicated Droplet for specific services offers a balanced approach.

- **Digital Ocean App Platform (for Frontend & Backend API):**
  - **Purpose:** Host the Node.js backend (Fastify) and serve the HTMX/Nunjucks frontend. The App Platform simplifies deployment, scaling, and management of web applications.
  - **Configuration:**
    - A single "Web Service" component for the Node.js application.
    - Automatic deployment from GitHub repository (connected to the monorepo).
    - Environment variables for API keys (e.g., OpenAI), database connection strings, and other sensitive configurations.
    - Scalability: Start with the smallest available plan and scale up as needed.
    - Built-in HTTPS/SSL provided by Digital Ocean.
- **Digital Ocean Droplet (for AI Services & Persistent Storage):**
  - **Purpose:** Host the Python AI microservices and manage the persistent storage of `.org` files and SQLite databases. This provides more control over the filesystem and allows for custom Python environments.
  - **Configuration:**
    - A small Linux Droplet (e.g., Ubuntu 22.04 LTS) with sufficient RAM and CPU for initial AI model inference.
    - Docker will be used to containerize the Python AI services for easier management and dependency isolation.
    - A dedicated volume for persistent storage of `.org` files and SQLite databases, mounted to the Droplet. This ensures data is not lost if the Droplet needs to be rebuilt or resized.
    - SSH access for management and debugging.
    - Firewall rules to restrict access to necessary ports only (e.g., SSH, internal API port for AI services).

## 2. Database Deployment

MekkaNote's architecture relies on `.org` files as the primary data source, augmented by SQLite for metadata, flexible data, and vector embeddings.

- **`.org` Files Management:**
  - These files will reside on the dedicated Digital Ocean Droplet's persistent volume.
  - The Node.js backend will interact with these files via the File System Manager component, which will communicate with the Droplet (e.g., via SSH/SFTP or a mounted network drive if feasible, though direct filesystem access on the same Droplet is simpler for MVP).
  - Regular backups of the persistent volume are crucial. Digital Ocean's snapshot feature will be utilized.
- **SQLite Database Management:**
  - The SQLite database file (`.db`) will also be stored on the persistent volume of the Digital Ocean Droplet, alongside the `.org` files.
  - The Node.js backend will connect to this SQLite database directly from the App Platform via a secure internal network connection to the Droplet, or by having the SQLite database accessible via a lightweight API on the Droplet itself (e.g., using `datasette` or a custom Fastify endpoint on the Droplet). For MVP, a direct connection from the App Platform to the Droplet's internal IP (if allowed and secure) or a simple API on the Droplet is preferred.
  - **Plugins:** The necessary SQLite extensions (for NoSQL/JSON and Vector capabilities) will be compiled and installed on the Droplet.
  - **Backup Strategy:** The SQLite database file will be included in the regular persistent volume snapshots.

## 3. CI/CD Pipeline: GitHub Actions Workflow

A robust CI/CD pipeline using GitHub Actions will automate the build, test, and deployment processes for both the App Platform and the Droplet.

- **Monorepo Structure:** The GitHub Actions workflow will be configured to detect changes in relevant directories (frontend, backend, AI services) within the monorepo.
- **Workflow Steps:**
  1.  **Trigger:** On `push` to `main` branch or `pull_request` to `main`.
  2.  **Checkout Code:** Checkout the monorepo.
  3.  **Install Dependencies:**
      - For Node.js backend/frontend: `npm install`
      - For Python AI services: `pip install -r requirements.txt`
  4.  **Linting & Formatting:** Run ESLint, Prettier (for TypeScript/JavaScript) and Black, Flake8 (for Python).
  5.  **Testing:** Run unit and integration tests for both frontend, backend, and AI services.
  6.  **Build:**
      - For Node.js: `npm run build` (if applicable, for bundling/transpilation).
      - For Python AI services: Build Docker image.
  7.  **Deployment to Digital Ocean App Platform (Node.js/Frontend):**
      - Use Digital Ocean's native GitHub Actions integration for App Platform.
      - This will automatically trigger a new deployment on the App Platform when changes are pushed to the `main` branch.
  8.  **Deployment to Digital Ocean Droplet (AI Services/Data):**
      - **SSH into Droplet:** Use `ssh-action` or similar to connect to the Droplet.
      - **Pull Docker Image:** Pull the newly built Docker image for AI services from a private Docker registry (e.g., Digital Ocean Container Registry or Docker Hub).
      - **Restart Docker Container:** Stop and restart the AI service Docker container to pick up the new image.
      - **Data Sync (if necessary):** If there are any static assets or configuration files that need to be synced to the Droplet, use `rsync` over SSH.

## 4. Domain Configuration: `mekkanote.mekaelturner.com` Setup

- **Digital Ocean DNS:**
  - The `mekaelturner.com` domain will be managed within Digital Ocean's DNS settings.
  - A `CNAME` record will be created for `mekkanote.mekaelturner.com` pointing to the Digital Ocean App Platform's default domain.
  - If the Droplet needs to be directly accessible (e.g., for a separate AI API endpoint), an `A` record pointing to the Droplet's public IP address will be configured.
- **HTTPS:** Digital Ocean App Platform automatically handles SSL/TLS certificates for custom domains, ensuring secure communication.

## 5. Security Considerations

Basic security measures will be implemented for the MVP.

- **Network Security:**
  - Digital Ocean Cloud Firewalls: Restrict inbound traffic to the Droplet to only necessary ports (SSH, internal API ports).
  - App Platform: Digital Ocean handles network security for the App Platform.
- **Access Control:**
  - SSH Key Authentication: Use strong SSH keys for Droplet access, disable password authentication.
  - Least Privilege: Ensure GitHub Actions tokens and Digital Ocean API keys have only the necessary permissions for deployment.
- **Data Security:**
  - Encryption in Transit: HTTPS for all web traffic (handled by App Platform).
  - Encryption at Rest: Digital Ocean volumes are encrypted at rest.
  - Sensitive Data: Environment variables for API keys and secrets, not hardcoded in the repository.
- **Dependency Management:** Regularly update dependencies to patch known vulnerabilities.
- **Regular Backups:** Implement automated daily snapshots of the Droplet's persistent volume.

## 6. Monitoring & Logging

Initial monitoring and logging will focus on basic health checks and error tracking.

- **Digital Ocean Metrics:**
  - Utilize Digital Ocean's built-in monitoring for Droplet (CPU, RAM, Disk I/O, Network) and App Platform (request rates, error rates, response times).
  - Set up alerts for critical thresholds (e.g., high CPU usage, low disk space).
- **Application Logging:**
  - **Backend (Node.js):** Use a logging library (e.g., Winston or Pino) to log application events, errors, and requests. Logs will be output to `stdout`/`stderr` and collected by Digital Ocean's App Platform logging.
  - **AI Services (Python):** Use Python's `logging` module. Logs will also be directed to `stdout`/`stderr` within the Docker container, accessible via `docker logs` on the Droplet.
- **Error Tracking:**
  - Integrate a simple error tracking service (e.g., Sentry's free tier or a basic custom solution) to capture and report unhandled exceptions in both Node.js and Python services.
- **Health Checks:** Configure health check endpoints for both the Node.js application and AI services to ensure they are running and responsive. Digital Ocean App Platform uses these for deployment and auto-healing.
