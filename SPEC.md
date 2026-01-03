# board. - UML Diagram Editor Specification

> Rewrite of board-old/ in Svelte 5 + SvelteKit as a static PWA

## Overview

A browser-based UML class diagram editor with a retro aesthetic. The application runs entirely client-side as a static site with offline support via PWA.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Svelte 5 + SvelteKit (static adapter) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Storage | IndexedDB (via idb or Dexie) |
| Rendering | Native HTML/SVG elements (NOT `<canvas>`) |
| Line Rendering | Custom SVG paths |
| Offline | Service Worker (PWA) |

---

## Architecture Principles

### Rendering Approach
- **HTML/DOM elements**: All diagram elements (classes, notes, relationships) are native HTML/SVG elements, NOT drawn on `<canvas>`
- **Performance**: Native DOM is more performant for our use case and enables better accessibility
- **CSS transforms**: Use CSS transforms for positioning and zooming

### Modularity
- **Feature-based folder structure**: Each feature (classes, relations, export, etc.) in its own directory
- **Separation of concerns**: UI components, state management, and business logic in separate layers
- **Composable stores**: Svelte 5 runes with clear, single-responsibility stores

### Extensibility
- **Diagram type abstraction**: Base interfaces for diagram elements to support future diagram types (sequence, ER, use-case)
- **Export plugin pattern**: Exporters implement a common interface for easy addition of new formats
- **Clean data models**: Well-typed TypeScript interfaces for all entities

---

## Data Models

### Project
```typescript
interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  diagrams: Diagram[];
}
```

### Diagram
```typescript
interface Diagram {
  id: string;
  name: string;
  type: 'class'; // Future: 'sequence' | 'er' | 'usecase'
  elements: DiagramElement[];
  relationships: Relationship[];
  viewport: { x: number; y: number; zoom: number };
}
```

### Class Element
```typescript
interface ClassElement {
  id: string;
  type: 'class' | 'abstract' | 'interface';
  name: string;
  position: { x: number; y: number };
  attributes: Attribute[];
  methods: Method[];
}

interface Attribute {
  id: string;
  name: string;
  dataType: string;
  visibility: 'public' | 'private' | 'protected';
}

interface Method {
  id: string;
  name: string;
  returnType: string;
  parameters: Parameter[];
  visibility: 'public' | 'private' | 'protected';
}

interface Parameter {
  id: string;
  name: string;
  type: string;
}
```

### Relationship
```typescript
interface Relationship {
  id: string;
  type: 'association' | 'inheritance' | 'implementation' | 'aggregation' | 'composition';
  sourceId: string;
  targetId: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  label?: string;
  anchors: { source: AnchorPoint; target: AnchorPoint };
}

type AnchorPoint = 'top' | 'bottom' | 'left' | 'right' | 'auto';
```

### Note Element
```typescript
interface NoteElement {
  id: string;
  type: 'note';
  content: string;
  position: { x: number; y: number };
}
```

### Diagram Element Union
```typescript
type DiagramElement = ClassElement | NoteElement;
```

---

## Features

### MVP (Phase 1)

#### Core Diagram Editing
- [ ] Create classes, abstract classes, and interfaces
- [ ] Edit class name (inline editing)
- [ ] Add/edit/delete attributes with name, type, visibility
- [ ] Add/edit/delete methods with name, return type, parameters, visibility
- [ ] Drag and drop to reposition elements
- [ ] Delete elements (keyboard or UI)

#### Relationships
- [ ] Create relationships between classes
- [ ] Relationship types: association, inheritance
- [ ] Custom SVG path rendering with proper UML notation
- [ ] Editable multiplicity labels
- [ ] Anchor point selection (which side of class box)

#### Canvas
- [ ] Zoom in/out (scroll wheel)
- [ ] Pan (drag empty canvas, or scroll)
- [ ] Dot grid background (retro aesthetic)

#### Canvas Notes
- [ ] Create plain text note boxes on canvas
- [ ] Position and drag notes like class elements
- [ ] Edit note content (double-click)

#### Persistence
- [ ] Auto-save to IndexedDB
- [ ] Multiple diagrams per project
- [ ] Sidebar file tree with nested folders
- [ ] Remember and restore last opened diagram

#### History
- [ ] Full undo/redo stack
- [ ] Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z

### Phase 2

#### Export/Import
- [ ] Export diagram as JSON
- [ ] Export diagram as SVG
- [ ] Export diagram as PNG
- [ ] Import diagram from JSON

#### PWA
- [ ] Service worker for offline support
- [ ] Installable as app
- [ ] App manifest with icons

#### Additional Relationship Types
- [ ] Aggregation (hollow diamond)
- [ ] Composition (filled diamond)
- [ ] Implementation (dashed line with arrow)

### Future Phases

#### Additional Diagram Types
- Sequence diagrams
- ER diagrams
- Use-case diagrams

---

## UI Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo, Project Name, Undo/Redo, Export          │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Sidebar │              Canvas                          │
│          │                                              │
│  - Files │   ┌──────────────┐    ┌──────────────┐      │
│  - Tree  │   │   <<class>>  │───▶│   <<intf>>   │      │
│          │   │   ClassName  │    │  Interface   │      │
│          │   ├──────────────┤    └──────────────┘      │
│          │   │ - attribute  │                          │
│          │   ├──────────────┤                          │
│          │   │ + method()   │                          │
│          │   └──────────────┘                          │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Toolbar: Add Class, Add Interface, Add Relation, Zoom  │
└─────────────────────────────────────────────────────────┘
```

### Visual Style
- **Aesthetic**: Retro/vintage feel inspired by original (not exact copy)
- **Class boxes**: Warm background color, subtle shadows
- **Canvas**: Grid pattern background
- **Theme**: Single theme initially (consider dark mode in future)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+S` | Save/Export |
| `Delete` / `Backspace` | Delete selected element |
| `Escape` | Cancel current action / Deselect |

---

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Canvas.svelte
│   │   │   └── Grid.svelte
│   │   ├── elements/
│   │   │   ├── ClassBox.svelte
│   │   │   ├── AttributeList.svelte
│   │   │   ├── MethodList.svelte
│   │   │   └── NoteBox.svelte
│   │   ├── relationships/
│   │   │   ├── RelationshipLine.svelte
│   │   │   └── AnchorPoint.svelte
│   │   ├── sidebar/
│   │   │   ├── Sidebar.svelte
│   │   │   └── FileTree.svelte
│   │   ├── toolbar/
│   │   │   └── Toolbar.svelte
│   │   └── ui/
│   │       ├── Button.svelte
│   │       ├── Input.svelte
│   │       └── Modal.svelte
│   ├── stores/
│   │   ├── project.svelte.ts
│   │   ├── diagram.svelte.ts
│   │   ├── selection.svelte.ts
│   │   └── history.svelte.ts
│   ├── services/
│   │   ├── storage.ts        # IndexedDB operations
│   │   ├── export/
│   │   │   ├── json.ts
│   │   │   ├── svg.ts
│   │   │   └── png.ts
│   │   └── import/
│   │       └── json.ts
│   ├── types/
│   │   ├── diagram.ts
│   │   ├── elements.ts
│   │   └── relationships.ts
│   └── utils/
│       ├── geometry.ts       # SVG path calculations
│       ├── id.ts             # UUID generation
│       └── keyboard.ts       # Shortcut handling
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── +layout.ts            # Prerender config
├── app.css
├── app.html
└── service-worker.ts
```

---

## Storage Schema (IndexedDB)

```
Database: board-diagrams

Object Stores:
├── projects
│   └── { id, name, createdAt, updatedAt }
├── diagrams
│   └── { id, projectId, name, type, viewport, createdAt, updatedAt }
├── elements
│   └── { id, diagramId, type, name, position, attributes?, methods?, content? }
├── relationships
│   └── { id, diagramId, type, sourceId, targetId, ... }
└── folders
    └── { id, projectId, name, parentId? }
```

---

## Deployment

- **Build**: `bun run build` produces static files
- **Adapter**: `@sveltejs/adapter-static`
- **Output**: `/build` directory with all assets
- **Hosting**: Any static file server (GitHub Pages, Netlify, Vercel, S3, etc.)

---

## Development Milestones

### Milestone 1: Foundation
- Project setup with SvelteKit + TypeScript + Tailwind
- Basic canvas with zoom/pan
- IndexedDB storage service
- Project/diagram data structures

### Milestone 2: Class Elements
- ClassBox component with full editing
- Attributes and methods management
- Visibility toggles
- Drag and drop positioning

### Milestone 3: Relationships
- Custom SVG line rendering
- Relationship creation flow
- Anchor point system
- UML notation (arrows, diamonds)

### Milestone 4: Project Management
- Sidebar file tree
- Multiple diagrams
- Create/rename/delete diagrams
- Undo/redo history

### Milestone 5: Export & PWA
- JSON export/import
- SVG export
- PNG export
- Service worker
- PWA manifest

---

## Testing Strategy

### Unit Tests (Vitest)

Tests are co-located with source files using `.test.ts` suffix.

#### Utility Tests
- [ ] `utils/geometry.ts` - SVG path calculations, anchor point math, line intersections
- [ ] `utils/id.ts` - UUID generation uniqueness

#### Store Tests
- [ ] `stores/history.svelte.ts` - Undo/redo stack push, pop, clear operations
- [ ] `stores/diagram.svelte.ts` - Element add/remove/update operations
- [ ] `stores/selection.svelte.ts` - Selection state management

#### Service Tests
- [ ] `services/storage.ts` - IndexedDB CRUD operations (using fake-indexeddb)
- [ ] `services/export/json.ts` - Diagram serialization/deserialization
- [ ] `services/export/svg.ts` - SVG string generation
- [ ] `services/import/json.ts` - Import validation and error handling

---

## Interaction Design

### Canvas Interactions
- **Panning**: Drag on empty canvas, or scroll
- **Zoom**: Scroll wheel to zoom in/out
- **Grid**: No snap-to-grid in MVP (future phase)
- **Grid Style**: Dot pattern (like dot paper)

### Selection
- **Single select**: Click on element
- **Multi-select**: Shift+click to add/remove from selection

### Element Editing
- **Inline editing**: Double-click on text to enter edit mode
- **Class box sizing**: Auto-size to fit content
- **Visibility display**: UML symbols: + (public), - (private), # (protected)
- **Stereotypes**: Fixed types only (class, abstract, interface) - custom stereotypes in future phase

### Adding Attributes/Methods
- **Plus button**: Click + button at bottom of section
- **Inline row**: Empty row at bottom for quick typing
- **Parameter entry**: Structured fields (name + type) for method parameters
- **Validation**: None - user responsible for valid names

### Relationship Creation
- **Method**: Drag from source class edge to target class
- **Type selection**: Quick menu appears when drag completes to pick relationship type
- **Anchor points**: Auto-pick initially based on positions, user can drag to adjust afterward
- **Line style**: Orthogonal (90-degree angles only, rectilinear routing)
- **Labels**: Multiplicity labels positioned near source and target endpoints

### Deletion
- **Elements**: Instant delete (rely on undo for mistakes)
- **Diagrams**: Confirmation dialog required
- **Cascade**: Deleting a class automatically deletes all connected relationships

### Navigation
- **Load state**: Remember and restore last opened diagram
- **Minimap**: Future phase

---

## Visual Design

### Aesthetic
- **Style**: Retro 80s software (early GUI software like MacPaint - clean but warm)
- **Color palette**: Warm sepia tones - cream backgrounds, warm accents
- **Font**: System UI fonts for performance

### Class Boxes
- Warm background color with subtle shadows
- Auto-sizing to fit content
- UML visibility symbols (+, -, #)

### Canvas
- Dot grid pattern background
- Clean, uncluttered workspace

### App Icon
- Stylized lowercase 'b' in monospace font

---

## UI Components

### Toolbar (Bottom Fixed)
- Add Class button
- Add Interface button
- Add Abstract Class button
- Add Relationship button
- Add Note button
- Zoom controls

### Sidebar
- **Organization**: Nested folders for diagrams
- **Navigation**: Simple scroll (no search/filter in MVP)
- **Project name**: Edit via sidebar (not header click)
- **Diagram operations**: Create, rename, delete diagrams

### Canvas Notes
- Plain text note boxes that can be placed on canvas
- Positioned and moved like class elements

### No Context Menu
- All actions via toolbar, sidebar, or keyboard shortcuts

---

## Data Management

### History
- **Undo limit**: 100 actions
- **Scope**: Per-session (clears on page reload)

### Export/Import
- **JSON export**: Single diagram at a time
- **File sharing**: Manual export/import for collaboration (no real-time sync)

### Persistence
- Auto-save to IndexedDB
- Remember last opened diagram

---

## Scope Decisions

### In MVP
- Basic class diagram editing
- Relationships with orthogonal routing
- Canvas notes (plain text)
- Nested folder organization
- Undo/redo (100 actions)

### Not in MVP (Future Phases)
- Copy/paste elements
- Keyboard shortcuts for creating elements
- Snap-to-grid option
- Auto-layout algorithms
- Touch/mobile support
- Minimap navigation
- Custom stereotypes
- Starter templates
- Type autocomplete for attributes
- Real-time collaboration

### Explicitly Excluded
- Context menus
- Rich text in notes
- Drag selection box (use Shift+click instead)

---

## Reference

### board-old/
Reference for visual design inspiration only. Code patterns and architecture follow this new spec.
