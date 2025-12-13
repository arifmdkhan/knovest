.
├── .github/                    # CI/CD workflows (Linting, Testing, Deploy)
├── .husky/                     # Pre-commit hooks (Lint-staged, commitlint)
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # SQL migrations
│   └── seed.ts                 # Database seeding script
├── public/                     # Static assets (images, fonts, robots.txt)
│   ├── assets/
│   └── locales/                # i18n JSON files (if global audience)
├── src/                        # Application Source Code
│   ├── app/                    # Next.js App Router (Routing layer only)
│   │   ├── (auth)/             # Route Group: Authentication
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── layout.tsx      # Auth-specific layout (centered forms)
│   │   │   └── page.tsx
│   │   ├── (marketing)/        # Route Group: Public facing pages (SEO optimized)
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── about/
│   │   │   ├── layout.tsx
│   │   │   └── pricing/
│   │   ├── (platform)/         # Route Group: Protected App Logic
│   │   │   ├── dashboard/
│   │   │   ├── feed/
│   │   │   ├── trade-rooms/
│   │   │   │   ├── [roomId]/
│   │   │   │   │   └── page.tsx # Live streaming/Screen sharing interface
│   │   │   ├── courses/
│   │   │   │   ├── [courseId]/
│   │   │   │   │   ├── learn/
│   │   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx      # Main app shell (Sidebar, Header, Socket connection)
│   │   ├── api/                # Route Handlers (Webhooks, External integrations)
│   │   │   ├── upload/         # Presigned URLs for media (S3/R2)
│   │   │   ├── webhooks/       # Stripe/LemonSqueezy, LiveKit events
│   │   │   └── auth/           # Better Auth endpoints
│   │   ├── error.tsx           # Global Error Boundary
│   │   ├── global-error.tsx    # Root Layout Error Boundary
│   │   ├── globals.css         # Global Tailwind imports & CSS variables
│   │   ├── layout.tsx          # Root Layout (Providers: Theme, QueryClient, Toaster)
│   │   ├── not-found.tsx       # Custom 404
│   │   └── providers.tsx       # Client-side Context Providers wrapper
│   │
│   ├── components/             # Shared/Generic UI Components
│   │   ├── ui/                 # Shadcn UI primitives (Button, Dialog, Input)
│   │   ├── global/             # Layout components (Navbar, Footer, Sidebar)
│   │   ├── shared/             # Reusable logic components (DateFormatter, EmptyState)
│   │   └── skeletons/          # Loading skeletons for Suspense boundaries
│   │
│   ├── env/                    # Environment Variable Validation
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   ├── features/               # Domain-Driven Feature Modules (The Core Logic)
│   │   ├── auth/               # Auth components and forms
│   │   ├── feed/
│   │   │   ├── components/     # Feed specific UI (PostCard, CreatePost)
│   │   │   ├── hooks/          # React Query hooks (useInfiniteFeed)
│   │   │   └── types/          # Feed specific types
│   │   ├── courses/            # LMS Logic
│   │   ├── trade-room/         # LiveKit/WebRTC logic, Chart wrappers
│   │   └── analytics/          # Charts and Dashboard widgets
│   │
│   ├── hooks/                  # Global Custom Hooks
│   │   ├── use-current-user.ts
│   │   ├── use-media-query.ts
│   │   └── use-scroll-position.ts
│   │
│   ├── lib/                    # Utilities & Libraries configuration
│   │   ├── auth.ts             # Better Auth configuration & client
│   │   ├── db.ts               # Prisma singleton client
│   │   ├── events.ts           # Event emitter for backend
│   │   ├── fonts.ts            # Next/Font setup
│   │   ├── formatters.ts       # Currency, Number, Date formatting
│   │   ├── query-client.ts     # Tanstack Query client config
│   │   ├── stripe.ts           # Payment gateway initialization
│   │   └── utils.ts            # CN (Tailwind merge), generic helpers
│   │
│   ├── server/                 # Server-Side Logic (Secure Zone)
│   │   ├── actions/            # Server Actions (Mutations - WRITE)
│   │   │   ├── auth.actions.ts
│   │   │   ├── post.actions.ts
│   │   │   ├── trade.actions.ts
│   │   │   └── user.actions.ts
│   │   ├── dal/                # Data Access Layer (Queries - READ)
│   │   │   ├── post.dal.ts     # Cached database reads (unstable_cache)
│   │   │   ├── user.dal.ts
│   │   │   └── course.dal.ts
│   │   ├── dto/                # Data Transfer Objects (Sanitization)
│   │   │   └── user.dto.ts     # eg: "toUserDto(dbUser)" removes password hash
│   │   └── services/           # Complex Business Logic (Payment processing, Emailing)
│   │       ├── email.service.ts
│   │       └── payment.service.ts
│   │
│   └── types/                  # Global TypeScript Definitions
│       ├── index.d.ts
│       └── next-auth.d.ts      # Extensions for Auth sessions
│
├── .env.example                # Template for environment variables
├── .eslintrc.json              # Linting rules (Strict, A11y plugin)
├── components.json             # Shadcn UI configuration
├── next.config.mjs             # Next.js config (Security headers, image optimization)
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json