import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="font-heading text-2xl font-bold text-primary">
              Creasearch
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-search">
              Find Creators
            </Link>
            <a href="/#how-it-works" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-how-it-works">
              How It Works
            </a>
            <a href="/#pricing" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-pricing">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {!loading && user && <NotificationBell />}

            {!loading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name || "User"} />
                      <AvatarFallback>
                        {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.user_metadata?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/create-profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden md:inline-flex hover-elevate active-elevate-2" data-testid="button-login">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="hidden md:inline-flex" data-testid="button-signup">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover-elevate active-elevate-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-mobile-search">
                Find Creators
              </Link>
              <a href="/#how-it-works" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-mobile-how-it-works">
                How It Works
              </a>
              <a href="/#pricing" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-mobile-pricing">
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <>
                    <Link href="/create-profile">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="w-full justify-start" data-testid="button-mobile-login">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="w-full" data-testid="button-mobile-signup">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

