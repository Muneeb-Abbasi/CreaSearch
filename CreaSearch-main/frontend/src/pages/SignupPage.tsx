import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const [, navigate] = useLocation();
    const [isSigningIn, setIsSigningIn] = useState(false);

    // Redirect if already logged in
    if (user && !loading) {
        navigate("/");
        return null;
    }

    const handleGoogleSignup = async () => {
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Signup failed:", error);
            setIsSigningIn(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center bg-muted/30 py-12">
                <Card className="w-full max-w-md mx-4">
                    <CardHeader className="text-center">
                        <CardTitle className="font-heading text-2xl">Join Creasearch</CardTitle>
                        <p className="text-muted-foreground mt-2">
                            Sign up to connect with Pakistan's top creators
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Button
                            variant="outline"
                            className="w-full h-12 text-base gap-3"
                            onClick={handleGoogleSignup}
                            disabled={isSigningIn || loading}
                            data-testid="button-google-signup"
                        >
                            {isSigningIn ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FcGoogle className="w-5 h-5" />
                            )}
                            {isSigningIn ? "Signing up..." : "Sign up with Google"}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                            Already have an account?{' '}
                            <a href="/login" className="text-primary hover:underline">Sign in</a>
                        </p>

                        <p className="text-center text-xs text-muted-foreground">
                            By continuing, you agree to our{' '}
                            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                        </p>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
