# 🚀 UrgentCare EMR - Complete Setup Guide

## Overview

This guide covers everything you need to get the UrgentCare EMR system running, from APIs and databases to deployment.

## Prerequisites

### Required Software
- **Node.js**: Version 18.x or higher
- **npm/pnpm**: Package manager (pnpm recommended)
- **PostgreSQL**: Version 14 or higher
- **Git**: For version control
- **VS Code**: Recommended IDE

### Required Accounts & Services

#### 1. **OpenAI Account** (for Whisper API)
- **Purpose**: Voice transcription
- **Sign up**: https://platform.openai.com/signup
- **Cost**: ~$0.006 per minute of audio
- **What you need**: API key

**Setup Steps:**
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)
6. Add billing information (required for API access)

#### 2. **Anthropic Account** (for Claude API)
- **Purpose**: AI SOAP note generation
- **Sign up**: https://console.anthropic.com/
- **Cost**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **What you need**: API key

**Setup Steps:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-...`)
6. Add payment method

#### 3. **AWS Account** (for S3 Storage)
- **Purpose**: Document storage, voice recordings
- **Sign up**: https://aws.amazon.com/
- **Cost**: ~$0.023 per GB/month + transfer costs
- **What you need**: Access Key ID, Secret Access Key, Bucket Name

**Setup Steps:**
1. Create AWS account at https://aws.amazon.com/
2. Go to IAM (Identity and Access Management)
3. Create new user with programmatic access
4. Attach policy: `AmazonS3FullAccess`
5. Save Access Key ID and Secret Access Key
6. Go to S3 console
7. Create new bucket (e.g., `urgentcare-emr-documents`)
8. Enable encryption (AES-256)
9. Set bucket policy for private access
10. Note the bucket name and region

**S3 Bucket Policy Example:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPrivateAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::urgentcare-emr-documents/*",
        "arn:aws:s3:::urgentcare-emr-documents"
      ]
    }
  ]
}
```

#### 4. **PostgreSQL Database**

**Option A: Local PostgreSQL**
1. Download from https://www.postgresql.org/download/
2. Install and start PostgreSQL
3. Create database:
```bash
psql -U postgres
CREATE DATABASE urgentcare_emr;
CREATE USER urgentcare WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE urgentcare_emr TO urgentcare;
\q
```

**Option B: Supabase (Recommended for Production)**
- **Purpose**: Managed PostgreSQL database
- **Sign up**: https://supabase.com/
- **Cost**: Free tier available, paid plans from $25/month
- **What you need**: Database connection string

**Supabase Setup:**
1. Go to https://supabase.com/
2. Sign up and create new project
3. Wait for database provisioning (~2 minutes)
4. Go to Settings → Database
5. Copy the connection string (URI format)
6. Enable connection pooling for better performance

**Option C: Railway**
- **Sign up**: https://railway.app/
- **Cost**: Free tier available
- **Setup**: Click "New Project" → "Provision PostgreSQL"

**Option D: Render**
- **Sign up**: https://render.com/
- **Cost**: Free tier available
- **Setup**: Create new PostgreSQL database

#### 5. **NextAuth.js Setup** (Authentication)
- **Purpose**: User authentication
- **What you need**: NextAuth secret

**Generate Secret:**
```bash
openssl rand -base64 32
```

## Environment Variables

### Frontend (.env.local)

Create `/frontend/.env.local`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/urgentcare_emr"
# For Supabase, use their connection string:
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# OpenAI (Whisper API)
OPENAI_API_KEY="sk-..."

# Anthropic (Claude API)
ANTHROPIC_API_KEY="sk-ant-..."

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="urgentcare-emr-documents"

# Optional: Backend API URL (if using .NET backend)
NEXT_PUBLIC_API_URL="http://localhost:5099"
```

### Backend (.NET) - appsettings.json

Create `/backend/UrgentCare.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=urgentcare_emr;Username=urgentcare;Password=your_password"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}
```

## Installation Steps

### 1. Clone Repository
```bash
cd ~/Desktop/UrgentCare
cd urgentcare-emr
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
# or
pnpm install
```

### 3. Install Backend Dependencies (Optional)
```bash
cd ../backend/UrgentCare.API
dotnet restore
```

### 4. Set Up Database

**Run Prisma Migrations:**
```bash
cd frontend
npx prisma generate
npx prisma migrate dev --name init
```

**Seed Database (Optional):**
```bash
npx prisma db seed
```

**View Database:**
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### 5. Configure Environment Variables

Create `.env.local` in `/frontend/` with all the variables listed above.

### 6. Test API Connections

**Test OpenAI:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Test Anthropic:**
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

**Test AWS S3:**
```bash
aws s3 ls s3://urgentcare-emr-documents --profile your-profile
```

### 7. Start Development Servers

**Frontend:**
```bash
cd frontend
npm run dev
# or
pnpm dev
```
Opens at http://localhost:3000

**Backend (Optional):**
```bash
cd backend/UrgentCare.API
dotnet run
```
Opens at http://localhost:5099

## Cost Breakdown

### Monthly Costs (Estimated)

#### Development/Testing
- **OpenAI (Whisper)**: $5-10/month (light usage)
- **Anthropic (Claude)**: $10-20/month (light usage)
- **AWS S3**: $1-5/month (few GB storage)
- **Database (Supabase Free)**: $0
- **Total**: ~$16-35/month

#### Production (Small Clinic)
- **OpenAI (Whisper)**: $50-100/month (50-100 encounters/day)
- **Anthropic (Claude)**: $100-200/month (50-100 encounters/day)
- **AWS S3**: $20-50/month (100GB+ storage)
- **Database (Supabase Pro)**: $25/month
- **Hosting (Vercel Pro)**: $20/month
- **Total**: ~$215-395/month

#### Production (Medium Clinic)
- **OpenAI**: $200-300/month
- **Anthropic**: $400-600/month
- **AWS S3**: $100-200/month
- **Database**: $50-100/month
- **Hosting**: $50/month
- **Total**: ~$800-1,250/month

### Cost Optimization Tips
1. **Cache AI responses** for similar queries
2. **Compress audio** before sending to Whisper
3. **Use S3 lifecycle policies** to archive old documents
4. **Implement rate limiting** to prevent abuse
5. **Monitor usage** with AWS CloudWatch and API dashboards

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

**Pros**: Easy deployment, automatic HTTPS, global CDN
**Cost**: Free tier available, Pro at $20/month

**Steps:**
1. Push code to GitHub
2. Go to https://vercel.com/
3. Import repository
4. Add environment variables
5. Deploy

### Option 2: Railway (Full Stack)

**Pros**: Deploy frontend + backend + database
**Cost**: Pay-as-you-go, ~$5-20/month

**Steps:**
1. Go to https://railway.app/
2. Connect GitHub repository
3. Add PostgreSQL service
4. Configure environment variables
5. Deploy

### Option 3: AWS (Enterprise)

**Pros**: Full control, scalable
**Cost**: Variable, ~$50-200/month

**Services:**
- **Frontend**: S3 + CloudFront
- **Backend**: EC2 or ECS
- **Database**: RDS PostgreSQL
- **Storage**: S3

### Option 4: Self-Hosted

**Pros**: Complete control, one-time cost
**Cost**: Server hardware/VPS

**Requirements:**
- Ubuntu/Debian server
- Docker + Docker Compose
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)

## Database Schema

The Prisma schema is already defined in `/frontend/prisma/schema.prisma`. It includes:

- **User**: Authentication and user management
- **Patient**: Patient demographics and medical history
- **Encounter**: Clinical encounters
- **Prescription**: Medication prescriptions
- **LabOrder**: Laboratory orders
- **Document**: Uploaded documents
- **Appointment**: Scheduled appointments
- **Claim**: Billing claims

## Security Checklist

### Before Going Live
- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Configure S3 bucket policies
- [ ] Set up audit logging
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Review IAM permissions
- [ ] Set up backup strategy
- [ ] Enable monitoring/alerts

## Testing Your Setup

### 1. Test Database Connection
```bash
cd frontend
npx prisma studio
```

### 2. Test Voice Recording
1. Start dev server
2. Go to http://localhost:3000/encounters/new
3. Click "Start Recording"
4. Speak for 10 seconds
5. Click "Stop Recording"
6. Verify transcription appears

### 3. Test AI SOAP Note
1. After transcription completes
2. Click "Generate SOAP Note"
3. Verify SOAP note is generated
4. Check all sections (S, O, A, P)

### 4. Test Document Upload
1. Go to Documents tab
2. Drag and drop a PDF
3. Verify upload progress
4. Check document appears in list
5. Test download

### 5. Test E-Prescription
1. Create prescription
2. Search for medication
3. Configure dosage
4. Save prescription
5. Verify in list

## Troubleshooting

### Common Issues

**Issue**: "Failed to connect to database"
**Solution**: Check DATABASE_URL, ensure PostgreSQL is running

**Issue**: "OpenAI API error"
**Solution**: Verify API key, check billing is set up

**Issue**: "S3 upload failed"
**Solution**: Check AWS credentials, verify bucket permissions

**Issue**: "Prisma migration failed"
**Solution**: Drop database and re-run migrations
```bash
npx prisma migrate reset
npx prisma migrate dev
```

**Issue**: "CORS error"
**Solution**: Check NEXTAUTH_URL matches your domain

## Support Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- OpenAI: https://platform.openai.com/docs
- Anthropic: https://docs.anthropic.com/
- AWS S3: https://docs.aws.amazon.com/s3/

### Community
- Next.js Discord: https://nextjs.org/discord
- Prisma Slack: https://slack.prisma.io/

## Quick Start Checklist

- [ ] Install Node.js 18+
- [ ] Install PostgreSQL or sign up for Supabase
- [ ] Create OpenAI account and get API key
- [ ] Create Anthropic account and get API key
- [ ] Create AWS account and set up S3 bucket
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Create `.env.local` with all variables
- [ ] Run database migrations (`npx prisma migrate dev`)
- [ ] Start dev server (`npm run dev`)
- [ ] Test voice recording
- [ ] Test AI SOAP note generation
- [ ] Test document upload
- [ ] Review security settings
- [ ] Deploy to production

## Estimated Setup Time

- **API Account Creation**: 30-60 minutes
- **Database Setup**: 15-30 minutes
- **Environment Configuration**: 15-30 minutes
- **Testing**: 30-60 minutes
- **Total**: 1.5-3 hours

## Next Steps

1. **Complete Setup**: Follow this guide step by step
2. **Test Features**: Verify all functionality works
3. **Customize**: Adjust branding, colors, text
4. **Train Staff**: Create user guides
5. **Deploy**: Choose hosting platform
6. **Go Live**: Start using in production!

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section
2. Review environment variables
3. Check API service status pages
4. Review application logs
5. Test API keys individually

---

**You're ready to set up the UrgentCare EMR! 🚀**

Start with creating the API accounts, then work through the checklist systematically.
