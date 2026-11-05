# Pathway restaurant app

A simplified version of Pathway, the platform restaurants use to run their operations. It shows the invoices a restaurant receives from its distributors, and what was bought on each one.

**Start with [TASK.md](TASK.md),** which explains what we'd like you to do. This file only covers setup.

## Set up

You need [Node](https://nodejs.org) 22.13 or newer, and nothing else. The database is a local file, so there's no Docker or database server to install.

```bash
npm install
npm run dev
```

Open the URL printed in your terminal, usually http://localhost:3000. The first run creates the database and loads the sample data.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Applies any new migrations, then starts the app |
| `npm run db:migrate` | Applies any new migrations |
| `npm run db:reset` | Deletes the database and starts over with the sample data |

## What's in the repo

| Path | What it is |
|---|---|
| `app/` | The pages, and the actions that save changes |
| `components/` | The sidebar, business switcher and other small pieces |
| `lib/db.ts` | Every database query |
| `db/migrations/` | The database schema, as SQL files |
| `db/seed.json` | The sample data |

It's Next.js and TypeScript, with SQLite through Node's built-in `node:sqlite`. You're free to change anything.

## Changing the database

Add a numbered SQL file to `db/migrations`, such as `002_my_change.sql`, then run `npm run db:migrate`. Each file runs once. The sample data is only loaded when the database is first created, so your migrations run against the rows that are already there.

## Fake QuickBooks service

- **URL:** https://fake-quickbooks.onrender.com
- **Authentication token:** ask one of your interviewers.
