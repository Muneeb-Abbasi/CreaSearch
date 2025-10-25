import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-how-it-works">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-pricing">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex hover-elevate active-elevate-2" data-testid="button-search">
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" className="hidden md:inline-flex hover-elevate active-elevate-2" data-testid="button-login">
              Log In
            </Button>
            <Button className="hidden md:inline-flex" data-testid="button-signup">
              Sign Up
            </Button>
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
              <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-mobile-how-it-works">
                How It Works
              </Link>
              <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-mobile-pricing">
                Pricing
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-mobile-login">
                  Log In
                </Button>
                <Button className="w-full" data-testid="button-mobile-signup">
                  Sign Up
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
