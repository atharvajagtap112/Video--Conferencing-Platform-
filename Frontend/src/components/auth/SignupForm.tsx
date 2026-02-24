import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export function SignupForm() {
  const { signup, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.displayName.trim()
    )
      return;
    await signup(form);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.username.trim().length >= 3 &&
    form.email.includes("@") &&
    form.password.length >= 6 &&
    form.displayName.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="w-full max-w-md mx-auto glass border-white/10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>
            Join MeetSpace and start video conferencing
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                value={form.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                type="text"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) =>
                  updateField("username", e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                autoComplete="username"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                At least 3 characters, no spaces
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isLoading ? "Creating account…" : "Create account"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}