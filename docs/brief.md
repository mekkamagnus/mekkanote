# Project Brief: MekkaNote - The AI-Powered Note-Taking Assistant

## Executive Summary

MekkaNote is an intelligent note-taking application I'm building for my own personal use to better manage my knowledge and creative workflow. Heavily inspired by Zettelkasten, atomic notes, and evergreen note-taking philosophies, the goal is to solve the problem of my own disorganized and underutilized notes. It will use AI to automatically tag, categorize, summarize, and create a web of knowledge through automatic backlinking. The system will proactively suggest links between related but previously unconnected notes, fostering a Zettelkasten-like environment. The key value proposition is to transform my personal note-taking from passive storage into a dynamic, intelligent knowledge management system that helps me think, create, and discover connections within my own information.

## Inspiration

This project draws inspiration from several leading note-taking and knowledge management tools:

- **Obsidian:** For its powerful linking and graph-based visualization of notes.
- **Logseq:** For its outliner-based approach and focus on daily journals.
- **Apple Notes:** For its simplicity, ease of use, and seamless integration across devices.

## Problem Statement

While I'm inspired by knowledge management systems like Zettelkasten and atomic notes, my attempts to implement them with existing tools are fraught with friction. The manual effort required to consistently create links, tag notes appropriately, and ensure ideas are properly connected is significant and unsustainable. My digital notes often become a 'write-only' medium—a graveyard of good ideas that are never resurfaced because the connections between them are not obvious or easy to make. Existing tools are passive; they don't actively help me build the web of knowledge I'm aiming for. This leads to lost insights and a failure to capitalize on the compounding value of a well-connected, evergreen note system.

## Proposed Solution

To combat the friction of manual knowledge management, MekkaNote will be an AI-augmented tool built around a clean, intuitive note-taking interface. As I write, an AI engine will work alongside me, suggesting tags, generating summaries, and, most importantly, recommending links to other relevant notes in my collection. The core concept is "AI-assisted Zettelkasten," where the system automates the tedious parts of building a connected knowledge base. It will proactively surface connections I might have missed, turning my static notes into a dynamic, interactive, and self-organizing system that facilitates insight and creativity.

### My User Profile

- **Profile:** I am a developer and thinker who wants to build a long-term, personal knowledge base. I am passionate about philosophies like Zettelkasten and evergreen notes.
- **Behaviors:** I consume a lot of information from various sources (articles, books, conversations) and need a frictionless way to capture and connect ideas. I often work on multiple projects and need to be able to pull insights from my collected knowledge.
- **Needs:** I need a tool that removes the manual labor of maintaining a connected notes system. It should help me see the links between my ideas, resurface old thoughts, and provide a space for creative, associative thinking without the overhead of constant manual organization.

### Project Goals & Milestones

#### Personal Goals

- **Reduce Friction:** Significantly decrease the time and effort it takes to create and link notes.
- **Increase Insight:** Actively use the tool to generate at least one new, unexpected connection between ideas each week.
- **Consistent Use:** Successfully use this as my primary note-taking tool for at least one month, validating its usefulness for my workflow.

#### Project Milestones

- **Milestone 1 (Core Linking & Context):**
  - Build a basic note-taking app where I can create, edit, and save notes.
  - Implement manual linking by typing `[[` to trigger a dropdown with real-time search results of existing notes. When a note is selected, the link is created, and a corresponding backlink automatically appears in the linked note's backlink section.
  - When pasting a social media link (e.g., Twitter, YouTube), automatically unfurl it to show a content preview (like the tweet text or video thumbnail).
- **Milestone 2 (AI Integration):** Integrate the AI engine to provide automatic tagging and _suggestions_ for new links I might have missed.
- **Milestone 3 (Dogfooding):** Use the app as my daily driver for two weeks and compile a list of friction points and improvements.
- **Milestone 4 (Refinement):** Implement the key improvements identified during the dogfooding phase.

### MVP Scope

The scope of the Minimum Viable Product is to build the core functionality defined in **Milestone 1** and **Milestone 2**.

#### Core Features (In Scope for MVP)

- **Note Management:** Create, edit, and save `.org` format notes with full support for:
  - Headlines (H1-H6) with folding/unfolding
  - Dates and timestamps
  - Org-mode tags
  - Properties and property drawers
  - Bullet and numbered lists
  - Light org-mode syntax highlighting
  - Image storage using local file references (following Obsidian/Logseq conventions)
- **Manual Bi-directional Linking:**
  - Initiate linking with `[[` to open a real-time note search modal.
  - If no existing note is found, create a new note directly from the search modal.
  - Create links using UUID-based references (following org-mode conventions).
  - Automatically create corresponding backlinks in referenced notes.
- **Link Unfurling:** Automatically show a preview for pasted social media links (e.g., Twitter, YouTube).
- **AI-Powered Suggestions:**
  - Automatic tagging of notes based on content.
  - Suggestions for new links between notes.
  - **Basic Search:** A simple text-based search to find notes by title or content.

#### Out of Scope for MVP

- Advanced AI features (e.g., summarization, natural language query).
- Real-time collaboration or multi-user features.
- Third-party application integrations.
- Advanced search filters.
- Offline mode.

### Post-MVP Vision

Once the core functionality is stable and I've refined it through personal use (dogfooding), the long-term vision is to evolve MekkaNote into a true "second brain."

#### Potential Future Enhancements

- **Advanced AI Capabilities:**
  - Move beyond suggestions to more proactive AI assistance, such as summarizing groups of linked notes or identifying emergent themes in my knowledge base.
  - **AI-Powered Headline Suggestions:** Provide automatic suggestions for note titles/headings based on the content I've written.
- **Natural Language Query:** Implement the ability to "ask questions" of my notes and get narrative answers synthesized from my own writing.
- **Visual Graph Exploration:** Create a visual, interactive graph view to explore the connections between my notes, helping to spark new ideas.
- **Mobile Companion App:** A simple mobile app for quick note capture on the go, which would then be processed by the main application.
- **Advanced Org-mode Features:**
  - ASCII tables that operate as org-tables/spreadsheets with `tblfm` formulas
  - Full org-table functionality including calculations and formatting

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Mobile-first Progressive Web Application (PWA) that works seamlessly across all modern browsers and devices.
- **Browser/OS Support:** Latest versions of Chrome, Firefox, Safari, and mobile browsers.
- **Performance Requirements:** App should load in under 3 seconds; AI processing should not block the UI. Touch-first responsive design optimized for mobile devices. Utilizes browser's local storage and database for speed and caching.

### Technology Preferences

- **Frontend:** HTMX, Tailwind CSS, DaisyUI, Nunjucks
- **Backend:** TypeScript/Deno (Node.js fallback if needed).
- **Database:** The core data will be stored in local `.org` documents. This will be augmented by **SQLite** with plugins to handle all three database types:
  - **Relational:** For structured data and metadata
  - **NoSQL:** For flexible document storage
  - **Vector:** For AI-powered search and connection discovery
- **Hosting/Infrastructure:** Digital Ocean (mekkanote.mekaelturner.com)

### Architecture Considerations

- **Repository Structure:** Monorepo for managing frontend, backend, and shared libraries.
- **Service Architecture:** Microservices architecture to separate the core application from the AI processing services.
- **Integration Requirements:** Plan for a robust API to support future integrations.
- **Security/Compliance:** Standard data encryption at rest and in transit.
- **CI/CD:** GitHub Actions workflow for continuous integration and deployment.

## Constraints & Assumptions

### Constraints

- **Budget:** Initial development budget of $150,000.
- **Timeline:** MVP launch within 4 months.
- **Resources:** Solo project (developed by myself).
- **Technical:** Reliance on third-party APIs for some AI functionalities (e.g., OpenAI).

### Key Assumptions

- Users are willing to trust an AI to organize their personal and professional notes.
- The value provided by the AI features will be significant enough to drive adoption and conversion to paid plans.
- We can build a sufficiently differentiated product in a crowded market.

## Risks & Open Questions

### Key Risks

- **Technical Feasibility:** The quality and performance of the AI features may not meet user expectations. (High Impact)
- **Market Adoption:** The product may fail to gain traction against established competitors like Evernote and Notion. (High Impact)
- **Data Privacy:** Users may have concerns about the privacy and security of their data being processed by AI. (Medium Impact)

### Open Questions

- What is the most effective pricing strategy (freemium vs. trial)?
- Which specific AI features provide the most value to our target users?
- How do we effectively communicate the benefits of an AI-powered note-taking app?

### Areas Needing Further Research

- In-depth analysis of the pricing models of key competitors.
- User interviews to validate the proposed MVP feature set.
- Technical investigation into the best-performing and most cost-effective AI models/APIs.

## Appendices

### A. Research Summary

(This section would be filled in with findings from market research, competitive analysis, etc.)

### B. Stakeholder Input

(This section would summarize feedback from key stakeholders.)

### C. References

- [Link to initial brainstorming docs]
- [Link to market research data]

## Next Steps

### Immediate Actions

1.  Validate the MVP scope with target user interviews.
2.  Begin technical prototyping of the core AI features.
3.  Develop a detailed product roadmap and backlog.

### PM Handoff

This Project Brief provides the full context for MekkaNote. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.

**Next Step:** The Product Manager (PM) will now take this brief and begin creating the Product Requirements Document (PRD).

**Command:** `*pm create-prd`

Thank you for your collaboration!
