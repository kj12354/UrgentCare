# Development Roadmap

## Phase 1: Core Setup ✅ COMPLETE

**Status:** ✅ Done  
**Time:** 4-6 hours

- [x] NextAuth with credentials provider and database sessions
- [x] shadcn/ui components installed and configured
- [x] Backend DI, CORS, and middleware wired
- [x] PatientService and PatientsController with full CRUD

---

## Phase 2: Patient Management UI (Week 1-2)

**Status:** 🔜 Next  
**Estimated Time:** 8-12 hours

### Tasks

#### 2.1 Patient List Component
**Tell Windsurf:**
> "Build PatientList component with search, pagination, and table display"

**Files to Create:**
- `frontend/src/components/patients/PatientList.tsx`
- `frontend/src/components/patients/PatientTable.tsx`
- `frontend/src/hooks/usePatients.ts`

**Features:**
- Table with columns: Name, DOB, Phone, Actions
- Search by name or phone
- Pagination (10, 25, 50 per page)
- Loading states
- Empty state
- Error handling

#### 2.2 Patient Form Component
**Tell Windsurf:**
> "Create PatientForm component for add/edit with validation"

**Files to Create:**
- `frontend/src/components/patients/PatientForm.tsx`
- `frontend/src/components/patients/PatientFormDialog.tsx`

**Features:**
- Form fields: First Name, Last Name, DOB, Phone
- Zod validation
- Error messages
- Submit/Cancel buttons
- Loading state during save

#### 2.3 Patient Pages
**Tell Windsurf:**
> "Implement patient pages connecting to API"

**Files to Update:**
- `frontend/src/app/(dashboard)/patients/page.tsx` - List view
- `frontend/src/app/(dashboard)/patients/new/page.tsx` - Create form
- `frontend/src/app/(dashboard)/patients/[id]/page.tsx` - Detail view

**Features:**
- Integrate PatientList component
- Add "New Patient" button
- Connect to backend API
- Handle API errors
- Show success toasts

#### 2.4 Patient Detail View
**Tell Windsurf:**
> "Add patient detail view with encounter history"

**Files to Create:**
- `frontend/src/components/patients/PatientDetail.tsx`
- `frontend/src/components/patients/PatientHeader.tsx`
- `frontend/src/components/patients/EncounterHistory.tsx`

**Features:**
- Patient demographics
- Edit patient button
- Encounter timeline
- "New Encounter" button
- Delete patient (with confirmation)

---

## Phase 3: AI Voice & Transcription (Week 2)

**Status:** ⏳ Pending  
**Estimated Time:** 10-15 hours

### Tasks

#### 3.1 Voice Recorder Component
**Tell Windsurf:**
> "Implement VoiceRecorder component with MediaRecorder API"

**Files to Create:**
- `frontend/src/components/encounters/VoiceRecorder.tsx`
- `frontend/src/hooks/useAudioRecorder.ts`
- `frontend/src/lib/audio.ts`

**Features:**
- Start/stop recording
- Audio visualization
- Timer display
- Audio playback
- Save to blob

#### 3.2 Transcription API
**Tell Windsurf:**
> "Create transcribe API route using OpenAI Whisper"

**Files to Update:**
- `frontend/src/app/api/transcribe/route.ts`
- `frontend/src/lib/whisper.ts`

**Features:**
- Accept audio file upload
- Call Whisper API
- Return transcript
- Handle errors
- Rate limiting

#### 3.3 End-to-End Test
**Tell Windsurf:**
> "Test audio recording and transcription end-to-end"

**Testing:**
- Record audio in browser
- Upload to API
- Receive transcript
- Display in UI
- Save to encounter

---

## Phase 4: AI SOAP Note Generation (Week 2-3)

**Status:** ⏳ Pending  
**Estimated Time:** 15-20 hours

### Tasks

#### 4.1 Claude Integration
**Tell Windsurf:**
> "Implement Anthropic Claude integration for SOAP note generation"

**Files to Create:**
- `frontend/src/app/api/generate-note/route.ts`
- `frontend/src/lib/anthropic.ts` (update existing)
- `backend/UrgentCare.API/Services/AIService.cs` (update existing)

**Features:**
- Medical prompt template
- Structured JSON output
- Parse SOAP sections
- Error handling

#### 4.2 SOAP Note Editor
**Tell Windsurf:**
> "Build SOAPNoteEditor component with sections"

**Files to Create:**
- `frontend/src/components/encounters/SOAPNoteEditor.tsx`
- `frontend/src/components/encounters/SOAPSection.tsx`

**Features:**
- Subjective section
- Objective section
- Assessment section
- Plan section
- Edit/save functionality
- Auto-save draft

#### 4.3 Encounter Workflow
**Tell Windsurf:**
> "Create encounter workflow: record → transcribe → generate note → edit → save"

**Files to Create:**
- `frontend/src/components/encounters/EncounterWorkflow.tsx`
- `frontend/src/app/(dashboard)/encounters/new/page.tsx`

**Features:**
- Step-by-step wizard
- Progress indicator
- Back/Next buttons
- Save draft
- Complete encounter

#### 4.4 ICD-10 Code Suggestions
**Tell Windsurf:**
> "Add ICD-10 code suggestion using Claude"

**Files to Create:**
- `frontend/src/components/encounters/ICDCodeSelector.tsx`
- `frontend/src/app/api/icd-codes/search/route.ts` (update)

**Features:**
- AI-suggested codes
- Search ICD-10 database
- Multi-select
- Code descriptions

---

## Phase 5: Document Management (Week 3)

**Status:** ⏳ Pending  
**Estimated Time:** 12-18 hours

### Tasks

#### 5.1 S3 Upload
**Tell Windsurf:**
> "Implement S3 file upload with presigned URLs"

**Files to Create:**
- `frontend/src/lib/s3.ts`
- `frontend/src/app/api/documents/upload/route.ts` (update)
- `backend/UrgentCare.API/Services/IDocumentService.cs`
- `backend/UrgentCare.API/Services/DocumentService.cs`

**Features:**
- Generate presigned URLs
- Direct browser upload
- Progress tracking
- File type validation
- Size limits

#### 5.2 Document Uploader
**Tell Windsurf:**
> "Create DocumentUploader with drag-and-drop"

**Files to Create:**
- `frontend/src/components/documents/DocumentUploader.tsx`
- `frontend/src/components/documents/FileDropZone.tsx`

**Features:**
- Drag-and-drop
- File preview
- Upload progress
- Multiple files
- Cancel upload

#### 5.3 Document Viewer & Search
**Tell Windsurf:**
> "Add document viewer and search functionality"

**Files to Create:**
- `frontend/src/components/documents/DocumentViewer.tsx`
- `frontend/src/components/documents/DocumentSearch.tsx`
- `frontend/src/app/(dashboard)/documents/page.tsx`

**Features:**
- PDF viewer
- Image viewer
- Download button
- Search by patient
- Filter by type

---

## Phase 6: Security & Compliance (Week 3-4)

**Status:** ⏳ Pending  
**Estimated Time:** 10-15 hours

### Tasks

#### 6.1 Field-Level Encryption
**Tell Windsurf:**
> "Implement field-level encryption for PHI data"

**Files to Update:**
- `backend/UrgentCare.API/Utilities/Encryption.cs`
- `backend/UrgentCare.API/Services/PatientService.cs`

**Features:**
- Encrypt sensitive fields
- Decrypt on read
- Key management
- Rotation strategy

#### 6.2 Comprehensive Audit Logging
**Tell Windsurf:**
> "Add comprehensive audit logging for all data access"

**Files to Update:**
- `backend/UrgentCare.API/Middleware/AuditLoggingMiddleware.cs`
- `backend/UrgentCare.API/Services/AuditService.cs`

**Features:**
- Log all API calls
- Capture user/IP
- Mask PHI in logs
- Retention policy

#### 6.3 Session Management
**Tell Windsurf:**
> "Implement session timeout and automatic logout"

**Files to Create:**
- `frontend/src/components/shared/SessionTimeout.tsx`
- `frontend/src/hooks/useSessionTimeout.ts`

**Features:**
- 8-hour timeout
- Idle detection
- Warning modal
- Auto-logout
- Refresh token

#### 6.4 HIPAA Error Handling
**Tell Windsurf:**
> "Add HIPAA-compliant error handling (no PHI in logs)"

**Files to Update:**
- `backend/UrgentCare.API/Middleware/ErrorHandlingMiddleware.cs`
- `backend/UrgentCare.API/Middleware/HIPAAComplianceMiddleware.cs`

**Features:**
- Generic error messages
- Detailed logging (server-side only)
- No PHI in responses
- Error codes

---

## Phase 7: Testing & Deployment (Week 4)

**Status:** ⏳ Pending  
**Estimated Time:** 12-18 hours

### Tasks

#### 7.1 Unit Tests
**Tell Windsurf:**
> "Write Jest tests for API routes"

**Files to Create:**
- `frontend/__tests__/api/patients.test.ts`
- `frontend/__tests__/api/auth.test.ts`
- `backend/UrgentCare.Tests/Unit/PatientServiceTests.cs`

**Coverage:**
- API routes
- Service methods
- Utility functions
- 80%+ coverage

#### 7.2 E2E Tests
**Tell Windsurf:**
> "Create E2E tests with Playwright for critical workflows"

**Files to Create:**
- `frontend/e2e/auth.spec.ts`
- `frontend/e2e/patients.spec.ts`
- `frontend/e2e/encounters.spec.ts`

**Scenarios:**
- User registration/login
- Create/edit patient
- Record encounter
- Generate SOAP note

#### 7.3 Deployment Config
**Tell Windsurf:**
> "Add deployment configuration for Vercel and Railway"

**Files to Create:**
- `frontend/vercel.json`
- `backend/.dockerignore`
- `backend/Dockerfile`
- `.github/workflows/ci.yml`

**Features:**
- CI/CD pipeline
- Automated tests
- Environment variables
- Database migrations

---

## Priority Order

### Immediate (This Week)
1. ✅ Phase 1: Core Setup - **DONE**
2. 🔜 Phase 2: Patient Management UI - **START HERE**

### Short-term (Next 2 Weeks)
3. Phase 3: Voice & Transcription
4. Phase 4: SOAP Note Generation

### Medium-term (Week 3-4)
5. Phase 5: Document Management
6. Phase 6: Security & Compliance
7. Phase 7: Testing & Deployment

---

## Success Criteria

### Phase 2
- [ ] Can view list of patients
- [ ] Can search patients by name
- [ ] Can create new patient
- [ ] Can edit existing patient
- [ ] Can delete patient
- [ ] All operations connected to backend API

### Phase 3
- [ ] Can record audio in browser
- [ ] Audio uploads to backend
- [ ] Whisper transcribes audio
- [ ] Transcript displays in UI

### Phase 4
- [ ] Can generate SOAP note from transcript
- [ ] Can edit SOAP note sections
- [ ] Can save encounter with note
- [ ] ICD-10 codes suggested

### Phase 5
- [ ] Can upload documents to S3
- [ ] Can view uploaded documents
- [ ] Can search documents
- [ ] Can download documents

### Phase 6
- [ ] PHI fields encrypted
- [ ] All actions audited
- [ ] Session timeout works
- [ ] No PHI in error logs

### Phase 7
- [ ] 80%+ test coverage
- [ ] E2E tests pass
- [ ] Deploys to production
- [ ] CI/CD pipeline working

---

## Estimated Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1 | 4-6 hours | ✅ Done | ✅ Done |
| Phase 2 | 8-12 hours | Week 1 | Week 2 |
| Phase 3 | 10-15 hours | Week 2 | Week 2 |
| Phase 4 | 15-20 hours | Week 2 | Week 3 |
| Phase 5 | 12-18 hours | Week 3 | Week 3 |
| Phase 6 | 10-15 hours | Week 3 | Week 4 |
| Phase 7 | 12-18 hours | Week 4 | Week 4 |

**Total Estimated Time:** 71-104 hours (9-13 working days)

---

## Next Command to Run

```bash
# Start Phase 2: Patient Management UI
cd frontend
pnpm dev

# In another terminal
cd backend/UrgentCare.API
dotnet run

# Then tell Windsurf:
"Build PatientList component with search, pagination, and table display"
```

---

**Current Status:** ✅ Phase 1 Complete  
**Next Up:** 🔜 Phase 2: Patient Management UI  
**Ready to Start:** ✅ YES
