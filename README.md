# Route Optimizer

Field inspection route optimisation for engineers, assessors, and site-based consultants.

Route Optimizer is a Next.js application for planning inspection runs across multiple site addresses. It helps field teams enter inspection locations, calculate a practical driving sequence, estimate arrival and departure times, and view the run on a Google Map.

The current app provides a working browser-based route planning interface. Several broader scheduling, export, and team workflow features are planned and tracked in the roadmap.

## Who It Is For

- Structural, forensic, civil, and building engineers planning inspection days.
- Insurance assessors and loss adjusters visiting claim sites.
- Site-based consultants managing multiple field appointments.
- Operations teams preparing daily inspection runs for field staff.

## Key Features

- Enter a start address and up to 20 inspection stops.
- Paste multiple addresses, one per line, for faster run setup.
- Use Google Directions waypoint optimisation to order stops.
- View the route and stop markers on a Google Map.
- Set default inspection duration, per-stop duration, start time, and end-of-day time.
- Calculate ETA, ETD, travel time to the next stop, total travel time, and total run time.
- Configure route options such as avoiding tolls, ferries, or highways.
- Choose whether the run returns to the start address or ends elsewhere.
- Add overnight accommodation handling for longer inspection runs.
- Store local draft run settings in the browser.
- Register and log in users with Prisma-backed PostgreSQL storage.
- Create and retrieve route-run records through API endpoints.

## Screenshots And Demo

Screenshots and a hosted demo are planned.

Suggested placeholders:

- `docs/screenshots/run-planner.png` - route planning view with address input and run table.
- `docs/screenshots/map-view.png` - map view with calculated route and stop markers.
- `docs/screenshots/settings.png` - route and schedule settings.

## Tech Stack

- Next.js 15 with the App Router.
- React 19 and TypeScript.
- Tailwind CSS with HeroUI components.
- Google Maps JavaScript API, Places, Directions, and Distance Matrix services.
- Prisma ORM with PostgreSQL.
- bcryptjs for password hashing.
- Luxon for date and time calculations.

## GitHub Repository Details

Suggested repository description:

> Field inspection route optimisation for engineers, assessors, and site-based consultants.

Suggested GitHub topics:

`route-optimization`, `inspections`, `field-service`, `insurance`, `engineering`, `nextjs`, `typescript`, `maps`

## Installation

Prerequisites:

- Node.js 20 or newer.
- npm.
- PostgreSQL database, such as Neon or a local PostgreSQL instance.
- Google Maps API key with Maps JavaScript API, Places API, Directions API, Geocoding API, and Distance Matrix API enabled.

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set the required environment variables in `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
NEXT_PUBLIC_ADMIN_EMAIL="admin@example.com"
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply the database schema during local setup:

```bash
npx prisma db push
```

## Local Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run build
npm run start
npm run lint
npx prisma studio
```

Note: the current `lint` script uses `next lint`. If your local Next.js version no longer supports that command, migrate the project to the current ESLint CLI workflow before relying on lint checks in CI.

## Example Workflow

1. Enter the starting address for the inspection day.
2. Paste the inspection site addresses into the address list.
3. Set the default inspection duration and working day times.
4. Choose route options, such as avoiding tolls or returning to the start address.
5. Select **Generate Run**.
6. Review the generated order, ETA, ETD, travel time, and map.
7. Adjust individual inspection durations or drag stops into a manual order if needed.

Example inspection data is available in [`examples/inspection-locations.csv`](examples/inspection-locations.csv).

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for planned milestones. Current priorities include a stronger route optimisation MVP, multi-day scheduling, priority weighting, map integration improvements, exports, team allocation, and calendar integration.

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening an issue or pull request.

Good first contributions include:

- Improving setup documentation.
- Adding tests around scheduling and time calculations.
- Refining route-planning UI states.
- Adding import and export helpers.

## Licence

This project is licensed under the MIT Licence. See [`LICENSE`](LICENSE) for details.
