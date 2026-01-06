# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**board.** is a browser-based UML class diagram editor with a retro aesthetic. It's a rewrite of `board-old/` using Svelte 5 + SvelteKit as a static PWA with offline support.

See `SPEC.md` for full specification including data models, features, and milestones.

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Build static site (output: /build)
bun run preview      # Preview production build
bun run check        # Type-check with svelte-check
bun run test         # Run all tests once
bun run test:unit    # Run tests in watch mode
```

Run a single test file:
```bash
bun run test:unit src/demo.spec.ts
```

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`)
- **SvelteKit** with static adapter
- **TypeScript** in strict mode
- **Tailwind CSS v4**
- **Vitest** for testing (tests require assertions via `requireAssertions: true`)
- **IndexedDB** for persistence (via idb or Dexie)

## Architecture

### Data Flow
```
IndexedDB → Stores (Svelte 5 runes) → Components → Canvas/SVG
```

### Key Data Models
- **Project** contains multiple **Diagrams**
- **Diagram** contains **Elements** (classes/interfaces) and **Relationships**
- **ClassElement** has attributes, methods, position, and visibility modifiers
- **Relationship** connects elements with type (association, inheritance, etc.) and anchor points

### Store Pattern
Stores use Svelte 5 runes in `.svelte.ts` files:
- `project.svelte.ts` - Project management
- `diagram.svelte.ts` - Element add/remove/update
- `selection.svelte.ts` - Selected elements
- `history.svelte.ts` - Undo/redo stack

### Export Plugin Pattern
Exporters in `services/export/` implement a common interface for JSON, SVG, and PNG formats.

## Code Style

- Minimize comments; prefer self-documenting code with clear variable/function names
- A comment should only exist when absolutely necessary to explain complex logic
- Never add comments that restate what the code already shows
- Comment style: casual lowercase - short punchy sentences - use dashes not commas - no formality

## Code Quality Standards

- **Never compromise type safety**: No `any`, no non-null assertion operator (`!`), no type assertions (`as Type`)
- **Prefer pure functions over side effects**: Utility functions should compute and return values - let callers handle side effects. This makes code easier to test, reason about, and reuse.

## Svelte MCP Server

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

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
