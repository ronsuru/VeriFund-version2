# 🧪 Verifund Migration Test Checklist

This document outlines the testing steps to verify that the application has been successfully migrated from Replit and works correctly in a local environment.

## ✅ Pre-Test Setup

### Environment Verification
- [ ] `.env` file created from `.env.example`
- [ ] Supabase project created and configured
- [ ] Supabase Storage bucket `verifund-assets` created
- [ ] Database connection working (local PostgreSQL or Supabase)
- [ ] All environment variables properly set

### Dependencies Installation
- [ ] `npm install` completed successfully
- [ ] No Replit-specific packages in `node_modules`
- [ ] All required packages installed (`@supabase/supabase-js`, etc.)

## 🔐 Authentication Tests

### User Registration
- [ ] Navigate to `/login` page
- [ ] Click "Sign Up" or similar registration option
- [ ] Fill in registration form with valid email/password
- [ ] Submit registration form
- [ ] **Expected**: User account created, redirected to dashboard or confirmation page
- [ ] **Verify**: User appears in Supabase Auth dashboard
- [ ] **Verify**: User record created in database

### User Login
- [ ] Navigate to `/login` page
- [ ] Enter valid email/password credentials
- [ ] Submit login form
- [ ] **Expected**: Successful login, redirected to dashboard
- [ ] **Verify**: Session established, user authenticated
- [ ] **Verify**: Protected routes accessible

### User Logout
- [ ] While logged in, click logout button
- [ ] **Expected**: User logged out, redirected to login page
- [ ] **Verify**: Session destroyed
- [ ] **Verify**: Protected routes no longer accessible

### Session Persistence
- [ ] Login successfully
- [ ] Refresh browser page
- [ ] **Expected**: User remains logged in
- [ ] **Verify**: Session persists across page refreshes

## 🛡️ Protected Route Tests

### Admin Panel Access
- [ ] Login as regular user
- [ ] Navigate to admin panel route
- [ ] **Expected**: Access denied or redirected (if not admin)
- [ ] Login as admin user (if available)
- [ ] Navigate to admin panel route
- [ ] **Expected**: Admin panel accessible

### User Profile Access
- [ ] Login as any user
- [ ] Navigate to user profile page
- [ ] **Expected**: Profile page accessible
- [ ] **Verify**: User data displayed correctly

### API Endpoint Protection
- [ ] Without authentication, try to access protected API endpoints
- [ ] **Expected**: 401 Unauthorized response
- [ ] With valid authentication, access protected endpoints
- [ ] **Expected**: Successful response

## 📁 File Storage Tests

### File Upload
- [ ] Navigate to file upload functionality
- [ ] Select a test file (image, document, etc.)
- [ ] Upload file
- [ ] **Expected**: File uploads successfully
- [ ] **Verify**: File appears in Supabase Storage bucket
- [ ] **Verify**: File metadata stored in database

### File Access
- [ ] After uploading file, try to access/download it
- [ ] **Expected**: File accessible via generated URL
- [ ] **Verify**: File content matches uploaded file
- [ ] **Verify**: File permissions working correctly

### File Replacement
- [ ] Upload a file with same name as existing file
- [ ] **Expected**: File replaced successfully
- [ ] **Verify**: Old file removed, new file accessible

## 🔧 Development Environment Tests

### Hot Reload
- [ ] Start development server with `npm run dev`
- [ ] Make a change to frontend code (e.g., change text in component)
- [ ] **Expected**: Browser automatically refreshes with changes
- [ ] Make a change to backend code (e.g., add console.log)
- [ ] **Expected**: Server restarts automatically

### Build Process
- [ ] Run `npm run build`
- [ ] **Expected**: Frontend builds successfully to `dist` folder
- [ ] **Expected**: Backend builds successfully
- [ ] **Verify**: No build errors related to Replit dependencies

### Type Checking
- [ ] Run `npm run check`
- [ ] **Expected**: TypeScript compilation successful
- [ ] **Note**: Some existing type errors may persist (not migration-related)

## 🗄️ Database Tests

### Connection
- [ ] Start application
- [ ] **Expected**: Database connection established
- [ ] **Verify**: No connection errors in console

### Schema
- [ ] Check if required tables exist
- [ ] **Expected**: All tables from `shared/schema.ts` exist
- [ ] **Verify**: Table structure matches schema definition

### Data Operations
- [ ] Create a test record
- [ ] **Expected**: Record saved to database
- [ ] Query the record
- [ ] **Expected**: Record retrieved successfully
- [ ] Update the record
- [ ] **Expected**: Record updated successfully
- [ ] Delete the record
- [ ] **Expected**: Record removed from database

## 🌐 API Integration Tests

### Supabase Auth Integration
- [ ] Verify Supabase client configuration
- [ ] **Expected**: No connection errors
- [ ] Test authentication methods
- [ ] **Expected**: Sign in/up/out working correctly

### Supabase Storage Integration
- [ ] Test storage bucket access
- [ ] **Expected**: Can read/write to bucket
- [ ] Test file operations
- [ ] **Expected**: Upload/download working correctly

## 🚀 Production Readiness Tests

### Build for Production
- [ ] Run `npm run build`
- [ ] **Expected**: Production build successful
- [ ] Start production server with `npm run start`
- [ ] **Expected**: Server starts without errors
- [ ] Test application functionality in production mode
- [ ] **Expected**: All features working correctly

### Environment Variables
- [ ] Verify all required environment variables documented
- [ ] **Expected**: `.env.example` contains all necessary variables
- [ ] Test with minimal environment configuration
- [ ] **Expected**: Application fails gracefully with clear error messages

## ❌ Common Issues & Solutions

### Authentication Issues
- **Problem**: "Invalid API key" errors
- **Solution**: Verify `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`

### Storage Issues
- **Problem**: "Bucket not found" errors
- **Solution**: Ensure `verifund-assets` bucket exists in Supabase Storage

### Database Issues
- **Problem**: Connection refused errors
- **Solution**: Verify `DATABASE_URL` and database accessibility

### Build Issues
- **Problem**: TypeScript compilation errors
- **Solution**: Run `npm run check` to identify specific type issues

## 📊 Test Results Summary

| Test Category | Status | Notes |
|---------------|--------|-------|
| Environment Setup | ⬜ | |
| Authentication | ⬜ | |
| Protected Routes | ⬜ | |
| File Storage | ⬜ | |
| Development | ⬜ | |
| Database | ⬜ | |
| API Integration | ⬜ | |
| Production Build | ⬜ | |

## 🎯 Success Criteria

The migration is considered successful when:
- [ ] All authentication flows work correctly
- [ ] File upload/download functionality works
- [ ] Protected routes are properly secured
- [ ] Development environment supports hot reload
- [ ] Application builds successfully for production
- [ ] No Replit-specific code or dependencies remain
- [ ] All core functionality preserved from original application

## 📝 Notes

- **Date**: [Insert test date]
- **Tester**: [Insert tester name]
- **Environment**: [Insert test environment details]
- **Issues Found**: [List any issues encountered]
- **Resolution**: [Document how issues were resolved]
