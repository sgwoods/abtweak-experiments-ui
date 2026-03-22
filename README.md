# AbTweak Experiments UI

This repository hosts the user-facing web UI for running curated AbTweak
experiments remotely against the
[sgwoods/mmath-renovation](https://github.com/sgwoods/mmath-renovation) project.

It is intentionally separate from the planner source repository.

## Current Architecture

- Vercel-hosted Next.js app
- server-side API routes that talk to GitHub Actions
- GitHub Actions remains the hidden execution backend
- guided experiment catalog so users see curated purpose, weight, and benchmark focus before launching a run

## Required Environment Variables

- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_WORKFLOW_SINGLE`
- `GITHUB_WORKFLOW_SET`

## Local Development

```sh
npm install
npm run dev
```
