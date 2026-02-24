import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { LoginForm } from "@/components/auth/LoginForm";
import { Video } from "lucide-react";

export default function Login() {
  return (
    <PageTransition>
      <Navbar />

      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              Sign in to <span className="text-primary">MeetSpace</span>
            </h1>
          </div>

          <LoginForm />
        </div>
      </main>
    </PageTransition>
  );
}