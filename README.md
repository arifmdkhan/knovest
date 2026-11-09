# Knovest

<div align="center">

  <img src="https://img.shields.io/badge/Next.js-16.4.2-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white" alt="Prisma + PostgreSQL" />
  <img src="https://img.shields.io/badge/Live%20Video-Stream-7C3AED" alt="Stream live video" />

  <h3>Financial education, community, and premium learning experiences.</h3>

  <p>
    Knovest is a social learning platform built to help users improve financial literacy through premium communities, live trading rooms, and verified education content.
  </p>

</div>

## Overview

Knovest is a modern social network and learning platform focused on financial mastery. The product combines premium member communities, live educational sessions, and structured learning pathways into a single experience designed for serious learners and aspiring traders.

This repository contains the core application powering that experience, including membership flows, user authentication, content delivery, live sessions, media handling, and community engagement.

## Why this project

- Built for communities centered on financial education and practice.
- Combines social networking with trust-driven learning and expert access.
- Supports premium memberships and exclusive groups for deeper engagement.
- Creates a foundation for content, community, and live education to coexist in one product.

## Key features

- Premium groups and member-only spaces
- Live trade rooms and community-driven learning sessions
- Verified course and educational content delivery
- Account-based access and member onboarding
- Social community interactions with structured user engagement
- Creator and instructor-friendly content workflows
- Media upload and asset delivery for course and community content

## Product vision

Knovest aims to make financial mastery more accessible by blending:

- educational depth
- trusted expert access
- community accountability
- premium member experiences
- real-time learning moments

## Tech stack

- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- Backend: Next.js app routes and server logic
- Database: PostgreSQL via Prisma
- Auth: Better Auth + Google OAuth
- Email: Resend
- Media storage: AWS S3-compatible object storage
- Live sessions: Stream Chat / Stream Video
- Deployment-ready infrastructure for modern web applications

## Architecture at a glance

```text
User app
  -> Next.js frontend
      -> Prisma + PostgreSQL
      -> S3 media storage
      -> Stream live/video services
      -> OAuth + auth providers
      -> Email + notifications
```

## Repository structure

```text
src/          Application UI and business logic
prisma/       Database schema and migration history
public/       Static assets and public resources
tests/        Regression and automated validation
scripts/      Project maintenance and operational utilities
docs/         Environment, deployment, and release documentation
```

## Getting started

### Prerequisites

- Node.js 22+
- pnpm 12.5.1
- PostgreSQL-compatible database
- S3-compatible storage
- Google OAuth credentials
- Resend API key
- Stream credentials

### Local development

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Then open http://localhost:3000.

## Environment configuration

This project relies on a range of service credentials and app settings for authentication, storage, live sessions, and mail delivery. The application expects configuration values such as:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_STREAM_API_KEY`
- `STREAM_API_SECRET`
- `AWS_*` storage configuration
- `CRON_SECRET`

## Validation

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Documentation

- [Release runbook](docs/RELEASE-RUNBOOK.md)
- [Caching guide](docs/caching.md)

## Project status

This project is designed as a production-grade learning and community platform with a strong focus on premium engagement, expert education, and live financial learning experiences.

---

Built to help people learn, participate, and grow inside a financial community built around mastery.

