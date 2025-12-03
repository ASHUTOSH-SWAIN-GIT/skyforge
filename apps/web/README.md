# Skyforge

Skyforge is a **collaborative database schema design tool** that helps you and your team design, visualize, and share database schemas faster.

Instead of hand‑writing schemas or drawing static diagrams, Skyforge gives you an interactive canvas where tables, columns, and relationships are all live, editable objects you can work on together in real time.

---

## What Skyforge Does

- **Visual database design**
  - Create tables as nodes on a canvas.
  - Add columns, choose data types, and toggle constraints like primary key and NOT NULL.
  - Draw relationships between tables to represent foreign keys.

- **Real‑time collaboration**
  - Work on the same schema with teammates at the same time.
  - See updates to tables and relationships as they happen.

- **One‑click code export**
  - Turn your visual schema into:
    - **PostgreSQL** schema (DDL)
    - **Prisma** schema
  - Exported code is designed to be production‑ready, so you can drop it into your app with minimal changes.

- **Project organization**
  - Create multiple projects for different apps or environments.
  - Each project has its own canvas and exportable schema.
  - Share access with collaborators so they can view and edit.

- **Modern, focused UI**
  - Clean Catppuccin Mocha–inspired interface.
  - Minimal gradients/animations, optimized for readability and long work sessions.

---

## Who This Is For

Skyforge is built for:

- **Backend and full‑stack engineers** who want to model schemas visually but still ship real code.
- **Teams** who need a shared source of truth for database design.
- **Product‑minded developers** who like to iterate quickly on data models before committing to migrations.

If you’ve ever:

- Sketched tables and relationships on a whiteboard,
- Juggled ERD diagrams that never stay in sync with the real schema, or
- Had to reverse‑engineer DB schemas from migrations,

Skyforge is meant to replace that friction with a single collaborative tool.

---

## How You Use It (Conceptually)

1. **Sign in**  
   Log in with Google. You’ll land in your workspace.

2. **Create a project**  
   Each project represents a database schema (for one app, service, or environment).

3. **Design your schema on the canvas**
   - Add tables and name them.
   - Add columns and set types.
   - Choose which column is the primary key (one per table).
   - Toggle NOT NULL on/off per column or for all columns in a table.
   - Connect tables with relationships to model foreign keys.

4. **Collaborate**
   - Share the project with others.
   - Everyone sees changes live on the same canvas.

5. **Export code**
   - When you’re happy with the schema, open the export panel.
   - Choose PostgreSQL or Prisma and generate code.
   - Copy the code into your project or pipeline.

6. **Iterate**
   - As your data model evolves, update the canvas.
   - Re‑export code whenever you need updated schemas.

---

## Key Ideas & Principles

- **Visual first, code ready**  
  Skyforge starts from the visual model but always aims to produce schemas that can be used in real applications.

- **Single source of truth**  
  The canvas is the central representation of your schema, not just documentation. Exports are always derived from the latest saved state.

- **Collaboration by default**  
  Database design is often a team sport. Skyforge treats real‑time collaboration as a core feature, not an add‑on.

- **Frictionless onboarding**  
  Google sign‑in, familiar UI patterns, and a simple “tables and relationships” mental model help you get started quickly.

---

## High‑Level Feature Overview

- **Landing page**
  - Explains the value of Skyforge and links to login/dashboard.
  - Includes links to the open‑source repository.

- **Workspace (Dashboard)**
  - Shows your projects.
  - Lets you create, open, and delete projects.

- **Canvas**
  - Drag‑and‑drop tables.
  - Edit table and column names in place.
  - Set primary keys and NOT NULL constraints.
  - Manage relationships between tables.

- **Collaboration**
  - Multiple users can view and edit the same project simultaneously.

- **Export**
  - PostgreSQL and Prisma options.
  - Caching avoids repeated work for unchanged schemas, so exports feel fast.

---

## Status

Skyforge is an evolving project. The core experience—visual design, collaboration, and export—is in place, and the goal is to keep refining:

- Collaboration experience (presence, conflicts, UX polish)
- Export accuracy and flexibility
- Onboarding flows and docs

Feedback, ideas, and contributions are welcome. Use the GitHub repository to report issues or suggest improvements.



