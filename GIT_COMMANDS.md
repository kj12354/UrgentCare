# Git Commands to Push to GitHub

## Step 1: Initialize Git Repository

```bash
cd /Users/krishnamjhalani/Desktop/UrgentCare/urgentcare-emr

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "feat: Phase 1 complete - HIPAA-compliant EMR foundation

✅ Implemented Features:
- NextAuth authentication with credentials provider and RBAC
- shadcn/ui component library with Tailwind CSS
- .NET 8 Web API with Entity Framework Core
- Full CRUD Patient management API
- PostgreSQL database with Prisma ORM
- HIPAA-compliant middleware (audit logging, error handling, PHI protection)
- Professional landing page with feature showcase
- Comprehensive documentation (README, QUICKSTART, DEPLOYMENT guides)
- CI/CD pipeline with GitHub Actions
- Vercel deployment configuration

🏗️ Tech Stack:
- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- Backend: .NET 8, Entity Framework Core, PostgreSQL
- Auth: NextAuth.js with database sessions
- Deployment: Vercel (frontend), Railway/Render (backend)

📚 Documentation:
- Complete setup instructions
- Environment variable templates
- Deployment guides for Vercel and Railway
- Development roadmap for Phases 2-7

🎯 Phase 1 Status: Complete
Ready for employer showcase and Phase 2 development.
"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `urgentcare-emr`
3. Description: `AI-powered, HIPAA-compliant urgent care EMR with speech-to-text and intelligent documentation`
4. Choose **Public** (for portfolio) or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 3: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/urgentcare-emr.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Verify

1. Go to `https://github.com/YOUR_USERNAME/urgentcare-emr`
2. You should see all your files
3. README.md should display nicely

## Step 5: Update GitHub Link in Code

Before deploying to Vercel, update the GitHub link in your landing page:

```bash
# Edit frontend/src/app/page.tsx
# Line 85: Replace YOUR_USERNAME with your actual GitHub username

# Commit the change
git add frontend/src/app/page.tsx
git commit -m "docs: Update GitHub link in landing page"
git push
```

## Optional: Add Repository Topics

On GitHub, click the gear icon next to "About" and add topics:
- `nextjs`
- `typescript`
- `dotnet`
- `healthcare`
- `emr`
- `hipaa`
- `ai`
- `prisma`
- `postgresql`
- `shadcn-ui`

## Optional: Add Repository Description

Click the gear icon next to "About" and add:
- **Description**: AI-powered, HIPAA-compliant urgent care EMR with speech-to-text and intelligent documentation
- **Website**: (Add after Vercel deployment)
- **Topics**: (Add relevant tags)

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/urgentcare-emr.git
```

### "Permission denied (publickey)"
Use HTTPS instead of SSH, or set up SSH keys:
```bash
# Use HTTPS URL
git remote set-url origin https://github.com/YOUR_USERNAME/urgentcare-emr.git
```

### "Large files detected"
If you accidentally committed `node_modules` or `.next`:
```bash
# Remove from git but keep locally
git rm -r --cached node_modules frontend/.next backend/bin backend/obj
git commit -m "chore: Remove build artifacts"
git push
```

## Next Steps

After pushing to GitHub:
1. ✅ Deploy to Vercel (see DEPLOYMENT.md)
2. ✅ Set up Supabase database
3. ✅ Run Prisma migrations
4. ✅ Test live site
5. ✅ Share with employers!

## Quick Reference

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "your message"

# Push
git push

# Pull latest
git pull

# View remote
git remote -v

# View commit history
git log --oneline
```

## Success! 🎉

Your code is now on GitHub and ready to deploy to Vercel!

**Portfolio Links:**
- GitHub: `https://github.com/YOUR_USERNAME/urgentcare-emr`
- Live Demo: (Add after Vercel deployment)
