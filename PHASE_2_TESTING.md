# Phase 2 Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

### 2. Start Backend
```bash
cd backend/UrgentCare.API
dotnet run
```
✅ Backend running at: https://localhost:5099

### 3. Start Frontend
```bash
cd frontend
pnpm dev
```
✅ Frontend running at: http://localhost:3000

## Test Scenarios

### ✅ Scenario 1: View Empty Patient List
1. Navigate to http://localhost:3000/patients
2. **Expected:** See "No patients yet. Click 'Add Patient' to get started."

### ✅ Scenario 2: Create First Patient
1. Click "Add Patient" button
2. Fill in form:
   - First Name: `John`
   - Last Name: `Doe`
   - DOB: `1990-01-15`
   - Phone: `555-1234`
3. Click "Create Patient"
4. **Expected:** Dialog closes, patient appears in table with age "34 years"

### ✅ Scenario 3: Test Form Validation
1. Click "Add Patient"
2. Leave all fields empty, click "Create Patient"
3. **Expected:** See red error messages for required fields
4. Enter future date for DOB
5. **Expected:** See "Date of birth cannot be in the future"
6. Enter invalid phone: `abc123`
7. **Expected:** See phone format error

### ✅ Scenario 4: Search Patients
1. Create 3-4 patients with different names
2. Type "John" in search box
3. **Expected:** Table filters in real-time, shows result count badge
4. Clear search
5. **Expected:** All patients reappear

### ✅ Scenario 5: View Patient Details
1. Click Eye icon on any patient
2. **Expected:** Navigate to detail page showing:
   - Full name
   - Formatted DOB
   - Age badge
   - Phone number
   - Patient ID
   - Placeholders for encounters and documents

### ✅ Scenario 6: Edit Patient
1. From list, click Edit icon
2. Change Last Name to `Smith`
3. Click "Update Patient"
4. **Expected:** Dialog closes, table shows updated name

### ✅ Scenario 7: Delete Patient
1. Click Trash icon on any patient
2. **Expected:** See confirmation dialog with patient name
3. Click "Delete"
4. **Expected:** Patient removed from table

### ✅ Scenario 8: Error Handling
1. Stop backend server (Ctrl+C)
2. Refresh patients page
3. **Expected:** See error message with "Retry" button
4. Restart backend
5. Click "Retry"
6. **Expected:** Patients load successfully

## API Endpoints Being Used

| Method | Endpoint | Component |
|--------|----------|-----------|
| GET | `/api/patients` | PatientList (load) |
| GET | `/api/patients/{id}` | PatientDetail |
| GET | `/api/patients/search?q={query}` | PatientList (search - not used yet, client-side search implemented) |
| POST | `/api/patients` | PatientList (create) |
| PUT | `/api/patients/{id}` | PatientList (update) |
| DELETE | `/api/patients/{id}` | PatientList (delete) |

## Expected Behavior Checklist

- [ ] Loading spinner shows while fetching data
- [ ] Empty state message when no patients
- [ ] Search filters table in real-time
- [ ] Form validation prevents invalid submissions
- [ ] Age calculated correctly from DOB
- [ ] Dates formatted as "Month Day, Year"
- [ ] Phone displays as entered or "—" if empty
- [ ] Edit button pre-populates form
- [ ] Delete shows confirmation dialog
- [ ] View button navigates to detail page
- [ ] Back button returns to list
- [ ] Error messages display when backend is down
- [ ] Retry button reloads data

## Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution:** Run `pnpm install` in frontend directory

### Issue: CORS errors in browser console
**Solution:** Ensure backend CORS allows http://localhost:3000

### Issue: 404 on API calls
**Solution:** Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`

### Issue: Database connection error
**Solution:** Ensure PostgreSQL is running and connection string is correct

## Success Criteria

✅ All CRUD operations work  
✅ Search filters correctly  
✅ Validation prevents bad data  
✅ Loading states display  
✅ Error handling works  
✅ Navigation between pages works  
✅ No console errors (except expected lint warnings)  
✅ Responsive on mobile/tablet/desktop  

---

**Ready for Phase 3!** 🚀
