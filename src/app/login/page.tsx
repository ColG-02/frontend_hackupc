"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEMO_ACCOUNTS = [
  {
    label: "Dispatcher Demo",
    email: "dispatcher@smart-waste.local",
    password: "dispatcher123",
    description: "View dashboard, manage alarms and routes",
  },
  {
    label: "Admin Demo",
    email: "admin@smart-waste.local",
    password: "admin-change-this",
    description: "Full access including user management",
  },
  {
    label: "Crew Demo",
    email: "crew@smart-waste.local",
    password: "crew123",
    description: "Mobile crew view with GPS tracking",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      const role = (JSON.parse(localStorage.getItem("mock_user") ?? "{}") as { role?: string }).role;
      if (role === "CREW") router.push("/crew");
      else router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setIsLoading(true);
    try {
      await login(demoEmail, demoPassword);
      const role = (JSON.parse(localStorage.getItem("mock_user") ?? "{}") as { role?: string }).role;
      if (role === "CREW") router.push("/crew");
      else router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">SmartWaste</h1>
          <p className="text-sm text-muted-foreground">Operations Platform</p>
        </div>

        {/* Login form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@smart-waste.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(Boolean(c))}
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember me
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo accounts */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              DEMO ACCOUNTS (Mock Mode)
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <div key={demo.email}>
                  <button
                    onClick={() => handleDemo(demo.email, demo.password)}
                    disabled={isLoading}
                    className="w-full rounded-md border px-3 py-2 text-left hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <p className="text-sm font-medium">{demo.label}</p>
                    <p className="text-xs text-muted-foreground">{demo.description}</p>
                  </button>
                  <Separator className="mt-2 last:hidden" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Running in{" "}
          <span className="font-medium text-yellow-600 dark:text-yellow-400">Mock Mode</span>
          {" "}— no real backend required
        </p>
      </div>
    </div>
  );
}
