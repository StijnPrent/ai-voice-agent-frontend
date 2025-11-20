# UI/UX & Styling Guide

This document describes the shared UI/UX patterns for the app (appointment types, staff, calendars). Use it to keep views consistent across teams.

> TL;DR — **Use the same building blocks**: `FormField`, `Input`, `Select`, `Button`, `Card`, `Tag`, `IconButton`, `Toggle`, `TimeRangePicker`, `Toast`. Keep spacing, radii, and typography consistent. Prefer *progressive disclosure* and *inline validation*.

---

## 1) Design Tokens

**Colors (semantic):**
- `--bg`: page backgrounds
- `--panel`: cards & form containers
- `--text`: primary text
- `--muted`: labels / helper text
- `--primary`: primary actions
- `--primary-contrast`: text on primary
- `--border`: dividers, input borders
- `--success`, `--warning`, `--danger`

> Never hardcode hex. Reference semantic tokens so theming remains possible.

**Typography:**
- Base font-size: `16px` (1rem)
- Headings: `h1 28/32`, `h2 22/28`, `h3 18/24`
- Body: `14–16px`, line-height `1.45–1.6`
- Sentence case for labels (Dutch UI): *“Google Calendar”*, *“Weekrooster”*

**Spacing scale:** `4, 8, 12, 16, 20, 24, 32`
- Inside cards: 16–24
- Between form groups: 16
- Between label and control: 8

**Radii & elevation:**
- Radius: `10–12px` on cards & inputs
- Shadow: subtle `panel` shadow; hover raises slightly

---

## 2) Core Components (contract)

### `<FormField>`
- Props: `label`, `helpText?`, `required?`, `error?`, `children`
- Behavior: label linked via `id/for`. Help text under field. Error replaces help text on invalid state.
- Layout: label left/top depending on width; mobile stacks.

### `<Input>` / `<Select>`
- Sizes: `md` by default (40px height). Use `sm` (32px) for time fields.
- Clear focus ring; disabled vs. readonly distinguishable.

### `<Toggle>`
- Binary states: `On/Off`, `Working/Off`.
- Accessibility: `aria-pressed`, keyboard Space/Enter toggles.

### `<TimeRangePicker>`
- Two compact time inputs with `to` label between.
- Validation: end must be after start; snap to 5-min steps.
- Support split shifts (0..N ranges). Add “+ Tijdblok” button when Working.
- Optional timezone display when connected to calendars.

### `<Button>`
- Variants: `primary`, `secondary`, `ghost`, `danger`
- Loading state: spinner + disabled
- Icon-only version = `<IconButton>` with tooltip.

### `<Card>`
- Title row (left) + actions (right)
- Body area can contain lists/preview
- Use for “Team leden” items & “Weekly schedule”

### `<Tag>`
- Small, rounded badges for skills/specialties/categories.

### `<Toast>`
- Success/Info/Error to confirm actions (“Afspraaktype toegevoegd”).

---

## 3) Form Patterns

### 3.1 Appointment Type (reference pattern)
- Row 1: **Dienst** (60%) | **Duur (min)** (20%) | **Prijs (€)** (20%)
- Row 2: **Categorie** (Select) | **Beschrijving** (full width)
- Preset library sits above as a Select with preview badge after selection.
- CTA: **+ Afspraaktype toevoegen** as primary button (full width on mobile).
- Validation: inline; show numeric only errors for price/duration.

### 3.2 Staff / Weekly Availability (apply the same type of input)
- Top row: **Naam** (50%) | **Rol/titel** (50%)
- Second row: **Google Calendar** (Select with status chip) | **Specialiteiten** (tags input)
- **Weekly Availability** card:
  - For each day: `Toggle(Working/Off)` + `TimeRangePicker` (disabled when Off).
  - Quick actions above list: `Ma–Vr`, `Za/Zo`, `Kopieer van vorige week`, `Alles wissen`.
  - Support **multiple time blocks** per day (“+ Tijdblok” appears when Working).
  - Show **conflict warnings** when ranges overlap.
  - Save as **Preview** card underneath (“4 days/week”, first/last time shown).
- Add member with primary CTA; success toast “Staflid toegevoegd”.

**Empty vs. Connected Google Calendar**
- When connected, show a small status chip: `Verbonden` + calendar email.
- Provide “Sync now” and show last sync time in muted text.

---

## 4) Interaction States & Accessibility

- Every interactive element must have `:hover`, `:focus-visible`, `:active`, `:disabled`.
- Focus outline must be visible (WCAG AA). Avoid removing outlines.
- Keyboard support:
  - Tab navigation through inputs
  - Space/Enter toggles switches
  - Esc closes dialogs/menus
- Form submit: allow Enter to submit; prevent double-submit with loading state.

---

## 5) Content Guidelines (Dutch UI)

- Use short, concrete labels: **Naam**, **Rol/titel**, **Specialiteiten**, **Prijs (€)**.
- Helper text examples:
  - Prijs: *“Laat leeg voor gratis dienst.”*
  - Duur: *“In minuten.”*
  - Beschrijving: *“Optioneel. Max 200 tekens.”*
- Confirmation copy:
  - Success: *“Toegevoegd”*, *“Opgeslagen”*
  - Dangerous: *“Weet je zeker dat je dit wilt verwijderen?”*

---

## 6) Cards: Team Leden

- Card header: avatar/initials + name + role; actions (edit/delete) as `IconButton` w/ tooltip, visible on hover.
- Inside card: tags (skills), calendar status line, weekly schedule table in a muted `panel`.
- Right-aligned small badge: `4 days/week` etc.
- Use the same `WeeklySchedulePreview` component in all places.

---

## 7) Visual Rhythm & Layout

- Use a max content width (1200–1280px).
- Sections separated by 24–32px.
- Inside the `Weekly Availability` container, use light background to differentiate (e.g., `--panel-muted`).

---

## 8) Error Handling

- Inline errors; avoid dialogs for validation.
- On save failure, show toast with retry and keep user input intact.
- Network states: skeletons for card lists, disabled buttons while loading.

---

## 9) Example Markup (framework-agnostic)

```html
<form class="card">
  <h2>Nieuwe medewerker toevoegen</h2>
  <div class="row">
    <FormField label="Naam" required>
      <Input id="name" />
    </FormField>
    <FormField label="Rol/titel">
      <Input id="role" />
    </FormField>
  </div>
  <div class="row">
    <FormField label="Google Calendar">
      <Select id="gcal">
        <option>Geen koppeling</option>
      </Select>
    </FormField>
    <FormField label="Specialiteiten">
      <Input id="skills" placeholder="bijv. Knippen, Kleuren" />
    </FormField>
  </div>

  <Card title="Weekly Availability">
    <WeekAvailability>
      <!-- For each day: Toggle + TimeRangePicker -->
    </WeekAvailability>
  </Card>

  <Button variant="primary">+ Add Staff Member</Button>
</form>
```

---

## 10) Do & Don’t

**Do**
- Keep inputs sized to expected content (e.g., time fields = narrow)
- Group related items horizontally
- Use semantic tokens + components
- Provide microfeedback (toasts, inline labels)

**Don’t**
- Mix inconsistent paddings
- Hide validation until submit
- Use icon-only buttons without tooltips
- Add new colors outside tokens

---

## 11) File & Folder Conventions

- `/components/ui/*` — primitives (Input, Button, Select, Toggle, Card, Tag, Toast)
- `/components/composite/*` — composed widgets (WeekAvailability, TimeRangePicker, SchedulePreview)
- `/views/*` — page-level layouts using composites
- `/styles/tokens.css` — CSS variables for tokens

---

## 12) Checklists

**Before merging:**
- [ ] Uses tokens (no raw hex)
- [ ] Reuses primitives
- [ ] Mobile-friendly (min 320px)
- [ ] Keyboard accessible
- [ ] Inline validation included
- [ ] Copy reviewed (Dutch labels)

**QA scenarios:**
- [ ] Add staff with split shift (09:00–12:00 & 13:00–17:00)
- [ ] Turn off a weekday; ensure times disable
- [ ] Calendar connected vs not connected
- [ ] Overlapping time blocks flagged
- [ ] Appointment with empty price allowed
```

