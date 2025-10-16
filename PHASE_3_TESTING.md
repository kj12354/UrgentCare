# Phase 3 Testing Guide

## Quick Start Testing

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

### 2. Configure Environment Variables

Add to `frontend/.env.local`:
```env
# Required for transcription
OPENAI_API_KEY="sk-proj-..."

# Optional for S3 upload (can test without)
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"

# Existing variables (keep these)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5099"
```

### 3. Start Development Server
```bash
cd frontend
pnpm dev
```

Visit: http://localhost:3000/encounters/new

## Test Scenarios

### Scenario 1: Basic Recording
**Goal:** Verify audio recording works

1. Navigate to `/encounters/new`
2. Click "Start Recording"
3. Allow microphone access when prompted
4. Speak for 5 seconds: "Testing one two three"
5. Click "Stop"

**Expected:**
- ✅ Timer shows accurate duration
- ✅ Recording details card appears
- ✅ File size shown (should be ~50-100 KB for 5 seconds)
- ✅ Format shows "audio/webm"

### Scenario 2: Pause/Resume
**Goal:** Test pause functionality

1. Start recording
2. Speak for 3 seconds
3. Click "Pause"
4. Wait 2 seconds
5. Click "Resume"
6. Speak for 3 more seconds
7. Click "Stop"

**Expected:**
- ✅ Timer pauses when paused
- ✅ Timer resumes from paused time
- ✅ Total duration is ~6 seconds (not 8)
- ✅ Audio contains both segments

### Scenario 3: Audio Playback
**Goal:** Verify recorded audio plays back

1. Complete a recording
2. Click "Play"
3. Listen to playback
4. Click "Pause" during playback
5. Click "Play" again

**Expected:**
- ✅ Audio plays clearly
- ✅ Pause stops playback
- ✅ Resume continues from pause point
- ✅ Button changes between Play/Pause

### Scenario 4: Medical Transcription
**Goal:** Test Whisper API integration

1. Enter chief complaint: "Chest pain"
2. Start recording
3. Speak clearly:
   ```
   Patient presents with chest pain radiating to the left arm.
   Pain started approximately two hours ago.
   Patient has a history of hypertension and diabetes.
   Currently taking lisinopril and metformin.
   ```
4. Stop recording
5. Click "Transcribe"
6. Wait for transcription

**Expected:**
- ✅ Transcription completes in 5-15 seconds
- ✅ Medical terms spelled correctly (lisinopril, metformin, hypertension)
- ✅ Proper punctuation and capitalization
- ✅ Segments shown with timestamps
- ✅ Duration matches recording

### Scenario 5: Edit Transcript
**Goal:** Test transcript editing

1. Complete transcription
2. Click "Edit"
3. Change some text
4. Click "Save"
5. Verify changes persist
6. Click "Edit" again
7. Make changes
8. Click "Cancel"

**Expected:**
- ✅ Edit mode shows textarea
- ✅ Save preserves changes
- ✅ Cancel reverts changes
- ✅ UI updates correctly

### Scenario 6: Copy Transcript
**Goal:** Test clipboard functionality

1. Complete transcription
2. Click "Copy"
3. Open text editor
4. Paste (Cmd+V / Ctrl+V)

**Expected:**
- ✅ Button shows "Copied" briefly
- ✅ Full transcript copied to clipboard
- ✅ Formatting preserved

### Scenario 7: New Recording
**Goal:** Test reset functionality

1. Complete recording and transcription
2. Click "New Recording"
3. Verify all states reset
4. Record new audio
5. Transcribe again

**Expected:**
- ✅ Timer resets to 00:00.0
- ✅ Previous audio cleared
- ✅ Transcript cleared
- ✅ New recording works independently

### Scenario 8: Error Handling - No Microphone
**Goal:** Test permission denial

1. Navigate to `/encounters/new`
2. Click "Start Recording"
3. Deny microphone permission

**Expected:**
- ✅ Error message displays
- ✅ Message mentions permissions
- ✅ No crash or freeze

### Scenario 9: Error Handling - No API Key
**Goal:** Test missing configuration

1. Remove `OPENAI_API_KEY` from `.env.local`
2. Restart dev server
3. Record audio
4. Click "Transcribe"

**Expected:**
- ✅ Error message displays
- ✅ User-friendly error (not technical stack trace)
- ✅ Can try again after fixing

### Scenario 10: Long Recording
**Goal:** Test extended recording

1. Start recording
2. Speak continuously for 2-3 minutes
3. Stop recording
4. Transcribe

**Expected:**
- ✅ Timer accurate for long duration
- ✅ File size reasonable (~1-2 MB)
- ✅ Transcription completes (may take 20-30 seconds)
- ✅ Segments list is scrollable

## Browser Compatibility Tests

### Chrome/Edge (Chromium)
- ✅ Full support expected
- ✅ WebM with Opus codec

### Firefox
- ✅ Full support expected
- ✅ WebM with Opus codec

### Safari
- ⚠️ May use different codec
- ⚠️ Test microphone permissions carefully
- ✅ Should still work

### Mobile Browsers
- ⚠️ Limited testing
- ⚠️ May have permission issues
- ⚠️ Consider responsive design

## Performance Tests

### Test 1: Recording Performance
**Goal:** Verify low overhead

1. Open browser DevTools
2. Go to Performance tab
3. Start recording
4. Record profile for 30 seconds
5. Stop recording

**Expected:**
- ✅ CPU usage < 10%
- ✅ Memory increase < 10 MB
- ✅ No memory leaks
- ✅ Smooth UI (60 FPS)

### Test 2: Transcription Speed
**Goal:** Measure API performance

Record transcription times for different durations:
- 10 seconds → ~3-5 seconds
- 30 seconds → ~5-10 seconds
- 60 seconds → ~10-15 seconds
- 120 seconds → ~15-25 seconds

**Expected:**
- ✅ Roughly 1:3 ratio (1 min audio = 3 min processing)
- ✅ No timeouts
- ✅ Consistent performance

### Test 3: Memory Management
**Goal:** Verify no leaks

1. Record 10 audio clips
2. Transcribe each
3. Click "New Recording" between each
4. Check memory in DevTools

**Expected:**
- ✅ Memory returns to baseline
- ✅ No accumulation
- ✅ Proper cleanup

## Accessibility Tests

### Keyboard Navigation
1. Tab through all controls
2. Use Enter/Space to activate buttons
3. Navigate without mouse

**Expected:**
- ✅ All buttons reachable
- ✅ Focus indicators visible
- ✅ Logical tab order

### Screen Reader
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate through page
3. Interact with controls

**Expected:**
- ✅ All elements announced
- ✅ Button purposes clear
- ✅ Status updates announced

## Integration Tests

### Test 1: With Patient Context
**Goal:** Test patient-specific workflow

1. Navigate to `/patients/[id]` (if patient detail page exists)
2. Click "New Encounter" (if button exists)
3. Should navigate to `/encounters/new?patientId=123`
4. Complete recording and transcription
5. Save encounter

**Expected:**
- ✅ Patient ID pre-filled
- ✅ Context passed to transcription
- ✅ Saves to correct patient

### Test 2: Without Patient Context
**Goal:** Test standalone encounter

1. Navigate directly to `/encounters/new`
2. No patient ID in URL
3. Complete workflow

**Expected:**
- ✅ Works without patient
- ✅ Can still save encounter
- ✅ Patient can be selected later

## Troubleshooting

### Issue: Microphone Not Working
**Solutions:**
1. Check browser permissions
2. Try different browser
3. Check system microphone settings
4. Restart browser

### Issue: Transcription Fails
**Solutions:**
1. Verify OPENAI_API_KEY is set
2. Check API key is valid
3. Verify internet connection
4. Check OpenAI API status
5. Try shorter audio clip

### Issue: Audio Quality Poor
**Solutions:**
1. Check microphone quality
2. Reduce background noise
3. Speak closer to microphone
4. Try different browser

### Issue: Transcription Inaccurate
**Solutions:**
1. Speak more clearly
2. Reduce background noise
3. Add patient context (chief complaint)
4. Use medical terminology correctly
5. Edit transcript manually

## Success Criteria

Phase 3 is successful if:
- ✅ Can record audio in browser
- ✅ Can pause/resume recording
- ✅ Can play back audio
- ✅ Transcription is 90%+ accurate
- ✅ Medical terms recognized correctly
- ✅ Can edit and save transcripts
- ✅ No memory leaks or crashes
- ✅ Works in major browsers
- ✅ Error handling is user-friendly
- ✅ Performance is acceptable (<15s for 1min audio)

## Next Steps After Testing

Once Phase 3 tests pass:
1. ✅ Commit changes to git
2. ✅ Update README with Phase 3 status
3. ✅ Document any issues found
4. ✅ Plan Phase 4 (AI SOAP Notes)
5. ✅ Consider deployment to staging

## Test Results Template

```markdown
## Phase 3 Test Results

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Browser:** [Chrome/Firefox/Safari] [Version]
**OS:** [macOS/Windows/Linux]

### Basic Recording
- [ ] Start/Stop works
- [ ] Timer accurate
- [ ] Audio quality good

### Pause/Resume
- [ ] Pause works
- [ ] Resume works
- [ ] Timer correct

### Playback
- [ ] Play works
- [ ] Pause works
- [ ] Audio clear

### Transcription
- [ ] API call succeeds
- [ ] Accuracy >90%
- [ ] Medical terms correct
- [ ] Segments shown

### Editing
- [ ] Edit mode works
- [ ] Save persists changes
- [ ] Cancel reverts

### Copy
- [ ] Clipboard works
- [ ] Full text copied

### Error Handling
- [ ] Permission denial handled
- [ ] API errors handled
- [ ] User-friendly messages

### Performance
- [ ] No lag during recording
- [ ] Transcription <15s for 1min
- [ ] No memory leaks

### Overall
- [ ] All tests passed
- [ ] Ready for Phase 4

**Issues Found:**
[List any issues]

**Notes:**
[Any additional observations]
```

## Quick Test Commands

```bash
# Install dependencies
cd frontend && pnpm install

# Start dev server
pnpm dev

# Check for TypeScript errors
pnpm build

# Run linter
pnpm lint

# Open in browser
open http://localhost:3000/encounters/new
```

## Demo Script

For demonstrating Phase 3 to stakeholders:

1. **Introduction** (30 seconds)
   - "This is our voice recording and transcription system"
   - "It uses AI to convert doctor-patient conversations to text"

2. **Recording Demo** (1 minute)
   - Click "Start Recording"
   - Speak sample encounter
   - Show pause/resume
   - Stop recording

3. **Transcription Demo** (30 seconds)
   - Click "Transcribe"
   - Wait for results
   - Show accuracy

4. **Features Demo** (1 minute)
   - Show segments with timestamps
   - Demonstrate editing
   - Show copy functionality
   - Play back audio

5. **Conclusion** (30 seconds)
   - "This saves doctors 5-10 minutes per encounter"
   - "Next: AI will generate SOAP notes automatically"

Total demo time: ~3-4 minutes
