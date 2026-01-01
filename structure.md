.
├── .github/                    # CI/CD workflows
├── .husky/                     # Pre-commit hooks
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # SQL migrations
│   └── seed.ts                 # Database seeding script
├── public/                     # Static assets
│   ├── assets/
│   └── ...
├── src/                        # Application Source Code
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication Routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── ...
│   │   ├── (marketing)/        # Public Marketing Pages
│   │   │   ├── about/
│   │   │   ├── pricing/
│   │   │   └── ...
│   │   ├── (platform)/         # Protected Application Routes
│   │   │   ├── academy/        # LMS / Courses
│   │   │   ├── bookmark/
│   │   │   ├── chat/           # Stream Chat Integration
│   │   │   ├── dashboard/
│   │   │   ├── home/           # Main Feed
│   │   │   ├── notifications/
│   │   │   ├── posts/
│   │   │   ├── profile/
│   │   │   ├── search/
│   │   │   ├── settings/
│   │   │   ├── subscription/
│   │   │   └── trade-room/     # Live Streaming / Trading Floor
│   │   ├── api/                # API Routes & Webhooks
│   │   │   ├── auth/           # Better Auth
│   │   │   ├── courses/
│   │   │   ├── cron/
│   │   │   └── webhooks/
│   │   ├── globals.css         # Global Styles
│   │   ├── layout.tsx          # Root Layout
│   │   └── providers.tsx       # Global Providers
│   │
│   ├── components/             # Reusable UI & Logical Components
│   │   ├── audio-room/         # Audio Room specific components
│   │   ├── creator-dashboard/  # Creator tools
│   │   ├── handle-media/       # Upload components (MediaUploader)
│   │   ├── player/             # Video Player Components
│   │   ├── providers/          # Context Providers
│   │   ├── search/             # Search Components
│   │   ├── shared/             # Shared utilities
│   │   ├── ui/                 # Shadcn UI primitives
│   │   ├── ConsensusLogo.tsx
│   │   ├── UserAvatarWithInfo.tsx
│   │   └── ...
│   │
│   ├── features/               # Feature-Based Architecture (Business Logic)
│   │   ├── admin/
│   │   ├── articles/
│   │   ├── auth/
│   │   ├── comments/
│   │   ├── courses/            # Course/Lesson Actions & Queries
│   │   ├── creator/
│   │   ├── media/              # Media/Upload/Stream Actions
│   │   ├── notifications/
│   │   ├── posts/              # Feed/Post Logic
│   │   ├── reviews/
│   │   ├── search/
│   │   ├── subscriptions/      # Billing/Subscription Logic
│   │   ├── user/
│   │   └── verification/
│   │       ├── actions/        # Server Actions
│   │       ├── queries/        # Data Fetching
│   │       ├── schemas.ts      # Zod Schemas (Colocated)
│   │       └── types.ts        # Feature Types (Colocated)
│   │
│   ├── generated/              # Generated Types (Prisma)
│   │   └── prisma/
│   │
│   ├── helper/                 # Helper Functions
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   ├── use-course.ts
│   │   ├── use-post.ts
│   │   └── ...
│   │
│   ├── lib/                    # Configuration & Utilities
│   │   ├── auth.ts
│   │   ├── db.ts               # Prisma Client
│   │   ├── s3-client.ts
│   │   ├── email/              # Email templates/logic
│   │   └── ...
│   │
│   ├── styles/                 # Extra CSS
│   │
│   └── types/                  # Global TypeScript Definitions
│       └── ...
│
├── .env.example
├── .eslintrc.json
├── components.json
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json