import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — PromptIQ" },
      {
        name: "description",
        content: "Sign in to PromptIQ AI Prompt & Query Optimization Framework.",
      },
      { property: "og:title", content: "Sign in — PromptIQ" },
      {
        property: "og:description",
        content: "Sign in to PromptIQ AI Prompt & Query Optimization Framework.",
      },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"signin" | "register" | "forgot" | "reset">("signin");

  // Sign in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPass, setSignInPass] = useState("");
  const [signInError, setSignInError] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regOrg, setRegOrg] = useState("");
  const [regError, setRegError] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Reset password state
  const [resetCode, setResetCode] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError, setResetError] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    if (!/^\S+@\S+\.\S+$/.test(signInEmail)) {
      setSignInError("Please enter a valid work email address.");
      return;
    }
    if (!signInPass || signInPass.length < 6) {
      setSignInError("Password must be at least 6 characters.");
      return;
    }

    const name = signInEmail.split("@")[0] || "User";
    signIn({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: signInEmail,
    });
    toast.success(`Signed in as ${signInEmail}`);
    navigate({ to: "/dashboard" });
  };

  const handleQuickDemoSignIn = () => {
    signIn({
      name: "Dr. Sarah Chen",
      email: "sarah.chen@ai-research.org",
    });
    toast.success("Signed in with Demo Researcher profile");
    navigate({ to: "/dashboard" });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regName.trim()) {
      setRegError("Please enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(regEmail)) {
      setRegError("Please enter a valid email address.");
      return;
    }
    if (regPass.length < 8) {
      setRegError("Password must be at least 8 characters.");
      return;
    }
    if (regPass !== regConfirm) {
      setRegError("Passwords do not match.");
      return;
    }

    signIn({
      name: regName,
      email: regEmail,
    });
    toast.success("Account created successfully!");
    navigate({ to: "/dashboard" });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!/^\S+@\S+\.\S+$/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }
    setForgotSent(true);
    toast.success("Password recovery instructions sent to your email");
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (!resetCode.trim()) {
      setResetError("Please enter the recovery code.");
      return;
    }
    if (resetPass.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (resetPass !== resetConfirm) {
      setResetError("Passwords do not match.");
      return;
    }
    toast.success("Password successfully updated. You may now sign in.");
    setActiveTab("signin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md p-6 shadow-none border rounded-xl space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo />
          <p className="text-xs text-muted-foreground">
            AI-Driven Prompt & Query Optimization Framework
          </p>
        </div>

        {/* Development Preview Alert Notice */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Development Preview Mode
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-amber-300">
            Authentication is currently client-side state for interface validation. Do not use
            production passwords. Configure server-side session management when connecting to a
            production FastAPI backend.
          </p>
        </div>

        {/* Quick Demo Sign In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full text-xs font-semibold border-primary/40 text-primary hover:bg-primary/5"
          onClick={handleQuickDemoSignIn}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Quick Sign In as Demo Researcher
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "signin" | "register" | "forgot" | "reset")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* ============================================================== */}
          {/* TAB: SIGN IN                                                   */}
          {/* ============================================================== */}
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="text-xs">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="researcher@promptiq.ai"
                    className="pl-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password" className="text-xs">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("forgot")}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPass}
                    onChange={(e) => setSignInPass(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 text-xs"
                    required
                  />
                </div>
              </div>

              {signInError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {signInError}
                </p>
              )}

              <Button type="submit" className="w-full text-xs font-medium">
                Sign In to PromptIQ
              </Button>
            </form>
          </TabsContent>

          {/* ============================================================== */}
          {/* TAB: REGISTER                                                  */}
          {/* ============================================================== */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Organization / Lab (Optional)</Label>
                <Input
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder="Stanford NLP / Company Inc."
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Password</Label>
                  <Input
                    type="password"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="••••••••"
                    className="text-xs h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Confirm</Label>
                  <Input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="text-xs h-8"
                    required
                  />
                </div>
              </div>

              {regError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {regError}
                </p>
              )}

              <Button type="submit" className="w-full text-xs font-medium mt-1">
                Create Account
              </Button>
            </form>
          </TabsContent>

          {/* ============================================================== */}
          {/* TAB: FORGOT PASSWORD                                           */}
          {/* ============================================================== */}
          <TabsContent value="forgot">
            {forgotSent ? (
              <div className="space-y-3 text-center py-3">
                <div className="mx-auto rounded-full bg-emerald-500/10 p-2.5 text-emerald-600 w-fit">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold">Check your inbox</h4>
                <p className="text-xs text-muted-foreground">
                  We've sent recovery instructions to <strong>{forgotEmail}</strong>.
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setActiveTab("reset")}
                  >
                    Enter Code
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setActiveTab("signin")}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Enter your registered email address and we'll send you a password reset code.
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="text-xs"
                    required
                  />
                </div>

                {forgotError && <p className="text-xs text-destructive">{forgotError}</p>}

                <Button type="submit" className="w-full text-xs">
                  Send Recovery Link
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("signin")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* ============================================================== */}
          {/* TAB: RESET PASSWORD                                            */}
          {/* ============================================================== */}
          <TabsContent value="reset">
            <form onSubmit={handleReset} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Reset Code</Label>
                <Input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="e.g. 849201"
                  className="text-xs font-mono h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">New Password</Label>
                <Input
                  type="password"
                  value={resetPass}
                  onChange={(e) => setResetPass(e.target.value)}
                  placeholder="••••••••"
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="text-xs h-8"
                  required
                />
              </div>

              {resetError && <p className="text-xs text-destructive">{resetError}</p>}

              <Button type="submit" className="w-full text-xs font-medium">
                Update Password & Sign In
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
