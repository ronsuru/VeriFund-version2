import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, Github } from "lucide-react";
import { auth, supabase } from "@/supabaseClient";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setIsLoading(false);
      setIsSignUp(false);
      setMessage("");
    }
  }, [open]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) setMessage(error.message);
    } catch {
      setMessage("Google sign in failed. Please try again.");
    }
  };

  const handleGithubSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
      if (error) setMessage(error.message);
    } catch {
      setMessage("GitHub sign in failed. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await auth.signUp(email, password);
        if (error) {
          setMessage(error.message);
        } else {
          setMessage("Account created! Please check your email for verification.");
        }
      } else {
        const { error } = await auth.signIn(email, password);
        if (error) {
          setMessage(error.message);
        } else {
          try {
            const { apiRequest } = await import('@/lib/queryClient');
            const resp = await apiRequest('GET', '/api/auth/user');
            if (resp.ok) {
              const serverUser = await resp.json();
              const isAdmin = serverUser?.isAdmin === true || serverUser?.isSupport === true;
              onOpenChange(false);
              window.location.href = isAdmin ? '/admin' : '/';
            } else {
              onOpenChange(false);
              window.location.href = '/';
            }
          } catch {
            onOpenChange(false);
            window.location.href = '/';
          }
        }
      }
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Sign in to VeriFund
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.toLowerCase().includes("error") || message.toLowerCase().includes("invalid")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}>
                  {message}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-600 hover:text-blue-700 text-xs"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button type="button" variant="outline" className="w-full h-10" onClick={handleGoogleSignIn}>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </Button>
                <Button type="button" variant="outline" className="w-full h-10" onClick={handleGithubSignIn}>
                  <Github className="w-4 h-4 mr-2" />
                  Continue with GitHub
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}




