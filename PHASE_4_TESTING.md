# Phase 4 Testing Guide: AI SOAP Note Generation

## Test Environment Setup

### Prerequisites
```bash
# 1. Ensure Phase 3 is working
# 2. Install dependencies
cd frontend
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# 4. Start development server
npm run dev
```

## Test Cases

### Test 1: Basic SOAP Note Generation

**Objective:** Verify AI can generate a complete SOAP note from a transcript

**Steps:**
1. Navigate to http://localhost:3000/encounters/new
2. Enter chief complaint: "Chest pain"
3. Enter or record transcript:
   ```
   Patient is a 45-year-old male presenting with chest pain that started 2 hours ago.
   Pain is described as pressure-like, radiating to left arm. Associated with shortness
   of breath and diaphoresis. No relief with rest. Patient has history of hypertension
   and takes lisinopril 10mg daily. Vital signs: BP 150/95, HR 98, RR 20, O2 sat 96%.
   Physical exam reveals anxious appearance, diaphoretic. Cardiovascular exam shows
   regular rate and rhythm, no murmurs. Lungs clear bilaterally.
   ```
4. Switch to "SOAP Note" tab
5. Click "AI Generate"

**Expected Results:**
- ✅ Generation completes in 3-8 seconds
- ✅ All SOAP sections populated
- ✅ Chief complaint matches input
- ✅ HPI includes key details
- ✅ Physical exam findings extracted
- ✅ Assessment includes differential diagnosis
- ✅ Plan includes appropriate interventions
- ✅ ICD-10 codes suggested (e.g., I20.0, I21.9)
- ✅ Medications extracted (lisinopril 10mg)

**Pass Criteria:**
- All sections contain relevant content
- Medical terminology is accurate
- At least 2 ICD-10 codes suggested
- Medications correctly extracted

---

### Test 2: ICD-10 Code Search

**Objective:** Verify ICD-10 code search functionality

**Steps:**
1. In SOAP Note tab, locate ICD-10 Search sidebar
2. Enter symptoms: "chest pain, shortness of breath"
3. Enter diagnosis: "acute coronary syndrome"
4. Click "Search ICD-10 Codes"

**Expected Results:**
- ✅ Search completes in 2-5 seconds
- ✅ 3-5 relevant codes returned
- ✅ Each code has description
- ✅ Confidence levels displayed (high/medium/low)
- ✅ "Add" button available for each code
- ✅ Already-added codes show "Added" badge

**Pass Criteria:**
- At least 3 codes returned
- Codes are relevant to symptoms
- Confidence indicators present
- Can add codes to SOAP note

---

### Test 3: SOAP Note Editing

**Objective:** Verify edit functionality works correctly

**Steps:**
1. Generate a SOAP note (Test 1)
2. Click "Edit" button
3. Modify Subjective section
4. Add a new diagnosis
5. Edit an ICD-10 code
6. Add a medication
7. Click "Save"

**Expected Results:**
- ✅ Edit mode activates
- ✅ All fields become editable
- ✅ Changes persist after save
- ✅ "Unsaved changes" indicator appears
- ✅ Save button becomes enabled
- ✅ Preview mode shows updated content

**Pass Criteria:**
- All sections editable
- Changes saved correctly
- No data loss on save
- UI updates appropriately

---

### Test 4: Medication Management

**Objective:** Verify medication tracking functionality

**Steps:**
1. Generate a SOAP note
2. Switch to "Medications" tab
3. Click "Add Medication"
4. Enter:
   - Name: "Aspirin"
   - Dosage: "325mg"
   - Frequency: "Once daily"
   - Duration: "Ongoing"
   - Instructions: "Take with food"
5. Click "Save"

**Expected Results:**
- ✅ Medication form appears
- ✅ All fields editable
- ✅ Medication card displays after save
- ✅ Can edit medication
- ✅ Can remove medication
- ✅ Medications persist in SOAP note

**Pass Criteria:**
- Can add multiple medications
- All fields save correctly
- Can edit and remove medications
- Data persists across tabs

---

### Test 5: Copy to Clipboard

**Objective:** Verify copy functionality exports formatted SOAP note

**Steps:**
1. Generate a complete SOAP note
2. Click copy icon (top right)
3. Paste into text editor

**Expected Results:**
- ✅ Copy succeeds without errors
- ✅ Formatted text in clipboard
- ✅ All sections included
- ✅ Proper formatting with headers
- ✅ ICD-10 codes listed
- ✅ Medications formatted correctly

**Pass Criteria:**
- Formatted text copied
- All sections present
- Readable and professional format

---

### Test 6: Error Handling

**Objective:** Verify graceful error handling

**Test 6a: Invalid API Key**
1. Set invalid ANTHROPIC_API_KEY in .env.local
2. Restart server
3. Try to generate SOAP note

**Expected Results:**
- ✅ Error message displayed
- ✅ No crash or blank screen
- ✅ User-friendly error text
- ✅ Can retry after fixing

**Test 6b: Empty Transcript**
1. Leave transcript empty
2. Try to generate SOAP note

**Expected Results:**
- ✅ Validation error shown
- ✅ Clear message about requirement
- ✅ No API call made

**Test 6c: Network Error**
1. Disconnect internet
2. Try to generate SOAP note

**Expected Results:**
- ✅ Network error message
- ✅ No crash
- ✅ Can retry when connected

**Pass Criteria:**
- All errors handled gracefully
- Clear error messages
- No application crashes

---

### Test 7: Performance Testing

**Objective:** Verify performance meets requirements

**Test 7a: Short Transcript (100 words)**
- Expected time: 3-4 seconds
- Expected cost: ~$0.03

**Test 7b: Medium Transcript (300 words)**
- Expected time: 4-6 seconds
- Expected cost: ~$0.06

**Test 7c: Long Transcript (500 words)**
- Expected time: 6-8 seconds
- Expected cost: ~$0.10

**Pass Criteria:**
- All generations complete in <10 seconds
- No timeouts
- Consistent performance

---

### Test 8: Medical Accuracy

**Objective:** Verify medical content quality

**Test Scenarios:**

**8a: Acute Condition (Chest Pain)**
```
Chief Complaint: Chest pain
Transcript: [Use Test 1 transcript]
```
**Verify:**
- ✅ Appropriate differential diagnosis
- ✅ Relevant ICD-10 codes (I20.x, I21.x)
- ✅ Appropriate workup in plan
- ✅ Medications extracted correctly

**8b: Chronic Condition (Diabetes Follow-up)**
```
Chief Complaint: Diabetes follow-up
Transcript: Patient here for diabetes follow-up. Blood sugars have been
running 140-160 fasting. Currently on metformin 1000mg twice daily.
No hypoglycemic episodes. Diet compliance good. Exercise 3x per week.
A1C today is 7.2%. Foot exam normal, no neuropathy. Retinal exam
scheduled next month.
```
**Verify:**
- ✅ Chronic disease management documented
- ✅ ICD-10 code E11.x suggested
- ✅ Current medications listed
- ✅ Plan includes monitoring

**8c: Pediatric (Ear Infection)**
```
Chief Complaint: Ear pain
Transcript: 5-year-old female presents with right ear pain for 2 days.
Fever to 101.5F. Pulling at right ear. Decreased appetite. No vomiting.
Physical exam: Right TM erythematous and bulging. Left TM normal.
Throat clear. Lungs clear. Diagnosis: Acute otitis media, right ear.
Plan: Amoxicillin 400mg/5ml, 1 tsp twice daily for 10 days.
```
**Verify:**
- ✅ Pediatric dosing recognized
- ✅ ICD-10 code H66.x suggested
- ✅ Age-appropriate assessment
- ✅ Correct medication and dosing

**Pass Criteria:**
- Medical terminology accurate
- Appropriate diagnoses suggested
- Relevant ICD-10 codes
- Medications correctly extracted

---

### Test 9: Tab Navigation

**Objective:** Verify tab interface works correctly

**Steps:**
1. Generate SOAP note
2. Navigate through all tabs:
   - SOAP
   - ICD-10 Codes
   - Medications
   - Details
3. Make changes in each tab
4. Return to SOAP tab

**Expected Results:**
- ✅ All tabs accessible
- ✅ Content persists across tabs
- ✅ Changes saved in each tab
- ✅ No data loss on navigation
- ✅ Active tab highlighted
- ✅ Smooth transitions

**Pass Criteria:**
- All tabs functional
- Data persists
- No navigation issues

---

### Test 10: Responsive Design

**Objective:** Verify UI works on different screen sizes

**Steps:**
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x667)

**Expected Results:**
- ✅ Layout adapts to screen size
- ✅ All features accessible
- ✅ Text readable
- ✅ Buttons clickable
- ✅ No horizontal scroll
- ✅ Professional appearance

**Pass Criteria:**
- Responsive on all sizes
- No layout breaks
- Usable on mobile

---

## Regression Testing

### Verify Phase 3 Still Works
1. Voice recording functional
2. Transcription working
3. Audio playback works
4. Edit transcript works

### Verify Phase 2 Still Works
1. Patient list loads
2. Patient CRUD operations work
3. Search functional

### Verify Phase 1 Still Works
1. Authentication works
2. Navigation functional
3. Backend API accessible

---

## Test Data

### Sample Transcripts

**Respiratory Complaint:**
```
Patient is a 28-year-old female presenting with cough and fever for 3 days.
Cough is productive with yellow sputum. Fever to 101.8F. Shortness of breath
with exertion. No chest pain. No recent travel. Vital signs: BP 118/72,
HR 88, RR 18, O2 sat 97% on room air. Lungs: decreased breath sounds right
lower lobe with crackles. Diagnosis: Community-acquired pneumonia.
Plan: Azithromycin 500mg day 1, then 250mg days 2-5. Chest X-ray ordered.
Follow-up in 3 days.
```

**Musculoskeletal Complaint:**
```
Patient is a 35-year-old male with right ankle pain after basketball injury
yesterday. Heard a pop, immediate swelling. Unable to bear weight. No prior
injuries. Exam: Swelling and ecchymosis over lateral malleolus. Tenderness
over ATFL. Positive anterior drawer test. X-ray shows no fracture.
Diagnosis: Grade 2 lateral ankle sprain. Plan: RICE protocol, ibuprofen
600mg TID, ankle brace, crutches. Follow-up in 1 week.
```

---

## Success Criteria

### Phase 4 is successful if:
- ✅ All 10 test cases pass
- ✅ SOAP notes generated accurately
- ✅ ICD-10 search functional
- ✅ Edit/save works correctly
- ✅ Performance meets targets (<10s)
- ✅ No critical bugs
- ✅ Medical accuracy >90%
- ✅ User experience is smooth
- ✅ Error handling is robust
- ✅ Documentation is complete

---

## Bug Reporting Template

```markdown
**Bug Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshots:** [If applicable]

**Environment:**
- Browser: 
- OS: 
- Node version: 
- API key valid: Yes/No

**Console Errors:** [If any]
```

---

## Performance Benchmarks

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Generation time (100 words) | <4s | <6s | >10s |
| Generation time (500 words) | <8s | <10s | >15s |
| ICD-10 search | <3s | <5s | >8s |
| UI responsiveness | <100ms | <300ms | >500ms |
| Medical accuracy | >95% | >90% | <85% |
| ICD-10 relevance | >90% | >85% | <80% |

---

## Sign-off Checklist

- [ ] All test cases executed
- [ ] All critical bugs fixed
- [ ] Performance meets targets
- [ ] Medical accuracy verified
- [ ] Documentation reviewed
- [ ] Code reviewed
- [ ] Security reviewed
- [ ] HIPAA compliance verified
- [ ] Ready for production

---

**Testing Status:** Ready for execution
**Estimated Time:** 2-3 hours for complete testing
**Next Steps:** Execute tests and document results
