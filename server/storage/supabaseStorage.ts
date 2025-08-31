import { createClient } from '@supabase/supabase-js';
import { Response } from 'express';

// Create Supabase client for storage operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with Supabase Storage
export class ObjectStorageService {
  private bucketName: string;

  constructor() {
this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'verifund-assets';  }

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "public,evidence";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Please set this environment variable."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "private";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Please set this environment variable."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<any> {
    console.log("🔍 searchPublicObject called with filePath:", filePath);
    const searchPaths = this.getPublicObjectSearchPaths();
    console.log("🔍 Available search paths:", searchPaths);
    
    for (const searchPath of searchPaths) {
      const fullPath = `${searchPath}/${filePath}`;
      console.log("🔍 Trying full path:", fullPath);

      try {
        const { data, error } = await supabase.storage
          .from(this.bucketName)
          .list(searchPath);

        if (error) {
          console.log("❌ Error listing files:", error.message);
          continue;
        }

        // Check if file exists in this path
        const fileExists = data?.some(file => file.name === filePath);
        if (fileExists) {
          console.log("✅ Found file:", filePath);
          return { path: fullPath, exists: true };
        }
      } catch (parseError) {
        console.log("❌ Error checking path:", fullPath, parseError.message);
      }
    }

    console.log("❌ File not found in any search path");
    return null;
  }

  // Get a public URL for an object
  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Create a signed URL for private objects
  async createSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }
    
    return data.signedUrl;
  }

  // Upload a file to storage
  async uploadFile(bucket: string, path: string, buffer: Buffer, contentType: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Download an object and send it as a response
  async downloadObject(filePath: string, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        console.error("Download error:", error);
        res.status(404).json({ error: "File not found" });
        return;
      }

      if (!data) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      // Convert blob to buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set appropriate headers
res.setHeader('Content-Type', (data as any).type || 'application/octet-stream');      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${filePath.split('/').pop()}"`);

      res.send(buffer);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get object entity file (for backward compatibility)
  async getObjectEntityFile(objectPath: string): Promise<any> {
    const path = objectPath.replace('/objects/', '');
    
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(path.split('/')[0]);

      if (error || !data) {
        throw new ObjectNotFoundError();
      }

      const fileName = path.split('/').pop();
      const fileExists = data.some(file => file.name === fileName);
      
      if (!fileExists) {
        throw new ObjectNotFoundError();
      }

      return { path, exists: true };
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      throw new ObjectNotFoundError();
    }
  }

  // Get upload URL for object entity (for backward compatibility)
  async getObjectEntityUploadURL(): Promise<string> {
    // For Supabase, we'll return a placeholder since we handle uploads directly
    return `/api/upload`;
  }

  // Normalize object entity path (for backward compatibility)
  normalizeObjectEntityPath(filePath: string): string {
    return filePath.replace(/^\/+/, '');
  }

  // Generate document short ID (for backward compatibility)
  generateDocumentShortId(filePath: string): string {
    // Extract filename and generate a short ID
    const fileName = filePath.split('/').pop() || '';
    return fileName.substring(0, 8).toUpperCase();
  }
}

// Export a default instance for backward compatibility
export const objectStorageClient = {
  bucket: (bucketName: string) => ({
    file: (path: string) => ({
      exists: async () => {
        try {
const segments = path.split('/');
          const fileName = segments[segments.length - 1];
          const directory = segments.slice(0, -1).join('/');
          const { data, error } = await supabase.storage
            .from(bucketName)
            .list(directory);
          if (error) return [false];
          const exists = !!data?.some((item: any) => item.name === fileName);          return [exists];
        } catch {
          return [false];
        }
      },
      save: async (buffer: Buffer, options: { metadata: { contentType: string } }) => {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(path, buffer, {
              contentType: options.metadata.contentType,
              upsert: true,
            });
          
          if (error) throw error;
        } catch (error) {
          throw new Error(`Failed to save file: ${error.message}`);
        }
      }
    })
  })
};
