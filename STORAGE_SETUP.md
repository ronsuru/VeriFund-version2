# Supabase Storage Setup Guide

## Overview
This guide explains how to set up Supabase Storage to replace the Replit object storage system.

## Prerequisites
- Supabase project created
- Supabase service role key (for server-side operations)
- Supabase anon key (for client-side operations)

## Storage Bucket Setup

### 1. Create Storage Bucket
1. Go to your Supabase dashboard
2. Navigate to Storage section
3. Click "Create a new bucket"
4. Name: `uploads` (or whatever you set in `SUPABASE_STORAGE_BUCKET`)
5. Make it public if you want files to be publicly accessible
6. Click "Create bucket"

### 2. Set Up Storage Policies
For public access to uploaded files, add this policy to your bucket:

```sql
-- Allow public read access to all files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Environment Variables

Make sure these are set in your `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=uploads
PUBLIC_OBJECT_SEARCH_PATHS=public,evidence
PRIVATE_OBJECT_DIR=private
```

## File Structure

The storage system expects this folder structure:

```
uploads/
├── public/          # Publicly accessible files
│   ├── evidence/    # Evidence files
│   └── images/      # General images
├── private/         # Private files (require signed URLs)
│   └── documents/   # User documents
└── temp/            # Temporary uploads
```

## Usage Examples

### Server-side (Upload)
```typescript
import { ObjectStorageService } from './storage/supabaseStorage';

const storageService = new ObjectStorageService();
await storageService.uploadFile('uploads', 'public/images/photo.jpg', buffer, 'image/jpeg');
```

### Server-side (Download)
```typescript
await storageService.downloadObject('public/images/photo.jpg', res);
```

### Client-side (Get URL)
```typescript
import { supabase } from '@/supabaseClient';

const { data } = supabase.storage
  .from('uploads')
  .getPublicUrl('public/images/photo.jpg');

const publicUrl = data.publicUrl;
```

## Migration from Replit

The new storage system maintains backward compatibility with the old Replit object storage:

- File paths remain the same
- Upload/download APIs work identically
- Existing file references will continue to work
- No changes needed in frontend components

## Troubleshooting

### Common Issues

1. **"Bucket not found" error**
   - Ensure the bucket name matches `SUPABASE_STORAGE_BUCKET`
   - Check that the bucket exists in your Supabase project

2. **"Permission denied" error**
   - Verify storage policies are set correctly
   - Check that `SUPABASE_SERVICE_ROLE_KEY` is set for server operations

3. **Files not accessible**
   - Ensure `PUBLIC_OBJECT_SEARCH_PATHS` includes the correct paths
   - Check bucket privacy settings

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG_STORAGE=true
```

This will log all storage operations to help diagnose issues.
