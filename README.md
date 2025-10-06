# UrgentCare EMR

AI-powered, HIPAA-compliant urgent care EMR with speech-to-text, AI note generation, and structured workflows.

## Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes + .NET 8 Web API (microservice)
- **AI/ML**: Anthropic Claude API, Whisper API
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: AWS S3
- **Auth**: NextAuth.js with RBAC
- **Deployment**: Vercel (Frontend), Railway/Render (Backend), Supabase (DB)

## Monorepo Structure
```
urgentcare-emr/
├── frontend/          # Next.js 14 app
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/# UI components (shadcn/ui)
│   │   ├── lib/       # Auth, Prisma, utils
│   │   └── types/     # TypeScript types
│   └── prisma/        # Database schema
└── backend/           # .NET 8 Web API
    └── UrgentCare.API/
        ├── Controllers/
        ├── Services/
        ├── Models/
        ├── DTOs/
        ├── Middleware/
        └── Data/
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- .NET 8 SDK
- PostgreSQL 14+

### 1. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your values (see below)

# Generate Prisma client
npx prisma generate

# Run migrations (requires DATABASE_URL)
npx prisma migrate dev --name init

# Start dev server
pnpm dev
```

**Frontend runs on**: http://localhost:3000

#### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# Database (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/urgentcare?schema=public"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Backend API
NEXT_PUBLIC_BACKEND_URL="http://localhost:5099"

# AWS S3 (for document storage)
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# AI Providers
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."  # For Whisper
```

### 2. Backend Setup

```bash
cd backend/UrgentCare.API

# Restore packages
dotnet restore

# Build
dotnet build

# Run
dotnet run
```

**Backend runs on**: https://localhost:5099 (or http://localhost:5098)

**Swagger UI**: https://localhost:5099/swagger

#### Backend Configuration

Create `backend/UrgentCare.API/appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=urgentcare;Username=postgres;Password=postgres"
  },
  "AllowedHosts": "*",
  "CORS": {
    "AllowedOrigins": ["http://localhost:3000", "https://localhost:3000"]
  },
  "AWS": {
    "Region": "us-east-1",
    "S3Bucket": "your-bucket-name",
    "AccessKeyId": "your-key",
    "SecretAccessKey": "your-secret"
  },
  "AI": {
    "AnthropicApiKey": "sk-ant-...",
    "OpenAIApiKey": "sk-..."
  }
}
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb urgentcare

# Or using psql
psql -U postgres
CREATE DATABASE urgentcare;
\q

# Run Prisma migrations from frontend directory
cd frontend
npx prisma migrate dev
```

## Phase 1 ✅ Complete

- ✅ NextAuth with credentials provider and database sessions
- ✅ shadcn/ui components installed and configured
- ✅ Backend DI, CORS, and middleware wired
- ✅ PatientService and PatientsController with full CRUD

## Testing the API

### Using Swagger UI
1. Start backend: `cd backend/UrgentCare.API && dotnet run`
2. Open https://localhost:5099/swagger
3. Test endpoints:
   - `GET /health` - Health check
   - `GET /api/patients` - List all patients
   - `POST /api/patients` - Create patient
   - `GET /api/patients/{id}` - Get patient by ID
   - `PUT /api/patients/{id}` - Update patient
   - `DELETE /api/patients/{id}` - Delete patient
   - `GET /api/patients/search?q=smith` - Search patients

### Using curl

```bash
# Health check
curl https://localhost:5099/health -k

# Create patient
curl -X POST https://localhost:5099/api/patients -k \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dob": "1980-01-15T00:00:00Z",
    "phone": "555-1234"
  }'

# Get all patients
curl https://localhost:5099/api/patients -k
```

## Security & HIPAA Compliance

- **Encryption**: TLS in transit, AES-256 at rest (S3 SSE)
- **PHI Protection**: Never logged; masked in audit logs
- **RBAC**: Role-based access control (ADMIN, DOCTOR, NURSE, STAFF)
- **Audit Logging**: All CRUD operations logged with user/IP
- **Session Management**: 8-hour timeout for HIPAA compliance
- **Middleware**: ErrorHandling, HIPAACompliance, AuditLogging

## Next Steps (Phase 2+)

### Phase 2: Patient Management UI
- Build PatientList component with search and pagination
- Create PatientForm with validation
- Implement patient detail view with encounter history

### Phase 3: AI Voice & Transcription
- VoiceRecorder component with MediaRecorder API
- Whisper API integration for transcription
- Real-time audio streaming

### Phase 4: AI SOAP Note Generation
- Claude API integration with medical prompts
- SOAPNoteEditor component
- ICD-10 code suggestions

### Phase 5: Document Management
- S3 presigned URL upload/download
- DocumentUploader with drag-and-drop
- Semantic search with embeddings

### Phase 6: Advanced Features
- E-prescription workflow
- Lab order management
- Analytics dashboard
- Encounter timeline view

## Development Commands

### Frontend
```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
npx prisma studio # Database GUI
npx prisma migrate dev --name <name>  # Create migration
```

### Backend
```bash
dotnet run                    # Start API
dotnet build                  # Build project
dotnet ef migrations add <name>  # Create EF migration
dotnet ef database update     # Apply migrations
dotnet test                   # Run tests
```

## Troubleshooting

### Frontend linter errors
All "Cannot find module" errors will resolve after running `pnpm install`.

### Database connection issues
- Ensure PostgreSQL is running: `pg_isready`
- Check connection string in `.env.local` and `appsettings.Development.json`
- Verify database exists: `psql -l`

### CORS errors
- Ensure backend CORS policy includes frontend URL
- Check `Program.cs` AllowedOrigins configuration

## License
MIT
