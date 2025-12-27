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
│   │   │   ├── upload/         # (Legacy/Optional)
│   │   │   ├── webhooks/
│   │   │   └── ...
│   │   ├── globals.css         # Global Styles
│   │   ├── layout.tsx          # Root Layout
│   │   └── providers.tsx       # Global Providers
│   │
│   ├── components/             # Reusable UI & Logical Components
│   │   ├── audio-room/         # Audio Room specific components
│   │   ├── creator-dashboard/  # Creator tools
│   │   ├── handle-media/       # Upload components (MediaUploader)
│   │   ├── providers/          # Context Providers
│   │   ├── shared/             # Shared utilities (EmptyState, etc)
│   │   ├── ui/                 # Shadcn UI primitives
│   │   ├── UserAvatarWithInfo.tsx
│   │   ├── UserHoverCard.tsx
│   │   └── ...
│   │
│   ├── env/                    # Environment Vars
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   ├── use-media-upload.ts
│   │   └── ...
│   │
│   ├── lib/                    # Configuration & Utilities
│   │   ├── auth.ts
│   │   ├── db.ts               # Prisma Client
│   │   ├── s3-client.ts
│   │   └── ...
│   │
│   ├── server/                 # Server-Side Logic
│   │   ├── actions/            # Server Actions (Mutations)
│   │   │   ├── academy/
│   │   │   ├── articles/
│   │   │   ├── course/
│   │   │   ├── post/
│   │   │   ├── stream.ts       # Stream IO actions
│   │   │   ├── upload.actions.ts
│   │   │   ├── user.ts
│   │   │   └── ...
│   │   ├── dal/                # Data Access Layer (Optional/Mixed)
│   │   └── ...
│   │
│   └── types/                  # TypeScript Definitions
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