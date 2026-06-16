# Roadmap

This roadmap separates current direction from completed work. Items may change as the project matures and real inspection workflows are tested.

## 1. Route Optimisation MVP

- Improve the current address-entry and route-generation flow.
- Add clearer validation for incomplete or invalid addresses.
- Add tests for time calculations, route options, and run generation.
- Document Google Maps API requirements.

## 2. Multi-Day Scheduling

- Improve support for runs that exceed a single working day.
- Make overnight stops easier to review and edit.
- Add clearer warnings when travel and inspection time exceed the configured workday.
- Support practical day-by-day run summaries.

## 3. Priority Weighting

- Add priority fields for inspection locations.
- Allow high-priority stops to influence route order.
- Support target time windows for urgent or constrained inspections.
- Show when a priority or time-window constraint affects the route.

## 4. Map Integration

- Refine route rendering and stop selection behaviour.
- Improve mobile map usability.
- Add clearer stop labels and day colours.
- Investigate geocoding confidence and address correction workflows.

## 5. Export To CSV/PDF

- Export run tables to CSV.
- Generate PDF run sheets for field use.
- Include start time, ETA, ETD, travel time, inspection duration, and notes.
- Keep exported files free of unnecessary application metadata.

## 6. Team Allocation

- Assign runs to individual consultants or teams.
- Support workload balancing across multiple field staff.
- Track capacity, travel limits, and inspection types.
- Add simple admin views for team planning.

## 7. Calendar Integration

- Export inspection runs to calendar-friendly formats.
- Investigate Google Calendar and Outlook Calendar integration.
- Include travel blocks and inspection appointment blocks.
- Support updates when route timing changes.
