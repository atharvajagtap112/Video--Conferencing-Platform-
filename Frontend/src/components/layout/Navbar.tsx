import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  LogOut,
  LayoutDashboard,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { getInitials, generateAvatarColor } from "@/lib/utils";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Don't show navbar inside a meeting room
  if (location.pathname.startsWith("/room/")) return null;

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full glass"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Meet<span className="text-primary">Space</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Separator orientation="vertical" className="h-6 mx-2" />

              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={`${generateAvatarColor(user.displayName)} text-white text-xs`}
                  >
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-medium leading-none">
                    {user.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{user.username}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={logout}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <User className="h-4 w-4 mr-1.5" />
                  Log in
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}