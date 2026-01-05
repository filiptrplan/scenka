Here is the updated, complete **Design Document**. You can save this as `DESIGN.md` in your project root. This version includes the "Exception Logging" philosophy, the simplified Supabase architecture, and the specific Color grading logic.

---

# Project Design Document: Scenka

## 1. Executive Summary

**Scenka** is a mobile-first Progressive Web App (PWA) designed for rock climbers to track **technique failures** and **movement quality** rather than just success/failure counts.

**Core Philosophy:** "Exception Logging." Users do not log every warm-up. They only log climbs that were significant: projects they failed on, or sends that felt awkward/imperfect. The goal is to identify patterns in failure (e.g., "I always fail on Blue overhangs due to bad footwork").

## 2. Tech Stack

| Layer         | Technology                   | Reasoning                                                    |
| :------------ | :--------------------------- | :----------------------------------------------------------- |
| **Frontend**  | React (Vite) + TypeScript    | Industry standard, high AI proficiency.                      |
| **Styling**   | Tailwind CSS + shadcn/ui     | Rapid UI development, accessible, mobile-responsive.         |
| **State Mgt** | TanStack Query (React Query) | Handles caching, loading states, and server synchronization. |
| **Backend**   | Supabase                     | Postgres Database + Auth + RLS (Security).                   |
| **Auth**      | Supabase Auth                | Native support for Passkeys (WebAuthn) & Magic Links.        |
| **Hosting**   | Cloudflare Pages             | Fast, free SSL, excellent for static/SPA delivery.           |
| **Icons**     | Lucide React                 | Clean, consistent SVG icons.                                 |

## 3. Database Schema (PostgreSQL)

The database uses a flat structure to reduce logging friction.

### Tables

**1. `profiles`**

- `id` (uuid, PK): References `auth.users.id`
- `preferred_grade_scale` (text): Default `'font'`. Options: `'font'`, `'v_scale'`, `'color_circuit'`.
- `preferred_discipline` (text): Default `'boulder'`. Options: `'boulder'`, `'sport'`.
- `updated_at` (timestamp)

**2. `climbs`**

- `id` (uuid, PK): Default `gen_random_uuid()`
- `user_id` (uuid, FK): References `profiles.id`
- `created_at` (timestamptz): Default `now()`
- `location` (text): e.g., "Gym Name" or "Crag Name"
- `climb_type` (text): `'boulder'` or `'sport'`
- **Grading Columns:**
  - `grade_scale` (text): `'font'`, `'v_scale'`, or `'color_circuit'`
  - `grade_value` (text): Stores the raw value (e.g., "6a", "V4", "Blue").
- `style` (text[]): Array of tags. Options: `['Slab', 'Vert', 'Overhang', 'Roof', 'Dyno', 'Crimp', 'Sloper', 'Pinch']`
- `outcome` (text): Enum or Check constraint: `'Sent'`, `'Fail'`
- `awkwardness` (int): Range 1–5 (1 = Flow state, 5 = Desperate/ugly)
- `failure_reasons` (text[]): Array of tags. Categories:
  - _Physical:_ `['Pumped', 'Finger Strength', 'Core', 'Power']`
  - _Technical:_ `['Bad Feet', 'Body Position', 'Beta Error', 'Precision']`
  - _Mental:_ `['Fear', 'Commitment', 'Focus']`
- `notes` (text): Optional long-form text.

### Security (RLS)

- **Enable RLS on all tables.**
- **Policy:** Users can `SELECT`, `INSERT`, `UPDATE`, `DELETE` rows only where `auth.uid() = user_id`.

## 4. Domain Logic: Grading Systems

The app must support three grading scales.

**1. Font Scale:** (3 - 9c)
**2. V-Scale:** (VB - V17)
**3. Color:**

- **Teal:** Up to 3
- **Pink:** 3 to 5a
- **Green:** 5a to 6a
- **Blue:** 6a to 6c
- **Yellow:** 6b+ to 7a+
- **Red:** 7a to 7c
- **Black:** 7b+ to 8c...

_Note: The frontend must maintain a mapping utility to allow approximate conversions for statistics (e.g., Blue ≈ 6b)._

## 5. UI/UX Design

**Visual Language:** Dark Mode default. Large touch targets (44px+).

### Screen 1: Authentication

- **Primary Action:** "Sign in with Passkey" (Biometric).
- **Secondary:** "Sign in with Email" (Magic Link).

### Screen 2: Dashboard (Home)

- **Header:** User greeting + "Log Climb" button (Floating Action Button - FAB).
- **Recent Activity:** Infinite scroll list of `climb` cards.
  - _Card layout:_ Grade (Color dot or Text) + Location, Outcome badge, Tags, "Awkwardness" visual indicator.
- **Stats Teaser:** A mini-summary (e.g., "Technique Audit: 60% of failures due to Bad Feet").

### Screen 3: The Logger (Modal/Drawer)

- **Step 1: The Basics**
  - **Discipline:** Toggle Boulder/Sport.
  - **Grade System:** Dropdown to select Scale (Font/V/Color). Defaults to profile preference.
  - **Grade Input:**
    - _If Color:_ A flex-row of colored circles (Teal → Black).
    - _If Text:_ A scrolling wheel or grid.
  - **Location:** Text input (auto-complete history).
- **Step 2: The Result**
  - **Outcome:** Toggle Sent / Fail.
  - **Awkwardness:** Slider (1-5). Label changes dynamically (1="Perfect", 5="Sketchy").
- **Step 3: The "Why" (Technique Audit)**
  - Multi-select chips for `Style` (e.g., Overhang, Crimp).
  - Multi-select chips for `Failure Reasons` (if Fail) or `Imperfect Aspects` (if Sent).
- **Step 4: Submit**

### Screen 4: Analytics

- **Chart 1:** "Anti-Style" (Bar chart: Which wall angle/hold type causes the most failures?).
- **Chart 2:** "The Failure Radar" (Radar chart showing Physical vs. Technical vs. Mental).
- **Chart 3:** "Sends by Grade" (Stacked bar chart, grouped by the rough difficulty buckets defined in the Color scale).

## 6. PWA Specifications (`manifest.json`)

- **Name:** Scenka
- **Short Name:** Scenka
- **Start URL:** `/`
- **Display:** `standalone` (Hides browser URL bar)
- **Background Color:** `#09090b` (Zinc-950)
- **Theme Color:** `#09090b`
- **Icons:** 192x192, 512x512 (Maskable).

## 7. Development Roadmap

### Phase 1: Skeleton & Auth

1.  Initialize Vite + React + TS.
2.  Install Tailwind & shadcn/ui.
3.  Configure PWA manifest.
4.  Setup Supabase project & RLS policies.
5.  Implement Supabase Auth.

### Phase 2: Core Loop (CRUD)

1.  Create `src/lib/grades.ts` with the grading logic/constants.
2.  Build the "Logger" form component (using `react-hook-form` + `zod` for validation).
    - _Crucial:_ Implement the custom `GradePicker` component that renders colored buttons.
3.  Implement `useMutation` (TanStack Query) to save data to Supabase.
4.  Build the "Feed" component to list climbs.

### Phase 3: Analytics & Polish

1.  Install `recharts` for visualization.
2.  Implement grade normalization (mapping colors to numeric values) for the charts.
3.  Deploy to Cloudflare Pages.

---

## 8. Prompting Strategy (For AI Coding)

**For Database:**

> "Refer to the 'Database Schema' section of the Design Document. Write the SQL migration for Supabase. Include the `preferred_scale` in profiles."

**For the Grade Picker:**

> "Create a `GradePicker` component. It should accept a `scale` prop ('font', 'v_scale', 'color_circuit'). If 'color_circuit', render buttons for Teal, Pink, Green, Blue, Yellow, Red, Black using Tailwind colors. Return the string value (e.g., 'Blue')."

**For Analytics:**

> "I need to visualize my failures. Fetch all climbs where outcome='Fail'. Group them by `failure_reasons` and render a Recharts BarChart showing the top 5 reasons."
