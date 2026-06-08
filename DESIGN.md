# Design System for SmartDine: Swiggy and Zomato Inspired

A high-performance, mobile-first, high-fidelity UI design system modeled on premium food delivery platforms (Swiggy, Zomato) to optimize user flow, enhance appetite appeal, and leverage standard HCI principles.

## Visual Language

### Colors
- **Brand Primary Accent:** Warm Tomato Red / Coral Flame (`#E23744`) or Sweet Mango Orange (`#FC8019`). Let's use a premium Crimson Flame (`#F97316`) gradient to bridge both platforms.
- **Background Mode:** Elegant Dark Coal (`#111827` / `#0B0F19`) and clean Pure White (`#FFFFFF`).
- **Accent Indicators:**
  - Veg Indicator: Fresh Grass Green (`#22C55E` - square border with green circle inside).
  - Non-Veg Indicator: Crimson Maroon (`#EF4444` - triangle or square border with red triangle/dot inside).
  - Highlights: Golden Amber (`#F59E0B`) for ratings and "Bestseller" badges.

### Typography
- **Headlines / Titles:** Montserrat or Outfit (bold, geometric, friendly).
- **Body Text:** Inter or Public Sans (neutral, high legibility at small sizes).
- **Font Scale:**
  - Item Title: 16px, Semi-Bold, Dark Charcoal / White
  - Price: 15px, Bold
  - Description: 12px, Regular, Muted Slate
  - Badges: 10px, Bold, Uppercase

### Roundness & Spacing
- **Card Corners:** `16px` (ROUND_TWELVE) for soft, modern, high-quality cards.
- **Button Corners:** `12px` or fully rounded (`9999px`) for touch targets.
- **Grid Spacing:** `12px` to `16px` padding for visual breathing room.

## HCI & UX Design Principles

1. **Jakob's Law (User Familiarity):**
   Users spend most of their time on other apps (Swiggy, Zomato). SmartDine copies their standard list item layout:
   - Text details (Veg icon, Title, Rating, Price, Description) on the left.
   - Square food photo on the right.
   - The interactive "ADD" button floats half-overlapping the bottom center of the photo.
   - Clicking "ADD" transforms the button into a `-` `QTY` `+` stepper, matching user expectations.

2. **Hick's Law (Reducing Cognitive Load):**
   - Categorize the menu using prominent horizontal scrolling pills with emoji icons at the top.
   - Implement a clear "Veg Only" toggle switch to instantly filter options.
   - Keep description text truncated to 2 lines unless expanded.

3. **Fitts's Law (Target Acquisition):**
   - Add buttons and quantity selectors are sized to at least `44px` height for effortless tapping on mobile.
   - Sticky bottom bar displays the active cart summary with a large, bright "View Cart" action.

4. **Aesthetic-Usability Effect:**
   - Soft shadows, glassmorphism headers, gradient backdrops, and micro-animations make the app feel extremely professional and secure, increasing trust in checkout and online payment.
