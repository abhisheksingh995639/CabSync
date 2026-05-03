# CabSync Design System

## Color Palette ("Sunflower Fields")

This project follows a strict 60-30-10 UI/UX rule utilizing the "Sunflower Fields" palette to create a cohesive, modern light theme.

### Core Colors
* **Light Gray**: `#D6D6D6`
* **Light Yellow**: `#FFEE32`
* **Deep Yellow (Gold)**: `#FFD100`
* **Dark Gray (Almost Black)**: `#202020`
* **Dark Gray**: `#333533`

---

### The 60-30-10 Rule Application

#### 60% Dominant: Backgrounds & Whitespace
We use bright whitespace alongside the Light Gray (`#D6D6D6`) to maintain a clean, readable light theme interface without feeling overwhelming. 
* **Primary Background**: `#FFFFFF` (Used for the main app body and cards)
* **Secondary Background**: `#D6D6D6` (Used for borders, inactive states, and structural separation)

#### 30% Secondary: Text, Navigation, & Data
The dark grays are utilized for typography to provide high contrast and accessibility against the light backgrounds, as well as for icon coloring.
* **Primary Text / Headings**: `#202020`
* **Secondary Text / Subtitles**: `#333533`

#### 10% Accent: Highlights, Calls to Action, & Hero Section
The vibrant yellows serve to draw immediate attention to interactive elements, active states, and brand identifiers. `#FFD100` is the primary brand accent.
* **Primary Accent / Hero Background**: `#FFD100` (Used as the dominant background color in the Dashboard Hero section, and for primary buttons).
* **Secondary Accent / Hover States**: `#FFEE32` (Used for active navigation links and border highlights).

---

## Typography
* **Font Family**: `Inter`, system-ui, -apple-system, sans-serif
* **Headings**: Bold (700-800 weight) using `#202020`
* **Body text**: Regular/Medium (400-500 weight) using `#333533`

## UI Components
* **Cards**: Clean `#FFFFFF` backgrounds with soft shadows (`var(--shadow-md)`) and `1rem` rounded corners.
* **Buttons**: Fully rounded/pill-shaped (`border-radius: 9999px`) for a modern, approachable feel. Primary buttons use the `#FFD100` accent color combined with `#202020` text to ensure maximum readability.
* **Chat Bubbles**: Incoming messages use a clean white bubble with a `#D6D6D6` border, while outgoing messages utilize the `#FFD100` accent.
