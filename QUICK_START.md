# ⚡ Quick Start Guide - UrgentCare EMR

## What You Need (Checklist)

### 1. API Keys (Required)

#### OpenAI API Key
- **Purpose**: Voice transcription (Whisper)
- **Get it**: https://platform.openai.com/api-keys
- **Cost**: ~$0.006/minute of audio
- **Format**: `sk-proj-...` or `sk-...`

#### Anthropic API Key
- **Purpose**: AI SOAP note generation (Claude)
- **Get it**: https://console.anthropic.com/settings/keys
- **Cost**: ~$3-15 per 1000 notes
- **Format**: `sk-ant-...`

#### AWS Credentials
- **Purpose**: Document storage (S3)
- **Get it**: https://console.aws.amazon.com/iam/
- **Cost**: ~$0.023/GB/month
- **Need**: Access Key ID, Secret Key, Bucket Name

### 2. Database (Choose One)

#### Option A: Supabase (Easiest)
- **Get it**: https://supabase.com/
- **Cost**: Free tier available
- **Setup**: 2 minutes
- ✅ **Recommended for beginners**

#### Option B: Local PostgreSQL
- **Get it**: https://www.postgresql.org/download/
- **Cost**: Free
- **Setup**: 10 minutes

### 3. Software

- **Node.js 18+**: https://nodejs.org/
- **Git**: https://git-scm.com/
- **VS Code**: https://code.visualstudio.com/

---

## 5-Minute Setup

### Step 1: Get API Keys (15 min)

```bash
# 1. OpenAI
# → Go to https://platform.openai.com/api-keys
# → Click "Create new secret key"
# → Copy key (starts with sk-...)
# → Add payment method

# 2. Anthropic
# → Go to https://console.anthropic.com/settings/keys
# → Click "Create Key"
# → Copy key (starts with sk-ant-...)
# → Add payment method

# 3. AWS S3
# → Go to https://console.aws.amazon.com/s3/
# → Create bucket: "urgentcare-emr-docs"
# → Enable encryption
# → Go to IAM, create user with S3 access
# → Copy Access Key ID and Secret
```

### Step 2: Set Up Database (5 min)

**Supabase (Recommended):**
```bash
# 1. Go to https://supabase.com/
# 2. Sign up and create new project
# 3. Wait 2 minutes for provisioning
# 4. Go to Settings → Database
# 5. Copy connection string
```

### Step 3: Configure Environment (2 min)

Create `frontend/.env.local`:

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Auth (generate with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"

# OpenAI
OPENAI_API_KEY="sk-..."

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET_NAME="urgentcare-emr-docs"
```

### Step 4: Install & Run (3 min)

```bash
# Navigate to project
cd ~/Desktop/UrgentCare/urgentcare-emr/frontend

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma migrate dev --name init

# Start development server
npm run dev
```

### Step 5: Test (2 min)

Open http://localhost:3000 and test:
- ✅ Voice recording
- ✅ AI transcription
- ✅ SOAP note generation
- ✅ Document upload

---

## Environment Variables Template

Copy this to `frontend/.env.local`:

```bash
# ===========================================
# UrgentCare EMR - Environment Variables
# ===========================================

# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/urgentcare_emr"

# AUTHENTICATION
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""  # Generate: openssl rand -base64 32

# OPENAI (Whisper API)
OPENAI_API_KEY=""  # Get from: https://platform.openai.com/api-keys

# ANTHROPIC (Claude API)
ANTHROPIC_API_KEY=""  # Get from: https://console.anthropic.com/settings/keys

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""  # Get from: AWS IAM
AWS_SECRET_ACCESS_KEY=""  # Get from: AWS IAM
AWS_S3_BUCKET_NAME=""  # Your S3 bucket name

# OPTIONAL: Backend API
NEXT_PUBLIC_API_URL="http://localhost:5099"
```

---

## Cost Calculator

### Development/Testing
- OpenAI: **$5-10/month** (light usage)
- Anthropic: **$10-20/month** (light usage)
- AWS S3: **$1-5/month** (few GB)
- Database: **$0** (Supabase free tier)
- **Total: ~$16-35/month**

### Small Clinic (50 patients/day)
- OpenAI: **$50-100/month**
- Anthropic: **$100-200/month**
- AWS S3: **$20-50/month**
- Database: **$25/month** (Supabase Pro)
- Hosting: **$20/month** (Vercel Pro)
- **Total: ~$215-395/month**

### Medium Clinic (150 patients/day)
- OpenAI: **$200-300/month**
- Anthropic: **$400-600/month**
- AWS S3: **$100-200/month**
- Database: **$50-100/month**
- Hosting: **$50/month**
- **Total: ~$800-1,250/month**

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Open database GUI
npx prisma migrate dev  # Run migrations
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes

# Testing
npm run lint            # Run linter
npm run type-check      # Check TypeScript

# Deployment
vercel                  # Deploy to Vercel
```

---

## Troubleshooting

### "Database connection failed"
```bash
# Check DATABASE_URL is correct
# Ensure PostgreSQL is running
# Test connection:
npx prisma db pull
```

### "OpenAI API error"
```bash
# Verify API key is correct
# Check billing is set up
# Test with curl:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

### "S3 upload failed"
```bash
# Check AWS credentials
# Verify bucket exists
# Test with AWS CLI:
aws s3 ls s3://your-bucket-name
```

### "Prisma migration failed"
```bash
# Reset database:
npx prisma migrate reset
npx prisma migrate dev --name init
```

---

## Quick Links

### Get API Keys
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **AWS Console**: https://console.aws.amazon.com/

### Database Options
- **Supabase**: https://supabase.com/
- **Railway**: https://railway.app/
- **Render**: https://render.com/

### Deployment
- **Vercel**: https://vercel.com/
- **Netlify**: https://netlify.com/

### Documentation
- **Full Setup Guide**: See `SETUP_GUIDE.md`
- **Project Docs**: See `PROJECT_COMPLETE.md`
- **Phase Docs**: See `PHASE_*_COMPLETE.md` files

---

## Support

### If you get stuck:
1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review environment variables
3. Check API service status pages
4. Review browser console for errors
5. Check terminal logs

### Useful Resources
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- OpenAI Docs: https://platform.openai.com/docs
- Anthropic Docs: https://docs.anthropic.com/

---

## Next Steps After Setup

1. ✅ **Test all features** - Voice, AI, documents, prescriptions
2. ✅ **Customize branding** - Update colors, logo, clinic name
3. ✅ **Add users** - Create staff accounts
4. ✅ **Configure settings** - Adjust preferences
5. ✅ **Train staff** - Show team how to use system
6. ✅ **Deploy** - Push to production
7. ✅ **Go live** - Start using with real patients!

---

**Ready to start? Follow the 5-Minute Setup above! 🚀**

**Questions? Check `SETUP_GUIDE.md` for detailed instructions.**
