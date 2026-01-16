# Mobile-First Restructuring Plan for VehicleDetail.tsx

## Current Issues:
1. Desktop-first design with mobile afterthoughts
2. Large padding/spacing not optimized for mobile
3. Complex header taking too much screen space
4. Buttons not touch-friendly
5. Tabs navigation too cluttered on mobile

## Mobile-First Solution:

### 1. Header Redesign (Mobile Priority)
- Compact header on mobile with essential info only
- Photo thumbnail instead of large image
- Plate number prominent but not huge
- Stats in compact grid

### 2. Action Buttons
- Bottom sheet/sticky footer for primary actions
- Larger touch targets (min 44x44px)
- Icon + text for clarity

### 3. Tabs Navigation
- Swipeable cards instead of tabs
- Or bottom tab bar (mobile standard)
- Icons only on very small screens

### 4. Content Sections
- Single column on mobile
- Collapsible sections
- Lazy loading for heavy content

### 5. Forms & Modals
- Full-screen modals on mobile
- Bottom sheets for quick actions
- Numeric keypad for number inputs

## Implementation Priority:
1. ✅ Fix header to be mobile-compact
2. ✅ Sticky bottom action bar
3. ✅ Redesign tabs for mobile
4. ✅ Optimize all form inputs
5. ✅ Ensure all content sections are responsive
