# Deployment Guide

## 🚀 Deploy to Vercel (Frontend)

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Supabase/Neon recommended)

### Step 1: Push to GitHub

```bash
cd /Users/krishnamjhalani/Desktop/UrgentCare/urgentcare-emr

# Initialize git (if not already done)
git init
git add .
git commit -m "feat: Initial commit - HIPAA-compliant EMR Phase 1

- NextAuth authentication with RBAC
- shadcn/ui component library
- .NET 8 backend API with Patient CRUD
- PostgreSQL database with Prisma
- HIPAA-compliant middleware and audit logging
"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/urgentcare-emr.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up Database (Supabase)

1. Go to https://supabase.com
2. Create new project
3. Wait for database to provision
4. Go to **Settings** → **Database**
5. Copy **Connection Pooling** string (for Prisma)
   - Example: `postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true`

### Step 3: Deploy to Vercel

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

5. Add **Environment Variables**:

```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_BACKEND_URL=http://localhost:5099
```

6. Click **Deploy**

### Step 4: Run Database Migrations

After first deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
cd frontend
vercel link

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

### Step 5: Update NEXTAUTH_URL

1. Get your Vercel URL (e.g., `https://urgentcare-emr.vercel.app`)
2. Go to Vercel dashboard → **Settings** → **Environment Variables**
3. Update `NEXTAUTH_URL` to your Vercel URL
4. Redeploy

---

## 🔧 Deploy Backend (.NET 8 API)

### Option 1: Railway (Recommended)

1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Configure:
   - **Root Directory**: `backend/UrgentCare.API`
   - **Build Command**: `dotnet publish -c Release -o out`
   - **Start Command**: `dotnet out/UrgentCare.API.dll`

5. Add Environment Variables:
```env
ConnectionStrings__DefaultConnection=Host=your-db-host;Database=urgentcare;Username=user;Password=pass;SSL Mode=Require
CORS__AllowedOrigins__0=https://your-app.vercel.app
```

6. Deploy

### Option 2: Render

1. Go to https://render.com
2. Click **New** → **Web Service**
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `backend/UrgentCare.API`
   - **Build Command**: `dotnet publish -c Release -o out`
   - **Start Command**: `dotnet out/UrgentCare.API.dll`

5. Add Environment Variables (same as Railway)

### Option 3: Azure App Service

```bash
# Install Azure CLI
brew install azure-cli

# Login
az login

# Create resource group
az group create --name urgentcare-rg --location eastus

# Create app service plan
az appservice plan create --name urgentcare-plan --resource-group urgentcare-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group urgentcare-rg --plan urgentcare-plan --name urgentcare-api --runtime "DOTNETCORE:8.0"

# Deploy
cd backend/UrgentCare.API
az webapp up --name urgentcare-api --resource-group urgentcare-rg
```

---

## 🔄 Update Frontend with Backend URL

After deploying backend:

1. Get backend URL (e.g., `https://urgentcare-api.railway.app`)
2. Update Vercel environment variable:
   - `NEXT_PUBLIC_BACKEND_URL=https://urgentcare-api.railway.app`
3. Redeploy frontend

---

## ✅ Verify Deployment

### Frontend
1. Visit your Vercel URL
2. Should see landing page
3. Try `/login` - should load login page
4. Try `/register` - should load registration page

### Backend
1. Visit `https://your-backend-url/health`
2. Should return `{"ok":true,"timestamp":"..."}`
3. Visit `https://your-backend-url/swagger`
4. Should see Swagger UI with API documentation

### Database
```bash
# Connect to Supabase
cd frontend
npx prisma studio
# Should show all tables
```

---

## 🐛 Troubleshooting

### "Module not found" on Vercel
- Ensure `package.json` is in `frontend/` directory
- Check build logs for specific missing module
- Verify all dependencies are in `dependencies`, not `devDependencies`

### "Prisma Client not generated"
- Add to `package.json`:
  ```json
  "scripts": {
    "postinstall": "prisma generate"
  }
  ```

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Ensure connection pooling is enabled (`?pgbouncer=true`)
- Check Supabase database is running

### "CORS error"
- Update backend CORS configuration with frontend URL
- Redeploy backend
- Clear browser cache

### "NextAuth error"
- Verify `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your Vercel URL
- Check Vercel logs for specific error

---

## 📊 Monitoring

### Vercel
- **Analytics**: Vercel dashboard → Analytics
- **Logs**: Vercel dashboard → Deployments → View Function Logs

### Railway/Render
- **Logs**: Dashboard → Your service → Logs
- **Metrics**: Dashboard → Your service → Metrics

### Supabase
- **Database**: Dashboard → Database → Tables
- **Logs**: Dashboard → Logs

---

## 💰 Cost Estimate

### Free Tier (Sufficient for Demo)
- **Vercel**: Free (100GB bandwidth, unlimited deployments)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **Railway**: Free ($5 credit/month, ~500 hours)

### Paid (Production)
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Railway**: ~$10-20/month
- **Total**: ~$55-65/month

---

## 🔐 Security Checklist

Before going live:
- [ ] All secrets in environment variables (not hardcoded)
- [ ] `NEXTAUTH_SECRET` is strong and random
- [ ] Database uses SSL (`SSL Mode=Require`)
- [ ] CORS only allows your frontend URL
- [ ] Rate limiting enabled (add in Phase 6)
- [ ] HTTPS enforced
- [ ] Environment variables not committed to git

---

## 📝 Post-Deployment

### Update README
Add deployment URLs to README:
```markdown
## Live Demo
- Frontend: https://urgentcare-emr.vercel.app
- Backend API: https://urgentcare-api.railway.app
- API Docs: https://urgentcare-api.railway.app/swagger
```

### Create Demo Account
```bash
# Register a demo account
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Doctor",
    "email": "demo@urgentcare.com",
    "password": "Demo123!",
    "role": "DOCTOR"
  }'
```

### Test End-to-End
1. Register user
2. Login
3. Create patient via Swagger
4. View patients in frontend (Phase 2)

---

## 🎉 You're Live!

Your EMR system is now deployed and accessible to employers/clients!

**Share these links:**
- Live App: `https://your-app.vercel.app`
- API Docs: `https://your-backend-url/swagger`
- GitHub: `https://github.com/YOUR_USERNAME/urgentcare-emr`
