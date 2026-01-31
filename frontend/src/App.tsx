import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import CreatorProfilePage from "@/pages/CreatorProfilePage";
import ProfileCreationPage from "@/pages/ProfileCreationPage";
import BrandProfileCreationPage from "@/pages/BrandProfileCreationPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import LoginPage from "@/pages/LoginPage";
import SuccessStoriesPage from "@/pages/SuccessStoriesPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={LoginPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/creator/:id" component={CreatorProfilePage} />
      <Route path="/create-profile" component={ProfileCreationPage} />
      <Route path="/create-brand-profile" component={BrandProfileCreationPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/success-stories" component={SuccessStoriesPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfServicePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

