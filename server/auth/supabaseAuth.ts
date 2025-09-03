import { createClient } from '@supabase/supabase-js';import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from '../storage';
import type { IncomingHttpHeaders } from 'http';

// Extend session type to include currentUser and isAdmin
declare module 'express-session' {
  interface SessionData {
    currentUser?: string;
    isAdmin?: boolean;
  }
}

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        claims: {
          sub: string;
          email: string;
        };
        // Backwards compatibility for older routes that read req.user.sub
        sub?: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}// Create Supabase client for server-side operations
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

function getSupabaseAccessTokenFromCookies(headers: IncomingHttpHeaders): string | null {
  const raw = headers.cookie || '';
  if (!raw) return null;
  try {
    const parts = raw.split(';').map(p => p.trim());
    const tokenPart = parts.find(p => p.startsWith('sb-access-token='));
    if (!tokenPart) return null;
    const value = tokenPart.split('=')[1] || '';
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "EUfBLEUx4nnNAFnfxlz3Wwk5y4mxiEhut2yuR07RKwo=",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: any) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Auth routes
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ message: error.message });
      }

      if (data.user) {
        // Check if this is an admin user
        const adminEmails = [
          'trexia.olaya@pdax.ph',
          'mariatrexiaolaya@gmail.com', 
          'trexiaamable@gmail.com',
          'ronaustria08@gmail.com'
        ];
        
        const isAdmin = adminEmails.includes(email);
        
        // Set session
        if (req.session) {
          req.session.currentUser = email;
          req.session.isAdmin = isAdmin;
        }

        // Create or update user in our database
        try {
          let existingUser = await storage.getUserByEmail(email);
          if (!existingUser) {
            // Create new user
            await storage.upsertUser({
              id: data.user.id,
              email: email,
              firstName: email.split('@')[0],
              lastName: "",
              profileImageUrl: null,
            });
          }
        } catch (userError) {
          console.log('Error checking/creating user:', userError);
        }

        res.json({ 
          user: data.user, 
          isAdmin,
          message: "Authentication successful" 
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (data.user) {
        // Create user in our database
        try {
          await storage.upsertUser({
            id: data.user.id,
            email: email,
            firstName: email.split('@')[0],
            lastName: "",
            profileImageUrl: null,
          });
        } catch (userError) {
          console.log('Error creating user:', userError);
        }

        res.json({ 
          user: data.user, 
          message: "User created successfully. Please check your email for verification." 
        });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signout", async (req: Request, res: Response) => {
    try {
      // Clear session
      if (req.session) {
        req.session.destroy(() => {});
      }
      
      res.json({ message: "Signed out successfully" });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      // Prefer Authorization header (OAuth); fall back to Supabase cookie; then session
      const authHeader = req.headers.authorization;
      const cookieToken = getSupabaseAccessTokenFromCookies(req.headers);
      if ((authHeader && authHeader.startsWith('Bearer ')) || cookieToken) {
        const token = authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.substring(7)
          : cookieToken as string;
        
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          
          if (error || !user) {
            return res.status(401).json({ message: "Invalid token" });
          }

          // Get user from our database
          const dbUser = await storage.getUserByEmail(user.email || '');
          if (dbUser) {
            const adminEmails = [
              'trexia.olaya@pdax.ph',
              'mariatrexiaolaya@gmail.com', 
              'trexiaamable@gmail.com',
              'ronaustria08@gmail.com'
            ];
            
            const emailLower = (user.email || '').toLowerCase();
            const isAdmin = adminEmails.map(e => e.toLowerCase()).includes(emailLower);

            // Ensure DB role reflects allowlist
            try {
              if (isAdmin && !dbUser.isAdmin) {
                await storage.updateUserRole(dbUser.id, 'admin');
              }
            } catch (e) {
              console.error('Failed to ensure admin DB role:', e);
            }
            
            return res.json({
              id: dbUser.id,
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
profileImageUrl: dbUser.profileImageUrl,
              kycStatus: dbUser.kycStatus,
              rejectionReason: dbUser.rejectionReason, // Include rejection reason for KYC status display
              isProfileComplete: dbUser.isProfileComplete || false,
              // Include balances so the client can display wallet immediately
              phpBalance: dbUser.phpBalance || '0',
              tipsBalance: dbUser.tipsBalance || '0',
              contributionsBalance: dbUser.contributionsBalance || '0',
              // Include user scores for profile display
              reliabilityScore: dbUser.reliabilityScore || '0.00',
              reliabilityRatingsCount: dbUser.reliabilityRatingsCount || 0,
              socialScore: dbUser.socialScore || 0,              isAdmin: isAdmin,
              isSupport: dbUser.isSupport || false,
            });
          } else {
            // Auto-provision user in our database for OAuth sign-ins
            try {
              await storage.upsertUser({
                id: user.id,
                email: user.email || '',
                firstName: (user.user_metadata as any)?.first_name || (user.email || '').split('@')[0] || '',
                lastName: (user.user_metadata as any)?.last_name || '',
                profileImageUrl: (user.user_metadata as any)?.avatar_url || null,
              });

              const adminEmails = [
                'trexia.olaya@pdax.ph',
                'mariatrexiaolaya@gmail.com', 
                'trexiaamable@gmail.com',
                'ronaustria08@gmail.com'
              ];

              const emailLower = (user.email || '').toLowerCase();
              const isAdmin = adminEmails.map(e => e.toLowerCase()).includes(emailLower);

              // If allowlisted, elevate role in DB
              try {
                if (isAdmin) {
                  await storage.updateUserRole(user.id, 'admin');
                }
              } catch (e) {
                console.error('Failed to set admin DB role for new user:', e);
              }

              return res.json({
                id: user.id,
                email: user.email,
                firstName: (user.user_metadata as any)?.first_name || (user.email || '').split('@')[0] || '',
                lastName: (user.user_metadata as any)?.last_name || '',
profileImageUrl: (user.user_metadata as any)?.avatar_url || null,
                kycStatus: 'pending',
                isProfileComplete: false,
                phpBalance: '0',
                tipsBalance: '0',
                contributionsBalance: '0',
                // Include user scores for profile display
                reliabilityScore: '0.00',
                reliabilityRatingsCount: 0,
                socialScore: 0,                isAdmin,
                isSupport: false,
              });
            } catch (provisionErr) {
              console.error('Auto-provision user failed:', provisionErr);
            }
          }
        } catch (tokenError) {
          console.error('Token validation error:', tokenError);
        }
      }

      // Fallback to session if no token found
      if (req.session?.currentUser) {
        const user = await storage.getUserByEmail(req.session.currentUser);
        if (user) {
          return res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            kycStatus: user.kycStatus,
            rejectionReason: user.rejectionReason, // Include rejection reason for KYC status display
            phpBalance: user.phpBalance || '0',
            tipsBalance: user.tipsBalance || '0',
            contributionsBalance: user.contributionsBalance || '0',
            // Include user scores for profile display
            reliabilityScore: user.reliabilityScore || '0.00',
            reliabilityRatingsCount: user.reliabilityRatingsCount || 0,
            socialScore: user.socialScore || 0,
            isAdmin: req.session.isAdmin || false,
            isSupport: user.isSupport || false,
          });
        }
      }

      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session first
    if (req.session?.currentUser) {
      const user = await storage.getUserByEmail(req.session.currentUser);
      if (user) {
        req.user = {
claims: {
            sub: user.id,
            email: user.email || '',
          },
          sub: user.id,
          email: user.email || '',          isAdmin: req.session.isAdmin || false,
        };
        return next();
      }
    }

    // Check JWT token from Authorization header or Supabase cookie
    const authHeader = req.headers.authorization;
    const cookieToken = getSupabaseAccessTokenFromCookies(req.headers);
    if ((authHeader && authHeader.startsWith('Bearer ')) || cookieToken) {
      const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : cookieToken as string;
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          return res.status(401).json({ message: "Invalid token" });
        }

        // Get user from our database
        const dbUser = await storage.getUserByEmail(user.email || '');
        if (dbUser) {
          const adminEmails = [
            'trexia.olaya@pdax.ph',
            'mariatrexiaolaya@gmail.com', 
            'trexiaamable@gmail.com',
            'ronaustria08@gmail.com'
          ];
          
          const emailLower = (user.email || '').toLowerCase();
          const isAdmin = adminEmails.map(e => e.toLowerCase()).includes(emailLower);

          // Ensure DB record's isAdmin is in sync
          try {
            if (isAdmin && !dbUser.isAdmin) {
              await storage.updateUserRole(dbUser.id, 'admin');
            }
          } catch (e) {
            console.error('Failed to ensure admin DB role:', e);
          }
          
          req.user = {
claims: {
              sub: dbUser.id,
              email: dbUser.email || '',
            },
            sub: dbUser.id,
            email: dbUser.email || '',            isAdmin: isAdmin,
          };
          
          return next();
} else {
          // Auto-provision user if missing in our DB
          try {
            await storage.upsertUser({
              id: user.id,
              email: user.email || '',
              firstName: (user.user_metadata as any)?.first_name || (user.email || '').split('@')[0] || '',
              lastName: (user.user_metadata as any)?.last_name || '',
              profileImageUrl: (user.user_metadata as any)?.avatar_url || null,
            });
          } catch (provisionErr) {
            console.error('Auto-provision user in auth middleware failed:', provisionErr);
          }

          const adminEmails = [
            'trexia.olaya@pdax.ph',
            'mariatrexiaolaya@gmail.com', 
            'trexiaamable@gmail.com',
            'ronaustria08@gmail.com'
          ];

          const emailLower = (user.email || '').toLowerCase();
          const isAdmin = adminEmails.map(e => e.toLowerCase()).includes(emailLower);

          // If allowlisted, elevate role in DB
          try {
            if (isAdmin) {
              await storage.updateUserRole(user.id, 'admin');
            }
          } catch (e) {
            console.error('Failed to set admin DB role for new user (middleware):', e);
          }

          req.user = {
            claims: {
              sub: user.id,
              email: user.email || '',
            },
            sub: user.id,
            email: user.email || '',
            isAdmin,
          };

          return next();        }
      } catch (tokenError) {
        console.error('Token validation error:', tokenError);
      }
    }

    return res.status(401).json({ message: "Please login to continue" });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
