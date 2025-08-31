# Verifund - Crowdfunding Platform

A full-stack crowdfunding platform built with React, Express.js, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or Supabase)
- Supabase account for Auth and Storage

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd Verifund_Version1-1
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# Required variables:
# - DATABASE_URL (PostgreSQL connection string)
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - SESSION_SECRET (random string for session encryption)
# - Other service keys as needed
```

### 3. Supabase Project Setup
1. **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Get Credentials**: Copy your project URL and API keys to `.env`
3. **Create Storage Bucket**: 
   - Go to Storage in your Supabase dashboard
   - Create bucket named `verifund-assets`
   - Set appropriate RLS policies (see STORAGE_SETUP.md)

### 4. Database Setup
```bash
# Option A: Use Supabase Database
# Your DATABASE_URL will be: postgresql://postgres:[password]@[host]:5432/postgres

# Option B: Local PostgreSQL
# Install PostgreSQL locally and create a database
# DATABASE_URL=postgresql://username:password@localhost:5432/verifund
```

### 5. Run Development Server
```bash
# Start both frontend and backend with hot reload
npm run dev

# Or run separately:
npm run dev:server  # Backend only
npm run dev:client  # Frontend only
```

The app will be available at `http://localhost:5000`

## 🛠️ Development Scripts

- `npm run dev` - Start full development environment
- `npm run dev:server` - Start backend server only
- `npm run dev:client` - Start frontend dev server only
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **Tailwind CSS** for styling
- **React Query** for data fetching

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **Supabase Auth** for authentication
- **Supabase Storage** for file management

### Database
- **PostgreSQL** with Drizzle ORM
- **Session storage** with connect-pg-simple

## 🔐 Authentication

The app uses Supabase Auth with:
- Email/password authentication
- JWT token-based sessions
- Role-based access control
- Protected API routes

## 📁 File Storage

Files are stored in Supabase Storage:
- Bucket: `verifund-assets`
- Public and private file access patterns
- Automatic URL generation for uploaded files
- Support for various file types

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 📦 Production Build

```bash
# Build frontend
npm run build

# Start production server
npm run start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `APP_URL` | Application base URL | Yes |
| `PORT` | Server port (default: 5000) | No |

### Supabase Setup

1. **Authentication**: Enable email/password auth in Supabase dashboard
2. **Storage**: Create bucket and set RLS policies
3. **Database**: Tables will be created automatically via Drizzle migrations

## 🚀 Deployment

### Local Development
- Use `npm run dev` for full-stack development
- Hot reload enabled for both frontend and backend
- Vite dev server proxies API requests to Express backend

### Production
- Build frontend: `npm run build`
- Start server: `npm run start`
- Environment variables must be set
- Database must be accessible

### Hosting Options
- **Vercel**: Frontend + API routes
- **Railway**: Full-stack deployment
- **Heroku**: Full-stack deployment
- **DigitalOcean**: VPS deployment

## 📚 Additional Documentation

- [STORAGE_SETUP.md](./STORAGE_SETUP.md) - Detailed Supabase Storage setup
- [API Documentation](./docs/api.md) - API endpoints and usage
- [Database Schema](./shared/schema.ts) - Database table definitions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions:
- Check existing issues
- Create a new issue with detailed description
- Include environment details and error logs
