# Creasearch Market - Setup and Run Guide

This guide will help you set up and run the Creasearch Market project.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project
- PostgreSQL database access (via Supabase)

## Step 1: Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Open the file `supabase/schema.sql`
5. Copy the entire contents of the file
6. Paste it into the SQL Editor
7. Click **Run** to execute the migration

The migration will:
- Add new columns: `industry`, `niche`, `city`, `country`, `phone` to the `profiles` table
- Create indexes for performance
- Migrate existing location data to separate city/country fields

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

### Verify Migration

After running the migration, verify the changes:

```sql
-- Check if new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('industry', 'niche', 'city', 'country', 'phone');

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname LIKE 'idx_profiles_%';
```

## Step 2: Install Dependencies

### Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- express-rate-limit (for rate limiting)
- zod (for validation)
- All other backend dependencies

### Frontend Dependencies

```bash
cd frontend
npm install
```

## Step 3: Environment Variables Setup

### Backend Environment Variables

Create or update `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=your_supabase_project_url

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (comma-separated)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
```

### Frontend Environment Variables

Create or update `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
```

## Step 4: Run the Project

### Development Mode

#### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

#### Terminal 2: Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

### Production Mode

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Build Backend

```bash
cd backend
npm run build
```

#### Start Production Server

```bash
cd backend
npm start
```

## Quick Start Script

Create a `start.sh` file (Linux/Mac) or `start.bat` (Windows) for convenience:

### Linux/Mac (`start.sh`)

```bash
#!/bin/bash

echo "🚀 Starting Creasearch Market..."

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env not found. Please create it first."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ Error: frontend/.env not found. Please create it first."
    exit 1
fi

# Install dependencies if node_modules don't exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Servers started!"
echo "📡 Backend: http://localhost:5000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID
```

### Windows (`start.bat`)

```batch
@echo off
echo 🚀 Starting Creasearch Market...

REM Check if .env files exist
if not exist "backend\.env" (
    echo ❌ Error: backend\.env not found. Please create it first.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo ❌ Error: frontend\.env not found. Please create it first.
    pause
    exit /b 1
)

REM Install dependencies if node_modules don't exist
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Start backend
echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ✅ Servers started!
echo 📡 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers.
pause
```

## Docker Setup (Optional)

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - RESEND_API_KEY=${RESEND_API_KEY}
    volumes:
      - ./backend:/app
    command: npm start

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_API_BASE_URL=http://backend:5000/api
    volumes:
      - ./frontend:/app
    command: npm run dev
    depends_on:
      - backend
```

Run with:
```bash
docker-compose up
```

## Troubleshooting

### Database Migration Issues

If you encounter errors during migration:

1. **Check existing data**: Make sure existing profiles have valid location data
2. **Run migration in parts**: Split the SQL file and run sections separately
3. **Check Supabase logs**: Review error messages in Supabase dashboard

### Port Already in Use

If port 5000 or 5173 is already in use:

**Backend:**
```bash
PORT=5001 npm run dev
```

**Frontend:**
```bash
npm run dev -- --port 5174
```

### Rate Limiting Issues

If you're hitting rate limits during development, you can temporarily adjust limits in `backend/src/index.ts`:

```typescript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increase for development
  // ...
});
```

### Missing Dependencies

If you see "module not found" errors:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Verification Checklist

After setup, verify everything works:

- [ ] Database migration completed successfully
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables configured
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can access frontend at http://localhost:5173
- [ ] Can access backend health check at http://localhost:5000/health
- [ ] Can create a profile with new fields (industry, niche, city, country, phone)
- [ ] Search filters work (country, city, industry, niche)

## Next Steps

1. **Test the Application**:
   - Create a creator profile
   - Create a brand profile
   - Test search filters
   - Test admin dashboard

2. **Configure Email Service**:
   - Set up Resend account
   - Verify email domain
   - Update `FROM_EMAIL` in `backend/src/services/email.ts`

3. **Set Up Production**:
   - Configure production environment variables
   - Set up CI/CD pipeline
   - Configure domain and SSL certificates

## Support

For issues or questions:
- Check the plan documents in `/plans` folder
- Review error logs in console
- Check Supabase dashboard for database issues
