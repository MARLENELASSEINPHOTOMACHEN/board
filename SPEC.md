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

### Geometry Types
```typescript
interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
```

### Folder
```typescript
interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  deletedAt: Date | null;
}
```

### Diagram
```typescript
type DiagramType = 'class'; // Future: 'sequence' | 'er' | 'usecase'

interface Diagram {
  id: string;
  folderId: string | null;
  name: string;
  type: DiagramType;
  elements: DiagramElement[];
  relationships: Relationship[];
  viewport: Viewport;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Class Element
```typescript
type Visibility = 'public' | 'private' | 'protected';
type ClassType = 'class' | 'abstract' | 'interface';

interface ClassElement {
  id: string;
  type: ClassType;
  name: string;
  position: Point;
  attributes: Attribute[];
  methods: Method[];
}

interface Attribute {
  id: string;
  name: string;
  dataType: string;
  visibility: Visibility;
}

interface Method {
  id: string;
  name: string;
  returnType: string;
  parameters: Parameter[];
  visibility: Visibility;
}

interface Parameter {
  id: string;
  name: string;
  type: string;
}
```

### Relationship
```typescript
type RelationshipType = 'association' | 'inheritance' | 'implementation' | 'aggregation' | 'composition';
type AnchorPoint = 'top' | 'bottom' | 'left' | 'right' | 'auto';

interface RelationshipAnchors {
  source: AnchorPoint;
  target: AnchorPoint;
}

interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  label?: string;
  anchors: RelationshipAnchors;
}
```

### Note Element
```typescript
interface NoteElement {
  id: string;
  type: 'note';
  content: string;
  position: Point;
}
```

### Diagram Element Union
```typescript
type DiagramElement = ClassElement | NoteElement;

// Type guards
function isClassElement(element: DiagramElement): element is ClassElement;
function isNoteElement(element: DiagramElement): element is NoteElement;
```

---

## Features

### MVP (Phase 1)

#### Core Diagram Editing
- [x] Create classes, abstract classes, and interfaces
- [x] Edit class name (inline editing)
- [x] Add/edit/delete attributes with name, type, visibility
- [x] Add/edit/delete methods with name, return type, parameters, visibility
- [x] Drag and drop to reposition elements
- [x] Multi-select elements (Shift+click)
- [x] Delete elements (keyboard: Delete/Backspace)

#### Relationships
- [x] Drag-to-connect relationship creation (edge hotspots appear on hover)
- [x] Relationship types: association, inheritance, implementation, aggregation, composition
- [x] Custom SVG orthogonal path rendering with proper UML notation
- [x] Anchor point auto-selection based on relative element positions
- [x] Type picker dropdown at drop location
- [x] Editable multiplicity labels (click to edit inline)
- [x] Draggable anchor points for adjusting connection sides
- [x] Double-click relationship line to change type

#### Canvas
- [x] Zoom in/out (Ctrl/Cmd + scroll wheel)
- [x] Pan (Shift+drag, middle mouse, or scroll)
- [x] Dot grid background (retro aesthetic)

#### Canvas Notes
- [x] Create plain text note boxes on canvas
- [x] Position and drag notes like class elements
- [x] Edit note content (double-click)

#### Persistence
- [x] Auto-save to IndexedDB (500ms debounce)
- [x] Multiple diagrams per project
- [x] Sidebar diagram list with create/rename/delete
- [x] Remember and restore last opened diagram

#### History
- [x] Full undo/redo stack (50 action limit, per-diagram)
- [x] Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
- [x] History preserved when switching diagrams within session

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

#### Organization
- [ ] Nested folder organization in sidebar (backend exists)

### Future Phases

#### Additional Diagram Types
- Sequence diagrams
- ER diagrams
- Use-case diagrams

---

## UI Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo, Diagram Name (editable), Undo/Redo, Export│
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
| `Delete` / `Backspace` | Delete selected element(s) |
| `Escape` | Deselect all |

---

## File Structure

```
src/
├── lib/
│   ├── actions/
│   │   └── draggable.svelte.ts  # Svelte action for drag-and-drop
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Canvas.svelte
│   │   │   ├── Grid.svelte
│   │   │   ├── ConnectionPreview.svelte
│   │   │   ├── AnchorAdjustmentPreview.svelte
│   │   │   └── context.ts       # Canvas container ref for coordinate conversion
│   │   ├── elements/
│   │   │   ├── ClassBox.svelte
│   │   │   ├── AttributeRow.svelte
│   │   │   ├── MethodRow.svelte
│   │   │   ├── InlineEdit.svelte
│   │   │   ├── VisibilityIcon.svelte
│   │   │   ├── NoteBox.svelte
│   │   │   └── EdgeHotspots.svelte
│   │   ├── header/
│   │   │   └── Header.svelte
│   │   ├── relationships/
│   │   │   ├── RelationshipLayer.svelte
│   │   │   ├── RelationshipLine.svelte
│   │   │   ├── RelationshipHandles.svelte
│   │   │   └── MultiplicityLabels.svelte
│   │   ├── sidebar/
│   │   │   ├── Sidebar.svelte
│   │   │   ├── DiagramItem.svelte
│   │   │   ├── FolderItem.svelte
│   │   │   └── TrashSection.svelte
│   │   ├── toolbar/
│   │   │   └── Toolbar.svelte
│   │   ├── ui/
│   │   │   └── TypePicker.svelte
│   │   └── DiagramView.svelte
│   ├── stores/
│   │   ├── workspace.svelte.ts   # Diagram/folder CRUD, trash
│   │   ├── diagram.svelte.ts
│   │   ├── selection.svelte.ts
│   │   ├── history.svelte.ts
│   │   ├── connection.svelte.ts  # Drag-to-connect state
│   │   └── index.ts
│   ├── services/
│   │   └── storage.ts        # IndexedDB operations
│   ├── types/
│   │   ├── diagram.ts
│   │   ├── elements.ts
│   │   ├── geometry.ts
│   │   ├── relationships.ts
│   │   └── index.ts
│   └── utils/
│       ├── geometry.ts       # SVG path calculations, coordinate transforms
│       ├── id.ts             # UUID generation
│       ├── keyboard.ts       # Shortcut handling
│       └── index.ts
├── routes/
│   ├── +layout.svelte
│   ├── +layout.ts            # Prerender config (ssr=false)
│   ├── +page.svelte
│   └── layout.css            # Global styles (Tailwind)
├── app.d.ts
└── app.html
```

---

## Storage Schema (IndexedDB)

```
Database: board-diagrams (version 1)

Object Stores:
├── diagrams (keyPath: id)
│   └── { id, folderId, name, type, elements[], relationships[], viewport, createdAt, updatedAt, deletedAt }
├── folders (keyPath: id, index: parentId)
│   └── { id, name, parentId, deletedAt }
└── settings (keyPath: key)
    └── { key, value }

Notes:
- Elements and relationships are stored inline within diagrams (not separate stores)
- Settings used for lastDiagramId, folderExpandState, trashExpanded
- Soft delete via deletedAt field (null = active, Date = trashed)
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
- Diagram/folder data structures

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

### Milestone 4: Workspace Management
- Sidebar with folders and diagrams
- Drag-and-drop organization
- Create/rename/delete/trash diagrams and folders
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

Tests use `.spec.ts` suffix and can be run via `bun run test` or `bun run test:unit` (watch mode).

#### Utility Tests
- [x] `utils/geometry.ts` - SVG path calculations, anchor point math, orthogonal routing
- [ ] `utils/id.ts` - UUID generation uniqueness
- [ ] `utils/keyboard.ts` - Shortcut matching

#### Store Tests
- [x] `stores/history.svelte.ts` - Undo/redo stack, two-phase commit, diagram switching
- [ ] `stores/diagram.svelte.ts` - Element/relationship CRUD, viewport, auto-save
- [ ] `stores/selection.svelte.ts` - Selection state management
- [ ] `stores/workspace.svelte.ts` - Diagram/folder CRUD, trash operations

#### Service Tests
- [ ] `services/storage.ts` - IndexedDB CRUD operations (using fake-indexeddb)

---

## Interaction Design

### Canvas Interactions
- **Panning**: Shift+drag or middle mouse, or scroll (without modifiers)
- **Zoom**: Ctrl/Cmd + scroll wheel to zoom in/out
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

#### Drag-to-Connect Flow
1. **Edge hotspots**: Small connection zones appear on element edges when mouse hovers over element
2. **Start drag**: Click and drag from a hotspot to begin creating a relationship
3. **Drag preview**: Simple dashed line from source hotspot to cursor while dragging
4. **Drop target**:
   - Drop on element body = auto-pick optimal anchor based on relative positions
   - Drop on specific edge = that edge becomes the anchor point
5. **Type picker**: Dropdown menu appears at drop location with labeled options (Association, Inheritance, Implementation, Aggregation, Composition)
6. **Complete**: Select type to create relationship, or click away / Escape to cancel

#### Anchor Point Adjustment
- After creation, relationship endpoints can be dragged to different sides of connected elements
- Dragging an endpoint to a different element changes the connection target
- Visual feedback shows valid drop zones while dragging

#### Multiplicity Labels
- Click on label area near endpoint to enter inline edit mode
- Empty by default - only shown when user adds values
- Position: near source and target endpoints along the line

#### Line Style
- Orthogonal routing (90-degree angles only, rectilinear)
- Path recalculates when elements move or anchors change

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
- Add Note button
- Zoom controls

Note: Relationships are created via drag-to-connect from edge hotspots, not toolbar button.

### Sidebar
- **Organization**: Nested folders for diagrams with drag-and-drop
- **Navigation**: Simple scroll (no search/filter in MVP)
- **Diagram operations**: Create, rename, trash diagrams
- **Folder operations**: Create, rename, trash folders
- **Trash section**: View and restore/permanently delete trashed items

### Canvas Notes
- Plain text note boxes that can be placed on canvas
- Positioned and moved like class elements

### No Context Menu
- All actions via toolbar, sidebar, or keyboard shortcuts

---

## Data Management

### History
- **Undo limit**: 50 actions per diagram
- **Scope**: Per-session (clears on page reload)
- **Multi-diagram**: History persists when switching diagrams within session

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
- Undo/redo (50 actions)

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

## Implementation Status

### Completed (MVP Phase 1)

**Foundation:**
- SvelteKit 2 + Svelte 5 with runes (`$state`, `$derived`, `$effect`)
- TypeScript strict mode
- Tailwind CSS v4
- Static adapter for client-only app (prerender=true, ssr=false)

**Types** (`src/lib/types/`):
- `geometry.ts` - Point, Rect, Size, Viewport
- `elements.ts` - ClassElement, NoteElement, Attribute, Method, Parameter, type guards
- `relationships.ts` - Relationship, AnchorPoint, RelationshipType, RelationshipAnchors
- `diagram.ts` - Diagram, Folder (with soft delete support)

**Utilities** (`src/lib/utils/`):
- `id.ts` - UUID generation via `crypto.randomUUID()`
- `geometry.ts` - Anchor positioning, orthogonal path generation, coordinate transforms, rect calculations
- `keyboard.ts` - Keyboard shortcut matching with modifiers

**Actions** (`src/lib/actions/`):
- `draggable.svelte.ts` - Svelte action for multi-element drag-and-drop with viewport transforms

**Services** (`src/lib/services/`):
- `storage.ts` - IndexedDB wrapper (diagrams, folders, settings stores)

**Stores** (`src/lib/stores/`) - Svelte 5 runes:
- `workspace.svelte.ts` - Diagram/folder CRUD, trash operations, initialization, last-opened restore
- `diagram.svelte.ts` - Elements, relationships, viewport, attribute/method CRUD, auto-save
- `selection.svelte.ts` - Multi-selection state management
- `history.svelte.ts` - Per-diagram undo/redo manager (50 action limit, two-phase commit)
- `connection.svelte.ts` - Drag-to-connect and anchor adjustment state (discriminated union)

**Components** (`src/lib/components/`):
- `canvas/` - Canvas with CSS transform zoom/pan, dot grid background, connection previews
- `elements/` - ClassBox, NoteBox, AttributeRow, MethodRow, InlineEdit, VisibilityIcon, EdgeHotspots
- `relationships/` - RelationshipLayer, RelationshipLine, RelationshipHandles, MultiplicityLabels
- `sidebar/` - Sidebar with folders, DiagramItem, FolderItem, TrashSection (drag-and-drop organization)
- `toolbar/` - Element creation buttons, zoom controls
- `header/` - Logo, diagram name (inline editable), undo/redo buttons, keyboard shortcut handler
- `ui/` - TypePicker dropdown for relationship type selection
- `DiagramView.svelte` - Orchestrates canvas, elements, relationships, and connection flow

**Key Technical Decisions:**
- Arrow heads use `<polygon>`/`<polyline>` instead of SVG markers for cross-browser compatibility
- Orthogonal (90-degree) line routing between elements
- Auto-anchor selection based on relative element positions
- Debounced auto-save (500ms) to IndexedDB
- MutationObserver tracks element dimensions for relationship positioning
- Module-level store for canvas container rect (coordinate conversion across component boundaries)
- Discriminated union in connection store prevents invalid state combinations

### Phase 2 (Not Started)
- Export/Import (JSON, SVG, PNG)
- PWA service worker and manifest

---

## Reference

### board-old/
Reference for visual design inspiration only. Code patterns and architecture follow this new spec.
