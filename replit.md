# CareConnect

## Overview

CareConnect is a social impact platform that connects NGOs with volunteers for community collaboration. NGOs post community causes (food drives, education support, animal care, etc.), and volunteers browse, apply, complete tasks, and upload proof of work. The platform tracks impact metrics and includes a donation system and community blog features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **Routing**: Wouter for client-side routing with protected route wrappers based on user roles (NGO vs Volunteer)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom teal/navy theme, CSS variables for theming
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: REST API with typed routes defined in `shared/routes.ts`
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: scrypt hashing with timing-safe comparison
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)
- **Tables**: users, causes, tasks, donations, posts with defined relationships

### Shared Code Structure
- **Path**: `shared/` directory contains code shared between client and server
- **Schema**: Drizzle table definitions with Zod validation schemas via drizzle-zod
- **Routes**: Type-safe API route definitions with input/output schemas

### Build System
- **Development**: tsx for running TypeScript directly, Vite dev server with HMR
- **Production**: Custom build script using esbuild for server and Vite for client
- **Output**: Server bundled to `dist/index.cjs`, client assets to `dist/public`

### Role-Based Access
- Two user roles: `ngo` and `volunteer`
- NGOs can create causes, view donation analytics, and approve volunteer work
- Volunteers can browse causes, apply for tasks, submit proof, and make donations

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### UI/Component Libraries
- **Radix UI**: Headless UI primitives (dialogs, dropdowns, forms, etc.)
- **shadcn/ui**: Pre-styled components built on Radix
- **Recharts**: Data visualization for donation analytics and impact stats

### Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **express-session**: Session management

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **TypeScript**: Strict mode enabled with path aliases (@/, @shared/, @assets/)