# BetaBreak UI Design System

## Design Philosophy

BetaBreak uses a dark, brutalist design language that prioritizes clarity, boldness, and mobile-first usability. The design emphasizes high contrast, clear information hierarchy, and intentional use of whitespace.

## Color Palette

### Backgrounds

- **Primary Background:** `#0a0a0a` (near-black)
- **Secondary Background:** `bg-white/[0.02]` (subtle white overlay)
- **Card Background:** `bg-white/[0.02]` with `border-2 border-white/10`

### Text Colors

- **Primary Text:** `text-[#f5f5f5]` (off-white)
- **Secondary Text:** `text-[#ccc]` (light gray)
- **Muted Text:** `text-[#888]` (gray for labels)
- **Accent Text:** `text-white` (for emphasized elements)

### Borders

- **Default Border:** `border-white/10` (10% opacity white)
- **Hover Border:** `border-white/30` (30% opacity white)
- **Active Border:** `border-white/30` with `bg-white/10`

### Outcome Colors

- **Success (Sent):** `bg-emerald-500/10`, `border-emerald-500/50`, `text-emerald-400`
- **Failure (Fail):** `bg-red-500/10`, `border-red-500/50`, `text-red-400`

### Buttons

- **Primary Button:** `bg-white text-black hover:bg-white/90` with `font-black`
- **Secondary Button:** `border-white/10 hover:border-white/30 bg-white/[0.02] text-[#888]`

## Typography

### Font Families

- **Primary:** System sans-serif (default)
- **Monospace:** For labels, tags, and technical information

### Type Scale

#### Headings

- **Page Title:** `text-4xl font-black tracking-tighter uppercase`
- **Section Title:** `text-3xl font-black tracking-tighter uppercase`

#### Labels

- **Field Label:** `text-xs font-mono text-[#666] uppercase tracking-wider`
- **Secondary Label:** `text-sm font-mono text-[#666] uppercase tracking-wider`

#### Body

- **Default:** `text-sm` or `text-base`
- **Accent/Grade:** `text-3xl font-black tracking-tight`
- **Small Text:** `text-xs`

#### Tags/Badges

- **Style Tags:** `text-xs font-mono uppercase`
- **Outcome Tags:** `text-xs font-black uppercase tracking-wider`

## Components

### Cards/Climb Entries

```tsx
<div className="bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200">
  {/* Card content */}
</div>
```

**Structure:**

1. Header: Date (top-left) + Grade + Outcome (top-right)
2. Meta: Awkwardness rating with Flame icon
3. Tags: Style badges and Failure Reason badges
4. Notes: Optional section with separator border

### Buttons

#### Primary Button (Submit)

```tsx
<Button className="bg-white text-black hover:bg-white/90 font-black" size="lg">
  LOG CLIMB
</Button>
```

#### Secondary/Toggle Button

```tsx
<button
  className={cn(
    'flex-1 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all',
    isActive
      ? 'bg-white/10 border-white/30 text-white'
      : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
  )}
>
  Label
</button>
```

#### Outcome Buttons

```tsx
<button
  className={cn(
    'flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all',
    outcome === 'Sent'
      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
      : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
  )}
>
  <TrendingUp className="h-4 w-4" />
  <span className="text-xs font-black uppercase tracking-wider">Sent</span>
</button>
```

### Badges

#### Default Badge (Selected)

```tsx
<Badge variant="default" className="text-xs font-mono uppercase">
  Content
</Badge>
```

Uses `bg-white/10 border-white/30 text-white`

#### Outline Badge (Unselected)

```tsx
<Badge variant="outline" className="text-xs font-mono uppercase border-white/20 text-[#ccc]">
  Content
</Badge>
```

### Input Fields

```tsx
<Input
  className="border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/30"
  placeholder="..."
/>
```

### Select/Dropdown

```tsx
<Select>
  <SelectTrigger className="border-white/10 bg-white/[0.02] text-white hover:border-white/30">
    <SelectValue />
  </SelectTrigger>
  <SelectContent className="bg-[#1a1a1a] text-white border-white/10">
    <SelectItem className="focus:bg-white/10 focus:text-white">Option</SelectItem>
  </SelectContent>
</Select>
```

**Note:** SelectContent uses `bg-[#1a1a1a]` for dark background, SelectItem hover state is `bg-white/10`

### Textarea

```tsx
<Textarea
  className="border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/30"
  placeholder="..."
/>
```

### Slider

```tsx
<Slider
  value={[value]}
  onValueChange={(value) => setValue(value[0])}
  min={1}
  max={5}
  step={1}
  className="py-4"
/>
```

**Slider Styling:**

- Track: `bg-white/10`
- Range/Fill: `bg-white`
- Thumb: `h-5 w-5 rounded-full border-2 border-white/30 bg-white` with shadow-lg

## Layout Patterns

### Section Separators

```tsx
<div className="space-y-4 pt-4 border-t border-white/10">{/* Section content */}</div>
```

### Responsive Containers

- **Mobile:** `max-w-2xl` with centered padding `p-4`
- **Touch Targets:** Minimum 44px height for all interactive elements

## Spacing

- **Section Gap:** `gap-4` or `space-y-4`
- **Card Padding:** `p-6`
- **Element Spacing:** `gap-2` for badges and tags
- **Form Groups:** `space-y-2` for label + input pairs

## Transitions

- **Default Duration:** `duration-200`
- **All Interactive Elements:** `transition-all`
- **Hover States:** Slight opacity or border changes

## Icons

Uses Lucide React icons. Common usage patterns:

- **MapPin:** Location labels (h-3 w-3)
- **Flame:** Awkwardness rating (h-4 w-4)
- **TrendingUp:** Success/Sent outcome (h-4 w-4)
- **TrendingDown:** Failure/Fail outcome (h-4 w-4)
- **Plus:** Floating Action Button (h-8 w-8)

## Accessibility

- **Touch Targets:** 44px minimum height
- **Contrast:** High contrast between text (#f5f5f5) and background (#0a0a0a)
- **Focus States:** Visible focus rings on all interactive elements
- **Labels:** All form inputs have associated labels
- **Screen Readers:** Use `sr-only` for icon-only buttons

## Responsive Behavior

- **Mobile (<768px):** Full-width cards, bottom sheet for forms, fixed FAB
- **Desktop (≥768px):** Centered content, sheet becomes modal

## Dark Mode Only

The design is dark mode only. No light mode variants are needed.

## Common Patterns

### Date + Location Display

```tsx
<div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-1">
  {date}
</div>
<div className="text-xs font-mono text-[#666] uppercase tracking-wider flex items-center gap-1">
  <MapPin className="h-3 w-3" />
  {location}
</div>
```

### Grade Display

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm font-mono text-[#666]">{scale}</span>
  <div className="text-3xl font-black tracking-tight">{grade}</div>
</div>
```

### Notes Section

```tsx
<div className="mt-4 pt-4 border-t border-white/10">
  <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">Notes</div>
  <p className="text-sm text-[#bbb] leading-relaxed">{notes}</p>
</div>
```

## Color Circuit Grades

When rendering color circuit grades, use the predefined colors from `lib/grades.ts`:

- Teal, Pink, Green, Blue, Yellow, Red, Black

Render as circular buttons (56px diameter) with opacity changes for selection state.
