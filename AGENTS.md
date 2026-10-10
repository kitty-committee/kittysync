## Project Overview

KittySync is a monorepo with three packages in the `packages` directory:

- **`packages/frontend`** - SvelteKit frontend app using static site generation (SSG). Routes are in `routes/` with authentication plumbing in `routes/app/` and `routes/app/(authenticated)/`. All API requests go through `/api/*` proxy.
- **`packages/backend`** - Fastify-based backend API. All endpoints must begin with `/api/*` prefix due to Vite proxy configuration.
- **`packages/common`** - Shared package for functionality shared between frontend and backend. Cannot access browser or NodeJS APIs.

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm (scope commands with `pnpm frontend <command>`, `pnpm backend <command>`, `pnpm common <command>`)
- **Testing**: vitest (`pnpm test`), Playwright for frontend E2E (`pnpm frontend playwright install`)
- **Linting/Formatting**: ESLint, Prettier (`pnpm lint`, `pnpm format`)
- **Type checking**: TypeScript (`pnpm check`)
- **Dev server**: `pnpm dev` (runs full app at http://127.0.0.1:5173/), or `pnpm frontend dev` / `pnpm backend dev` for individual packages
- **Infrastructure**: PostgreSQL and Redis via Docker (`pnpm stack:start`, `pnpm stack:stop`)

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
