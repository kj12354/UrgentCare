# Phase 3 Installation Guide

## Quick Install (5 minutes)

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

This installs:
- `openai` (^4.58.1) - For Whisper transcription
- `@aws-sdk/client-s3` (^3.645.0) - For audio storage

### 2. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)

### 3. Configure Environment
Add to `frontend/.env.local`:
```env
OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
```

### 4. Start Development Server
```bash
pnpm dev
```

### 5. Test It
1. Open http://localhost:3000/encounters/new
2. Click "Start Recording"
3. Allow microphone access
4. Speak for 10 seconds
5. Click "Stop"
6. Click "Transcribe"
7. See your text appear!

## What's New in Phase 3

### Components
- `VoiceRecorder` - Record audio with pause/resume
- `TranscriptionDisplay` - View and edit transcripts
- `NewEncounterPage` - Complete workflow

### Features
- ✅ Browser-based audio recording
- ✅ AI transcription with Whisper
- ✅ Medical terminology support
- ✅ Edit and copy transcripts
- ✅ Segment timestamps
- ✅ HIPAA-compliant storage ready

### Files Created
```
frontend/src/components/voice/
  - VoiceRecorder.tsx
  - TranscriptionDisplay.tsx

frontend/src/lib/
  - whisper.ts
  - s3-upload.ts

frontend/src/app/(dashboard)/encounters/new/
  - page.tsx

frontend/src/app/api/transcribe/
  - route.ts (updated)
```

## Troubleshooting

### "Cannot find module" errors
**Solution:** Run `pnpm install` in the frontend directory

### "Could not access microphone"
**Solution:** Allow microphone in browser permissions

### "Failed to transcribe"
**Solution:** Check OPENAI_API_KEY in .env.local

## Next Steps
- Test with real patient encounters
- Move to Phase 4: AI SOAP Notes
- Deploy to production

## Documentation
- **PHASE_3_SUMMARY.md** - Full technical docs
- **PHASE_3_TESTING.md** - Testing guide
- **QUICKSTART_PHASE3.md** - Quick start guide
- **PHASE_3_COMPLETE.md** - Executive summary
