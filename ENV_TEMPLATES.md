# Environment Configuration Templates

## Frontend Environment Variables

Create `frontend/.env.local` with the following content:

```env
# ============================================
# DATABASE (Prisma)
# ============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/urgentcare?schema=public"

# For production with connection pooling (Supabase/Neon):
# DATABASE_URL="postgresql://user:password@host:5432/urgentcare?pgbouncer=true&connection_limit=1"

# ============================================
# NEXTAUTH
# ============================================
# Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# BACKEND API
# ============================================
NEXT_PUBLIC_BACKEND_URL="http://localhost:5099"

# For production:
# NEXT_PUBLIC_BACKEND_URL="https://your-backend.railway.app"

# ============================================
# AWS S3 (Optional - for document storage)
# ============================================
AWS_REGION="us-east-1"
AWS_S3_BUCKET="urgentcare-documents"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"

# ============================================
# AI PROVIDERS (Optional - for Phase 3+)
# ============================================
# Anthropic Claude (for SOAP note generation)
ANTHROPIC_API_KEY="sk-ant-api03-..."

# OpenAI (for Whisper transcription)
OPENAI_API_KEY="sk-..."
```

## Backend Configuration

Create `backend/UrgentCare.API/appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=urgentcare;Username=postgres;Password=postgres"
  },
  "AllowedHosts": "*",
  "CORS": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://localhost:3000"
    ]
  },
  "AWS": {
    "Region": "us-east-1",
    "S3Bucket": "urgentcare-documents",
    "AccessKeyId": "your-access-key-id",
    "SecretAccessKey": "your-secret-access-key"
  },
  "AI": {
    "AnthropicApiKey": "sk-ant-api03-...",
    "OpenAIApiKey": "sk-..."
  }
}
```

## Production Configuration

### Frontend (Vercel)

Add these environment variables in Vercel dashboard:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1
NEXTAUTH_SECRET=production-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
AWS_REGION=us-east-1
AWS_S3_BUCKET=urgentcare-prod-documents
AWS_ACCESS_KEY_ID=prod-key
AWS_SECRET_ACCESS_KEY=prod-secret
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Backend (Railway/Render)

Add these environment variables in Railway/Render dashboard:

```env
ConnectionStrings__DefaultConnection=Host=host;Database=db;Username=user;Password=pass;SSL Mode=Require
CORS__AllowedOrigins__0=https://your-app.vercel.app
AWS__Region=us-east-1
AWS__S3Bucket=urgentcare-prod-documents
AWS__AccessKeyId=prod-key
AWS__SecretAccessKey=prod-secret
AI__AnthropicApiKey=sk-ant-...
AI__OpenAIApiKey=sk-...
```

## Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb urgentcare

# Or using psql
psql postgres
CREATE DATABASE urgentcare;
CREATE USER urgentcare_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE urgentcare TO urgentcare_user;
\q
```

### Supabase (Production)

1. Create project at https://supabase.com
2. Get connection string from Settings > Database
3. Use the "Connection Pooling" string for Prisma
4. Enable SSL mode

### Neon (Alternative)

1. Create project at https://neon.tech
2. Get connection string from dashboard
3. Use with `?sslmode=require`

## Security Best Practices

### ✅ DO:
- Use strong, randomly generated secrets
- Rotate API keys regularly
- Use environment-specific credentials
- Enable SSL/TLS in production
- Use connection pooling for serverless
- Store secrets in secure vaults (Vercel/Railway/AWS Secrets Manager)

### ❌ DON'T:
- Commit `.env.local` or `appsettings.Development.json` to git
- Share API keys in chat/email
- Use the same credentials across environments
- Hardcode secrets in source code
- Use weak passwords for database users

## Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate random password
openssl rand -hex 16

# Generate UUID
uuidgen
```

## Verifying Configuration

### Frontend
```bash
cd frontend
pnpm dev
# Should start without errors
# Check http://localhost:3000
```

### Backend
```bash
cd backend/UrgentCare.API
dotnet run
# Should start without errors
# Check https://localhost:5099/health
# Check https://localhost:5099/swagger
```

### Database Connection
```bash
cd frontend
npx prisma studio
# Should open database GUI at http://localhost:5555
```

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify connection string format
- Check username/password
- Ensure database exists

### "NEXTAUTH_SECRET is not set"
- Create `.env.local` file
- Add NEXTAUTH_SECRET with generated value
- Restart dev server

### "CORS error"
- Check backend CORS configuration
- Verify frontend URL in AllowedOrigins
- Ensure both apps are running

### "Module not found" errors
- Run `pnpm install` in frontend
- Run `dotnet restore` in backend
- Restart dev servers
