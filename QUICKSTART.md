# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
# Frontend
cd frontend
pnpm install

# Backend
cd ../backend/UrgentCare.API
dotnet restore
```

### Step 2: Set Up Database

```bash
# Create PostgreSQL database
createdb urgentcare

# Run Prisma migrations
cd ../../frontend
npx prisma migrate dev --name init
```

### Step 3: Configure Environment

**Frontend** - Create `frontend/.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/urgentcare?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5099"
```

**Backend** - Create `backend/UrgentCare.API/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=urgentcare;Username=postgres;Password=postgres"
  }
}
```

### Step 4: Run Both Apps

**Terminal 1 - Backend:**
```bash
cd backend/UrgentCare.API
dotnet run
```
✅ Backend: https://localhost:5099/swagger

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```
✅ Frontend: http://localhost:3000

### Step 5: Test the System

1. **Register a user**: http://localhost:3000/register
   - Name: Test Doctor
   - Email: doctor@test.com
   - Password: password123
   - Role: DOCTOR

2. **Login**: http://localhost:3000/login

3. **Test Backend API**: https://localhost:5099/swagger
   - Try `GET /health`
   - Try `POST /api/patients` to create a patient

## 📋 What's Built (Phase 1)

✅ **Authentication**
- NextAuth.js with credentials provider
- Database sessions with Prisma
- Role-based access control (ADMIN, DOCTOR, NURSE, STAFF)
- Login/Register pages

✅ **UI Framework**
- shadcn/ui components installed
- Tailwind CSS configured
- Dark mode support
- Responsive layout with sidebar

✅ **Backend API**
- .NET 8 Web API with Entity Framework
- PostgreSQL database integration
- Full CRUD for Patients
- CORS enabled for frontend
- Swagger documentation
- HIPAA-compliant middleware:
  - Error handling
  - Audit logging
  - PHI protection

✅ **Database**
- Prisma schema with models:
  - User (with NextAuth tables)
  - Patient
  - Encounter
  - Document
  - AuditLog
- Migrations ready

## 🎯 Next Steps

### Immediate (Phase 2)
1. Build Patient Management UI
2. Connect frontend to backend API
3. Add search and pagination

### Coming Soon (Phase 3-6)
- Voice recording and transcription
- AI-powered SOAP note generation
- Document upload and management
- ICD-10 code suggestions
- E-prescriptions
- Analytics dashboard

## 🐛 Common Issues

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5099
lsof -ti:5099 | xargs kill -9
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14
```

**Prisma client not generated:**
```bash
cd frontend
npx prisma generate
```

## 📚 Key Files to Know

- `frontend/src/lib/auth.ts` - NextAuth configuration
- `frontend/prisma/schema.prisma` - Database schema
- `backend/UrgentCare.API/Program.cs` - API startup and DI
- `backend/UrgentCare.API/Controllers/PatientsController.cs` - Patient endpoints
- `frontend/src/app/(dashboard)/` - Dashboard pages

## 🔐 Default Test Credentials

After registering, use these for testing:
- **Email**: doctor@test.com
- **Password**: password123
- **Role**: DOCTOR

## 💡 Pro Tips

1. **Use Prisma Studio** to view/edit database:
   ```bash
   cd frontend
   npx prisma studio
   ```

2. **Watch backend logs** for debugging:
   ```bash
   cd backend/UrgentCare.API
   dotnet run --verbosity detailed
   ```

3. **Hot reload** works on both frontend and backend!

4. **Test API with curl**:
   ```bash
   curl https://localhost:5099/health -k
   ```

## 🎉 You're Ready!

The foundation is complete. Now you can start building patient management features, voice recording, and AI integrations!
