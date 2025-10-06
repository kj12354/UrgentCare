# 🚀 Deployment Checklist

## Pre-Deployment

### 1. Update GitHub Link
- [ ] Edit `frontend/src/app/page.tsx` line 85
- [ ] Replace `YOUR_USERNAME` with your GitHub username

### 2. Test Locally
```bash
# Frontend
cd frontend
pnpm install
pnpm build
pnpm start

# Backend
cd backend/UrgentCare.API
dotnet build
dotnet run
```

### 3. Create GitHub Repository
```bash
cd /Users/krishnamjhalani/Desktop/UrgentCare/urgentcare-emr
git init
git add .
git commit -m "feat: Initial commit - Phase 1 complete"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/urgentcare-emr.git
git push -u origin main
```

## Vercel Deployment

### 1. Sign Up / Login
- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub

### 2. Import Project
- [ ] Click "Add New" → "Project"
- [ ] Select `urgentcare-emr` repository
- [ ] Configure:
  - **Framework**: Next.js
  - **Root Directory**: `frontend`
  - **Build Command**: `pnpm install && pnpm build`
  - **Output Directory**: `.next`

### 3. Add Environment Variables
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_BACKEND_URL=http://localhost:5099
```

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Visit your app URL

### 5. Update NEXTAUTH_URL
- [ ] Copy your Vercel URL
- [ ] Go to Settings → Environment Variables
- [ ] Update `NEXTAUTH_URL` to your Vercel URL
- [ ] Redeploy

## Database Setup (Supabase)

### 1. Create Project
- [ ] Go to https://supabase.com
- [ ] Create new project
- [ ] Wait for provisioning

### 2. Get Connection String
- [ ] Go to Settings → Database
- [ ] Copy "Connection Pooling" string
- [ ] Update `DATABASE_URL` in Vercel

### 3. Run Migrations
```bash
cd frontend
vercel env pull .env.local
npx prisma migrate deploy
```

## Post-Deployment

### 1. Test Live Site
- [ ] Visit your Vercel URL
- [ ] Check landing page loads
- [ ] Try `/login` page
- [ ] Try `/register` page

### 2. Create Demo Account
- [ ] Register with test credentials
- [ ] Login successfully
- [ ] Access dashboard

### 3. Update README
- [ ] Add live demo link
- [ ] Add screenshots
- [ ] Update GitHub link

## Optional: Backend Deployment

### Railway
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. Configure root directory: `backend/UrgentCare.API`
5. Add environment variables
6. Deploy

### Update Frontend
- [ ] Get Railway URL
- [ ] Update `NEXT_PUBLIC_BACKEND_URL` in Vercel
- [ ] Redeploy

## Verification

### ✅ Checklist
- [ ] Site loads at Vercel URL
- [ ] Landing page displays correctly
- [ ] Login page works
- [ ] Register page works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] GitHub link works
- [ ] CI/CD pipeline passes

## Share with Employers

### Portfolio Links
```markdown
🔗 Live Demo: https://your-app.vercel.app
📂 GitHub: https://github.com/YOUR_USERNAME/urgentcare-emr
📖 API Docs: https://your-backend-url/swagger (if deployed)
```

### Talking Points
- ✅ Full-stack application (Next.js 14 + .NET 8)
- ✅ HIPAA-compliant architecture
- ✅ Modern tech stack (TypeScript, Prisma, shadcn/ui)
- ✅ Authentication with role-based access control
- ✅ RESTful API with Swagger documentation
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Production-ready deployment

### Demo Credentials
```
Email: demo@urgentcare.com
Password: Demo123!
Role: DOCTOR
```

## Troubleshooting

### Build fails on Vercel
- Check build logs
- Verify all dependencies in `package.json`
- Ensure `postinstall` script runs Prisma generate

### Database connection error
- Verify `DATABASE_URL` is correct
- Check Supabase database is running
- Ensure connection pooling is enabled

### NextAuth error
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches Vercel URL
- Clear cookies and try again

## Success! 🎉

Your EMR system is now live and ready to show employers!

**Next Steps:**
1. Continue with Phase 2 (Patient Management UI)
2. Add more features
3. Deploy backend API
4. Add screenshots to README
