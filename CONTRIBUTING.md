# Contributing

Thanks for your interest in Route Optimizer. This project aims to be a practical field inspection route planning tool for engineers, assessors, loss adjusters, and site-based consultants.

## Set Up The Project

1. Fork and clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment example:

```bash
cp .env.example .env.local
```

4. Add your local database and Google Maps settings to `.env.local`.
5. Generate the Prisma client:

```bash
npx prisma generate
```

6. Apply the schema to your development database:

```bash
npx prisma db push
```

7. Start the local development server:

```bash
npm run dev
```

## Report Bugs

When reporting a bug, please include:

- A short description of the problem.
- Steps to reproduce it.
- Expected behaviour.
- Actual behaviour.
- Browser, operating system, and device type.
- Any relevant console errors or server logs.

Please avoid sharing private claim information, personal addresses, or client data in public issues.

## Request Features

Feature requests should explain:

- The field workflow or problem being solved.
- Who benefits from the feature.
- A simple example of how the feature would be used.
- Whether the feature is essential for the MVP or a future enhancement.

## Coding Standards

- Use TypeScript for application code.
- Prefer clear, small React components.
- Keep UI copy plain and work-focused.
- Do not commit secrets, API keys, private addresses, claim files, or customer data.
- Use existing project patterns before adding new libraries.
- Keep route-planning, scheduling, and persistence logic easy to test.
- Run relevant checks before opening a pull request:

```bash
npm run build
npm run lint
```

If a check cannot run locally, mention why in the pull request.

## Pull Request Process

1. Create a focused branch for your change.
2. Keep pull requests small enough to review comfortably.
3. Describe what changed and why.
4. Include screenshots for UI changes where possible.
5. Note any database, environment, or migration impact.
6. Link related issues.
7. Wait for review before merging.
