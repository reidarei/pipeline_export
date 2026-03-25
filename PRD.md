# Planning Guide

A consultancy project pipeline management tool that visualizes projects and consultant assignments in a Gantt-style timeline, enabling drag-and-drop scheduling and resource allocation for pipeline meetings.

**Experience Qualities**:
1. **Intuitive** - Direct manipulation through drag-and-drop for dates and consultant assignments feels natural and immediate
2. **Visual** - Clear timeline representation with consultant avatars and color-coded projects provides at-a-glance understanding of resource allocation
3. **Efficient** - Quick switching between Gantt view and table views enables both high-level pipeline review and detailed data editing

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This app requires sophisticated interactions including drag-and-drop in multiple contexts (timeline adjustment, consultant assignment), multiple synchronized views (Gantt, project table, consultant table), date range manipulation, and percentage-based resource allocation tracking.

## Essential Features

### Gantt Timeline View
- **Functionality**: Displays all projects as horizontal bars on a timeline with consultant avatars overlaid, showing 6-month view by default
- **Purpose**: Primary view for pipeline meetings to visualize project overlaps, consultant allocation, and timeline
- **Trigger**: Default view on app load, or via view switcher
- **Progression**: Load projects → Render timeline grid (months/weeks) → Display project bars positioned by dates → Overlay consultant avatars on each project bar
- **Success criteria**: All projects visible with correct date positioning, consultant avatars clearly displayed on projects, timeline scrollable/adjustable

### Drag to Adjust Project Dates
- **Functionality**: User can drag the left/right edges of project bars to adjust start/end dates, or drag entire bar to move both dates
- **Purpose**: Enables rapid schedule adjustments during pipeline discussions
- **Trigger**: User clicks and drags project bar edge or center
- **Progression**: Mouse down on project bar → Visual feedback (cursor change, highlight) → Drag left/right → Project bar resizes/moves in real-time → Release updates underlying data → Adjacent views refresh
- **Success criteria**: Smooth dragging with visual feedback, date updates persist, no date conflicts or invalid states

### Drag Consultants to Projects
- **Functionality**: Consultant avatars can be dragged from sidebar or from other projects onto project bars to assign/reassign
- **Purpose**: Visual resource allocation that mirrors physical whiteboard workflow
- **Trigger**: User clicks and drags consultant avatar
- **Progression**: Mouse down on consultant avatar → Avatar follows cursor with visual feedback → Hover over target project (highlight) → Drop on project → Assignment modal appears for percentage input → Confirm → Avatar appears on project bar
- **Success criteria**: Smooth drag operation, clear drop zones, percentage assignment captured, consultant appears on project

### Timeline Range Adjustment
- **Functionality**: Controls to shift timeline view (previous/next 6 months) or select custom date range
- **Purpose**: Navigate beyond default 6-month view to see past/future projects
- **Trigger**: User clicks navigation arrows or date range selector
- **Progression**: Click previous/next → Timeline shifts by defined period → Project bars re-render for new date range → Month headers update
- **Success criteria**: Smooth transitions, all projects in range visible, date headers accurate

### Projects Table View
- **Functionality**: Tabular display of all projects with columns for customer, name, start date, end date, assigned consultants
- **Purpose**: Detailed project data editing and sorting
- **Trigger**: User clicks "Projects" view tab
- **Progression**: Click view → Table renders with all project data → User can click cells to edit → User can click headers to sort → Changes persist to data store
- **Success criteria**: All project fields editable, sorting works on all columns, inline editing persists changes

### Consultants Table View
- **Functionality**: Tabular display of all consultants with columns for picture, name, level, current project assignments
- **Purpose**: Manage consultant roster and view availability/allocation
- **Trigger**: User clicks "Consultants" view tab
- **Progression**: Click view → Table renders with all consultant data → User can edit name/level → User can upload/change avatar → View shows which projects consultant is assigned to → Changes persist
- **Success criteria**: Consultant data editable, avatar upload works, project assignments visible per consultant

### Add/Remove Projects and Consultants
- **Functionality**: Buttons to create new projects/consultants and delete existing ones
- **Purpose**: Maintain accurate pipeline data as business needs change
- **Trigger**: User clicks "Add Project/Consultant" button or delete icon on item
- **Progression**: Click add → Modal/form appears → Fill required fields → Submit → New item appears in views → OR → Click delete → Confirmation dialog → Confirm → Item removed from all views
- **Success criteria**: New items appear immediately, deletions remove from all views, data persists

## Edge Case Handling

- **Overlapping Projects**: Display overlapping project bars with slight vertical offset or transparency to show all projects clearly
- **Too Many Consultant Avatars**: If a project has many consultants, show first 3-4 avatars with "+N more" indicator, click to see full list
- **Invalid Date Ranges**: Prevent end date from being before start date during drag operations, show visual feedback
- **Empty States**: Show helpful messages and "Add" buttons when no projects or consultants exist
- **Long Project Names**: Truncate with ellipsis in Gantt view, show full name on hover tooltip
- **Timeline Edge Cases**: Handle projects extending beyond visible timeline range with visual indicators
- **Drag Conflicts**: Prevent invalid drops (e.g., consultant already at 100% allocation during that period) with visual feedback

## Design Direction

The design should evoke the familiar, tactile feel of a physical whiteboard used in planning meetings - approachable, colorful, and collaborative. It should feel like a digital transformation of the existing whiteboard process, maintaining visual warmth while adding interactive superpowers.

## Color Selection

A soft, pastel-inspired palette that mirrors typical whiteboard planning aesthetics with distinct colors for each month creating visual rhythm along the timeline.

- **Primary Color**: oklch(0.55 0.15 250) - A medium purple-blue that conveys structure and professionalism without being corporate
- **Secondary Colors**: 
  - oklch(0.90 0.08 180) - Soft cyan for table backgrounds and secondary UI
  - oklch(0.95 0.05 120) - Light mint for alternating table rows
  - oklch(0.92 0.06 60) - Pale yellow for highlights and hover states
- **Accent Color**: oklch(0.65 0.18 25) - Warm coral-pink for primary actions and active states
- **Month Colors** (for timeline headers, cycling):
  - January/July: oklch(0.88 0.10 50) - Soft yellow
  - February/August: oklch(0.85 0.12 160) - Soft cyan
  - March/September: oklch(0.88 0.10 330) - Soft pink
  - April/October: oklch(0.88 0.08 80) - Soft lime
  - May/November: oklch(0.85 0.12 200) - Soft blue
  - June/December: oklch(0.88 0.10 290) - Soft purple
- **Foreground/Background Pairings**:
  - Background (White #FFFFFF): Foreground oklch(0.25 0.02 260) - Ratio 13.8:1 ✓
  - Primary (Purple-Blue oklch(0.55 0.15 250)): White text oklch(1 0 0) - Ratio 5.2:1 ✓
  - Accent (Coral-Pink oklch(0.65 0.18 25)): White text oklch(1 0 0) - Ratio 4.6:1 ✓
  - Project Bars (Light pastels): Dark text oklch(0.25 0.02 260) - Ratio 12+:1 ✓

## Font Selection

The typography should balance approachability with clarity, supporting both the casual whiteboard aesthetic and professional data presentation needs.

- **Primary**: Space Grotesk - A geometric sans-serif with friendly roundness that works for both headings and UI elements, bringing warmth without sacrificing legibility
- **Data/Tables**: JetBrains Mono - A monospace font for tabular data that ensures alignment and readability of dates, percentages, and structured information

- **Typographic Hierarchy**:
  - H1 (View Title): Space Grotesk Bold/32px/tight letter-spacing/-0.02em
  - H2 (Section Headers): Space Grotesk Semibold/20px/normal/0em
  - Body (UI Elements): Space Grotesk Regular/15px/relaxed/1.5 line-height
  - Table Data: JetBrains Mono Regular/14px/normal/1.4 line-height
  - Small (Labels): Space Grotesk Medium/13px/normal/uppercase 0.05em tracking
  - Project Names (Gantt): Space Grotesk Medium/14px/tight

## Animations

Animations should reinforce the physical manipulation metaphor - making digital interactions feel as tangible as moving cards on a whiteboard.

- **Drag Operations**: Smooth transform with slight scale (1.05) and shadow increase on pickup, subtle elastic snap when dropped
- **View Transitions**: 300ms ease-out fade with slight vertical shift (10px) when switching between Gantt/Table views
- **Timeline Scrolling**: Smooth kinetic scrolling with momentum, subtle parallax on month headers
- **Hover States**: Quick 150ms scale (1.02) on interactive elements like consultant avatars and project bars
- **Data Updates**: Brief highlight pulse (300ms) on cells/bars when data changes
- **Modal Appearances**: Backdrop blur-in (200ms) with modal scale-up from 0.95 to 1.0 (250ms ease-out)

## Component Selection

- **Components**:
  - **Tabs**: For view switching (Gantt, Projects Table, Consultants Table) - modified with larger touch targets and rounded pill styling
  - **Table**: For project and consultant list views - with sortable headers using custom styling
  - **Dialog**: For adding/editing projects and consultants, percentage assignment modals
  - **Avatar**: For consultant profile pictures throughout - with fallback initials
  - **Button**: For all actions (Add Project, Add Consultant, navigation) - with distinct primary/secondary variants
  - **Input**: For inline editing in tables and forms
  - **Label**: For form fields in dialogs
  - **Card**: For consultant sidebar in Gantt view
  - **ScrollArea**: For timeline horizontal scrolling and long tables
  - **Select**: For consultant level dropdown and date range presets
  - **Calendar** (via date-fns): For date picking in edit dialogs
  - **Badge**: For consultant levels and percentage indicators
  - **Separator**: For visual division between sections

- **Customizations**:
  - **GanttTimeline**: Custom component with month/week grid, project bars as draggable divs using framer-motion, consultant avatars positioned absolutely
  - **ConsultantAvatar**: Draggable wrapper around Avatar component with drag handle styling
  - **ProjectBar**: Custom component with resize handles on edges, droppable zone for consultants
  - **TimelineRuler**: Custom component rendering month headers with pastel backgrounds
  - **AllocationIndicator**: Custom visual showing consultant percentage on project bars

- **States**:
  - **Buttons**: Default with soft shadow, hover with subtle lift and scale, active with slight press-down, disabled with reduced opacity
  - **Project Bars**: Default with soft border, hover with highlight glow, dragging with increased shadow and scale, drop-target with dashed border pulse
  - **Consultant Avatars**: Default with border, hover with scale and cursor change, dragging with follow cursor and transparency, invalid drop target with shake animation
  - **Table Rows**: Default white, hover with pale yellow background, editing with border highlight
  - **Inputs**: Default with subtle border, focus with primary color ring and border, error with destructive color

- **Icon Selection**:
  - **Plus**: Add new project/consultant
  - **Trash**: Delete items
  - **CalendarBlank**: Date-related actions
  - **CaretLeft/Right**: Timeline navigation
  - **Table**: Table view icon
  - **ChartBar**: Gantt view icon
  - **Users**: Consultants view icon
  - **DotsSixVertical**: Drag handle
  - **X**: Close modals/remove assignments
  - **Check**: Confirm actions
  - **MagnifyingGlass**: Search/filter

- **Spacing**:
  - Section gaps: gap-8 (32px)
  - Component gaps: gap-4 (16px)
  - Button padding: px-6 py-3
  - Card padding: p-6
  - Table cell padding: px-4 py-3
  - Timeline grid: 120px per month column
  - Avatar size: h-10 w-10 (40px) in Gantt, h-12 w-12 (48px) in tables
  - Project bar height: 48px with 8px margin

- **Mobile**:
  - Gantt view shows 3 months at a time instead of 6, with horizontal scroll
  - Consultant sidebar collapses to bottom sheet
  - Tables show priority columns only, with expand for all fields
  - Drag-and-drop replaced with tap-to-select and modal assignment on mobile
  - Timeline navigation buttons larger and sticky
  - View tabs become full-width stacked buttons
