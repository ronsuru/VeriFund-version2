# VeriFund - Crowdfunding Platform

## Overview

VeriFund is a community-driven crowdfunding platform designed for the Philippines market. It facilitates transparent fundraising with blockchain-like transparency, enabling users to create campaigns, make contributions, and volunteer for causes. The platform incorporates KYC verification, a fee-based revenue model, extensive admin controls, and real-time transaction tracking utilizing a $PUSO token system. The project aims to provide a robust and transparent crowdfunding solution with strong market potential.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript for type safety, Wouter for routing, TanStack Query for server state management.
- **UI/UX**: Utilizes `shadcn/ui` components built on Radix UI primitives, styled with Tailwind CSS and custom design tokens.
- **Form Management**: React Hook Form with Zod validation ensures type-safe forms.

### Backend Architecture
- **Technology Stack**: Express.js with Node.js and TypeScript for a full-stack TypeScript implementation.
- **API Design**: RESTful API for managing campaigns, contributions, users, and administrative functions.
- **Authentication**: Session-based authentication using Express sessions and PostgreSQL storage.

### Database Layer
- **Database**: PostgreSQL, hosted on Neon for serverless capabilities.
- **ORM**: Drizzle ORM for type-safe database operations, using a schema-first approach.
- **Schema Management**: A shared TypeScript schema between client and server ensures consistency.

### Authentication System
- **User Authentication**: Integrated with Replit Authentication via OpenID Connect.
- **Access Control**: Role-based access control (Admin, Manager, Support, regular user) with protected routes.
- **KYC Verification**: Integrated identity verification system for campaign creators.

### Project Structure
- **Monorepo**: Client, server, and shared code are organized within a single repository.
- **Code Organization**: Leverages TypeScript path aliases (`@/`, `@shared/`) for clean imports.
- **Build Tools**: Vite for frontend bundling and esbuild for server compilation.

### Data Models
The system manages key entities: Users (authentication, KYC, PUSO balance), Campaigns (fundraising details, status), Contributions (donations), Transactions (financial history), and Volunteer Systems (opportunity management).

### Revenue Model Integration
- **Fee Structure**: Implements multi-point fees including platform, conversion, withdrawal, and tip fees.
- **Transparency**: Features a fee calculator component for user transparency.
- **Internal Currency**: Uses a $PUSO token system for contributions and withdrawals.

### Security Features
- **Admin Panel**: Secure dashboard for platform management and oversight.
- **Fraud Detection**: Campaign flagging and review systems are in place.
- **Data Validation**: Zod schemas provide runtime type checking for data integrity.
- **Session Security**: Utilizes HTTP-only cookies with secure configurations.

### Feature Specifications
- **Admin Dashboard**: Comprehensive management of reports (documents, campaigns, creators, volunteers), KYC, user registration, support tickets, and success stories.
- **Report Management**: Enhanced filtering, claiming, assignment, and resolution workflows for various report types.
- **KYC Workflow**: Standardized document viewing, approval/rejection processes, and detailed user profile displays.
- **Suspended Users Management**: Complete system for managing suspended accounts with detailed information display, admin assignment workflow, and reactivation capabilities.
- **Support System**: Full-fledged ticket management with priority, category, and status indicators.
- **Success Stories**: Dedicated interface for managing (creating, publishing, archiving) success stories visible on the landing page.
- **Role-based Access**: Granular control for Admin, Manager, and Support roles across different functionalities.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Platform**: Integrated development, hosting, and authentication.
- **Node.js Runtime**: Server-side execution environment.

### Frontend Libraries
- **Radix UI**: Unstyled, accessible UI component primitives.
- **Lucide React**: Icon library.
- **Class Variance Authority**: Utility for managing component variants.
- **Date-fns**: Date manipulation and formatting.

### Development Tools
- **Vite**: Frontend build tool.
- **ESBuild**: Fast JavaScript bundler.
- **TypeScript**: Static type checking and compilation.
- **PostCSS**: CSS processing.

### Authentication & Session Management
- **OpenID Client**: For Replit authentication integration.
- **Passport.js**: Authentication middleware for Express.
- **Connect-pg-simple**: PostgreSQL session store for Express.

### Database & ORM
- **Drizzle Kit**: Database migration and schema management.