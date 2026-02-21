# Feature Updates and Security Fixes Plan

**Date:** January 28, 2026  
**Project:** Creasearch Market  
**Status:** Planning Complete

---

## Executive Summary

This plan addresses feature enhancements and critical security fixes for the Creasearch Market platform. The implementation includes adding Industry, Niche, and Phone fields (all required), separating City and Country (both required) with searchable autocomplete, implementing real-time form validation (e.g., name cannot contain numbers), creating separate Brand and Creator forms, implementing security fixes (rate limiting, logging, input validation), enhancing admin dashboard, and fixing navigation issues.

---

## Requirements Breakdown

### Feature Enhancements
1. **Add Industry and Niche fields** (both required) to profile forms
2. **Add Phone Number field** (required) to profile forms
3. **Separate City and Country fields** (both required) with searchable autocomplete dropdowns
4. **Real-time form validation** - Validate fields as user types (e.g., name cannot contain numbers)
5. **Create separate forms** for "Join as Brand" and "Join as Creator"
6. **Admin dashboard enhancement** - Show full profile data before approval

### Security Fixes
5. **Implement Rate Limiting** - Prevent DDoS and brute force attacks
6. **Fix Sensitive Data in Logs** - Remove user IDs and profile data from console logs
7. **Add Input Validation** - Sanitize inputs to prevent SQL injection and XSS

### Bug Fixes
8. **Fix Login/Signup Navigation** - Signup button should redirect to signup page (same as login but different route)

---

## Phase 1: Database Schema Updates

### 1.1 Update Profiles Table

**File:** `supabase/schema.sql`

**Changes:**
- Add `industry` column (TEXT, NOT NULL) - Required field
- Add `niche` column (TEXT, NOT NULL) - Required field
- Add `city` column (TEXT, NOT NULL) - Required field
- Add `country` column (TEXT, NOT NULL) - Required field
- Add `phone` column (TEXT, NOT NULL) - Required field
- Keep `location` column for backward compatibility during migration
- Add indexes for new fields

**SQL Migration:**
```sql
-- Add new columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS niche TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_niche ON profiles(niche);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_city_country ON profiles(city, country);
CREATE INDEX IF NOT EXISTS idx_profiles_industry_niche ON profiles(industry, niche);

-- Migrate existing location data
-- Split "City, Country" format into separate fields
UPDATE profiles 
SET 
  city = TRIM(SPLIT_PART(location, ',', 1)),
  country = TRIM(SPLIT_PART(location, ',', 2))
WHERE location IS NOT NULL AND location LIKE '%,%';

-- For locations without comma, assume it's a city in Pakistan
UPDATE profiles 
SET 
  city = TRIM(location),
  country = 'Pakistan'
WHERE location IS NOT NULL AND location NOT LIKE '%,%' AND city IS NULL;
```

### 1.2 Update TypeScript Interfaces

**Files to Update:**
- `shared/schema.ts`
- `backend/src/services/database.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/supabase.ts`

**Updated Profile Interface:**
```typescript
export interface Profile {
    id: string;
    user_id: string;
    role: 'creator' | 'organization' | 'admin';
    name: string;
    title: string | null;
    industry: string; // NEW - Required
    niche: string; // NEW - Required
    city: string; // NEW - Required
    country: string; // NEW - Required
    phone: string; // NEW - Required
    location: string | null; // Keep for backward compatibility
    bio: string | null;
    avatar_url: string | null;
    video_intro_url: string | null;
    collaboration_types: string[];
    social_links: Record<string, string>;
    follower_total: number;
    verified_socials: string[];
    profile_completion: number;
    gigs_completed: number;
    rating_score: number;
    creasearch_score: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}
```

---

## Phase 2: Country and City Data

### 2.1 Create Country/City Data File

**File:** `frontend/src/data/countries-cities.ts` (NEW)

**Implementation Options:**
1. Use npm package: `react-select-country-list` or `country-list`
2. Create custom data file with curated list
3. Use REST Countries API (external dependency)

**Recommended:** Custom data file focusing on Pakistan and major countries

**Structure:**
```typescript
export interface Country {
  code: string;
  name: string;
}

export interface City {
  name: string;
  countryCode: string;
}

// Comprehensive country list
export const countries: Country[] = [
  { code: 'PK', name: 'Pakistan' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  // Add more countries as needed
];

// Cities organized by country code
export const citiesByCountry: Record<string, string[]> = {
  'PK': [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Sargodha', 'Bahawalpur', 'Sukkur', 'Larkana'
  ],
  'US': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
  ],
  'GB': [
    'London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool',
    'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'
  ],
  // Add more cities as needed
};

// Search functions
export function searchCountries(query: string): Country[] {
  if (!query.trim()) return countries;
  
  const lowerQuery = query.toLowerCase();
  return countries.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.code.toLowerCase().includes(lowerQuery)
  ).slice(0, 20); // Limit results
}

export function searchCities(query: string, countryCode?: string): string[] {
  if (!query.trim()) {
    return countryCode ? (citiesByCountry[countryCode] || []).slice(0, 20) : [];
  }
  
  const lowerQuery = query.toLowerCase();
  
  if (countryCode) {
    return (citiesByCountry[countryCode] || [])
      .filter(c => c.toLowerCase().includes(lowerQuery))
      .slice(0, 20);
  }
  
  // Search across all cities
  return Object.values(citiesByCountry)
    .flat()
    .filter(c => c.toLowerCase().includes(lowerQuery))
    .slice(0, 20);
}

export function getCitiesByCountry(countryCode: string): string[] {
  return citiesByCountry[countryCode] || [];
}
```

---

## Phase 3: Create Autocomplete Components

### 3.1 Country Select Component

**File:** `frontend/src/components/ui/country-select.tsx` (NEW)

**Features:**
- Searchable dropdown
- Debounced search (300ms)
- Keyboard navigation
- Loading state
- Empty state message
- Clear button

**Implementation using shadcn/ui Command component:**
```typescript
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { countries, searchCountries, type Country } from "@/data/countries-cities";

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CountrySelect({ value, onValueChange, placeholder = "Select country..." }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCountry = countries.find(c => c.code === value);
  const filteredCountries = searchQuery ? searchCountries(searchQuery) : countries.slice(0, 20);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCountry ? selectedCountry.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search country..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code}
                  onSelect={() => {
                    onValueChange(country.code === value ? "" : country.code);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### 3.2 City Select Component

**File:** `frontend/src/components/ui/city-select.tsx` (NEW)

Similar to CountrySelect but filters cities based on selected country.

**Key differences:**
- Requires `countryCode` prop
- Disabled when no country selected
- Shows "Select a country first" when disabled
- Filters cities by selected country

---

## Phase 4: Real-Time Form Validation

### 4.1 Create Validation Utilities

**File:** `frontend/src/utils/validation.ts` (NEW)

**Create validation functions for real-time validation:**
```typescript
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Name validation - no numbers allowed
export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { isValid: false, error: "Name is required" };
  }
  if (name.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }
  if (name.length > 100) {
    return { isValid: false, error: "Name must be less than 100 characters" };
  }
  // Check for numbers
  if (/\d/.test(name)) {
    return { isValid: false, error: "Name cannot contain numbers" };
  }
  // Check for special characters (allow spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  return { isValid: true };
}

// Industry validation
export function validateIndustry(industry: string): ValidationResult {
  if (!industry.trim()) {
    return { isValid: false, error: "Industry is required" };
  }
  if (industry.length < 2) {
    return { isValid: false, error: "Industry must be at least 2 characters" };
  }
  if (industry.length > 100) {
    return { isValid: false, error: "Industry must be less than 100 characters" };
  }
  return { isValid: true };
}

// Niche validation
export function validateNiche(niche: string): ValidationResult {
  if (!niche.trim()) {
    return { isValid: false, error: "Niche is required" };
  }
  if (niche.length < 2) {
    return { isValid: false, error: "Niche must be at least 2 characters" };
  }
  if (niche.length > 100) {
    return { isValid: false, error: "Niche must be less than 100 characters" };
  }
  return { isValid: true };
}

// Phone number validation (international format)
export function validatePhone(phone: string): ValidationResult {
  if (!phone.trim()) {
    return { isValid: false, error: "Phone number is required" };
  }
  // Remove spaces, dashes, parentheses for validation
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Allow + prefix for international numbers
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: "Please enter a valid phone number" };
  }
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { isValid: false, error: "Phone number must be between 10-15 digits" };
  }
  return { isValid: true };
}

// Country validation
export function validateCountry(country: string): ValidationResult {
  if (!country) {
    return { isValid: false, error: "Country is required" };
  }
  return { isValid: true };
}

// City validation
export function validateCity(city: string, country?: string): ValidationResult {
  if (!city) {
    return { isValid: false, error: "City is required" };
  }
  if (!country) {
    return { isValid: false, error: "Please select a country first" };
  }
  return { isValid: true };
}

// URL validation
export function validateUrl(url: string, fieldName: string = "URL"): ValidationResult {
  if (!url.trim()) {
    return { isValid: true }; // URLs are optional
  }
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: `Please enter a valid ${fieldName}` };
  }
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: true }; // Optional
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  return { isValid: true };
}
```

---

## Phase 5: Update Profile Forms

### 5.1 Update Creator Profile Form

**File:** `frontend/src/pages/ProfileCreationPage.tsx`

**Changes Required:**

1. **Update form state with phone number and validation errors:**
```typescript
import { validateName, validateIndustry, validateNiche, validatePhone, validateCountry, validateCity } from "@/utils/validation";

const [formData, setFormData] = useState({
  name: "",
  title: "",
  industry: "", // Required
  niche: "", // Required
  city: "", // Required
  country: "", // Required
  phone: "", // NEW - Required
  bio: "",
  followerCount: "",
  collaborationTypes: [] as string[],
  videoIntroUrl: "",
  youtube: "",
  instagram: "",
  linkedin: "",
  twitter: "",
  agreedToTerms: false,
});

// Validation errors state
const [errors, setErrors] = useState<Record<string, string>>({});
```

2. **Add real-time validation handler:**
```typescript
const handleFieldChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Real-time validation
  let validation: ValidationResult;
  switch (field) {
    case 'name':
      validation = validateName(value);
      break;
    case 'industry':
      validation = validateIndustry(value);
      break;
    case 'niche':
      validation = validateNiche(value);
      break;
    case 'phone':
      validation = validatePhone(value);
      break;
    case 'country':
      validation = validateCountry(value);
      if (validation.isValid) {
        // Clear city error if country is now valid
        setErrors(prev => ({ ...prev, country: undefined }));
      }
      break;
    case 'city':
      validation = validateCity(value, formData.country);
      break;
    default:
      validation = { isValid: true };
  }
  
  // Update errors
  setErrors(prev => ({
    ...prev,
    [field]: validation.isValid ? undefined : validation.error
  }));
};
```

3. **Update Name field with real-time validation:**
```tsx
<div className="space-y-2">
  <Label htmlFor="full-name">Full Name *</Label>
  <Input
    id="full-name"
    placeholder="Your full name"
    value={formData.name}
    onChange={(e) => handleFieldChange('name', e.target.value)}
    onBlur={() => {
      // Re-validate on blur
      const validation = validateName(formData.name);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, name: validation.error }));
      }
    }}
    required
    className={errors.name ? "border-red-500" : ""}
    data-testid="input-name"
  />
  {errors.name && (
    <p className="text-xs text-red-500">{errors.name}</p>
  )}
  <p className="text-xs text-muted-foreground">
    Letters only, no numbers allowed
  </p>
</div>
```

4. **Add Industry and Niche fields with real-time validation:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-2">
    <Label htmlFor="industry">Industry *</Label>
    <Input
      id="industry"
      placeholder="e.g., Technology, Fashion, Food, Education"
      value={formData.industry}
      onChange={(e) => handleFieldChange('industry', e.target.value)}
      onBlur={() => {
        const validation = validateIndustry(formData.industry);
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, industry: validation.error }));
        }
      }}
      required
      className={errors.industry ? "border-red-500" : ""}
      data-testid="input-industry"
    />
    {errors.industry && (
      <p className="text-xs text-red-500">{errors.industry}</p>
    )}
    <p className="text-xs text-muted-foreground">
      Your primary industry
    </p>
  </div>
  <div className="space-y-2">
    <Label htmlFor="niche">Niche *</Label>
    <Input
      id="niche"
      placeholder="e.g., SaaS, Streetwear, Fine Dining, EdTech"
      value={formData.niche}
      onChange={(e) => handleFieldChange('niche', e.target.value)}
      onBlur={() => {
        const validation = validateNiche(formData.niche);
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, niche: validation.error }));
        }
      }}
      required
      className={errors.niche ? "border-red-500" : ""}
      data-testid="input-niche"
    />
    {errors.niche && (
      <p className="text-xs text-red-500">{errors.niche}</p>
    )}
    <p className="text-xs text-muted-foreground">
      Your specific niche or specialization
    </p>
  </div>
</div>
```

5. **Add Phone Number field with real-time validation:**
```tsx
<div className="space-y-2">
  <Label htmlFor="phone">Phone Number *</Label>
  <Input
    id="phone"
    type="tel"
    placeholder="+92 300 1234567 or 0300-1234567"
    value={formData.phone}
    onChange={(e) => handleFieldChange('phone', e.target.value)}
    onBlur={() => {
      const validation = validatePhone(formData.phone);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, phone: validation.error }));
      }
    }}
    required
    className={errors.phone ? "border-red-500" : ""}
    data-testid="input-phone"
  />
  {errors.phone && (
    <p className="text-xs text-red-500">{errors.phone}</p>
  )}
  <p className="text-xs text-muted-foreground">
    Include country code (e.g., +92 for Pakistan)
  </p>
</div>
```

6. **Replace location input with City/Country selects with validation:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-2">
    <Label htmlFor="country">Country *</Label>
    <CountrySelect
      value={formData.country}
      onValueChange={(value) => {
        handleFieldChange('country', value);
        // Clear city when country changes
        setFormData(prev => ({ ...prev, city: "" }));
        setErrors(prev => ({ ...prev, city: undefined }));
      }}
      placeholder="Select country..."
    />
    {errors.country && (
      <p className="text-xs text-red-500">{errors.country}</p>
    )}
  </div>
  <div className="space-y-2">
    <Label htmlFor="city">City *</Label>
    <CitySelect
      value={formData.city}
      countryCode={formData.country}
      onValueChange={(value) => handleFieldChange('city', value)}
      placeholder={formData.country ? "Select city..." : "Select country first"}
      disabled={!formData.country}
    />
    {errors.city && (
      <p className="text-xs text-red-500">{errors.city}</p>
    )}
  </div>
</div>
```

7. **Update form submission with comprehensive validation:**
```typescript
const handleSubmit = async () => {
  // Validate all required fields
  const nameValidation = validateName(formData.name);
  const industryValidation = validateIndustry(formData.industry);
  const nicheValidation = validateNiche(formData.niche);
  const phoneValidation = validatePhone(formData.phone);
  const countryValidation = validateCountry(formData.country);
  const cityValidation = validateCity(formData.city, formData.country);
  
  // Collect all errors
  const allErrors: Record<string, string> = {};
  if (!nameValidation.isValid) allErrors.name = nameValidation.error!;
  if (!industryValidation.isValid) allErrors.industry = industryValidation.error!;
  if (!nicheValidation.isValid) allErrors.niche = nicheValidation.error!;
  if (!phoneValidation.isValid) allErrors.phone = phoneValidation.error!;
  if (!countryValidation.isValid) allErrors.country = countryValidation.error!;
  if (!cityValidation.isValid) allErrors.city = cityValidation.error!;
  
  // Set errors and prevent submission if validation fails
  if (Object.keys(allErrors).length > 0) {
    setErrors(allErrors);
    toast({
      title: "Validation failed",
      description: "Please fix the errors in the form",
      variant: "destructive"
    });
    // Scroll to first error
    const firstErrorField = Object.keys(allErrors)[0];
    document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  
  // Check terms agreement
  if (!formData.agreedToTerms) {
    toast({
      title: "Please agree to terms",
      description: "You must agree to the Terms of Service and Privacy Policy",
      variant: "destructive"
    });
    return;
  }

  setIsSubmitting(true);
  try {
    await profileApi.create({
      user_id: user?.id,
      name: formData.name.trim(),
      title: formData.title.trim(),
      industry: formData.industry.trim(), // Required
      niche: formData.niche.trim(), // Required
      city: formData.city, // Required
      country: formData.country, // Required
      phone: formData.phone.trim(), // NEW - Required
      bio: formData.bio.trim(),
      // ... rest of fields
    });
    
    toast({
      title: "Profile submitted!",
      description: "Your profile is pending review. We'll notify you once approved.",
    });
    navigate("/");
  } catch (error) {
    console.error("Error creating profile:", error);
    toast({
      title: "Error",
      description: "Failed to create profile. Please try again.",
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

5. **Update completion calculation:**
```typescript
const calculateCompletion = () => {
  let score = 0;
  if (formData.name) score += 12;
  if (formData.title) score += 12;
  if (formData.industry) score += 8; // NEW - Required
  if (formData.niche) score += 8; // NEW - Required
  if (formData.city && formData.country) score += 10; // UPDATED
  if (formData.bio) score += 20;
  if (formData.collaborationTypes.length > 0) score += 15;
  if (formData.youtube || formData.instagram || formData.linkedin || formData.twitter) score += 15;
  return score;
};
```

### 5.2 Create Brand Profile Form

**File:** `frontend/src/pages/BrandProfileCreationPage.tsx` (NEW)

**Different fields for Brand/Organization:**
- Company/Organization name (instead of personal name) - Required, no numbers
- Industry (required, same as creator)
- Niche (required, same as creator)
- Company size (dropdown: Startup, Small, Medium, Large, Enterprise)
- City and Country (same autocomplete components, both required)
- Company description/bio
- Website URL
- Social media links (LinkedIn, Twitter, Facebook, Instagram)
- Contact email
- Contact phone (required, same validation as creator)
- Company logo upload

**Note:** Brand form should use the same validation utilities and real-time validation as creator form.

**Form Structure:**
- Step 1: Company Information (name, industry, niche, size, location)
- Step 2: Media Upload (logo)
- Step 3: Online Presence (website, social links)
- Step 4: Review & Submit

**Role:** Set `role: 'organization'` when creating profile

### 5.3 Update Routing

**File:** `frontend/src/main.tsx` or routing configuration

**Add routes:**
```typescript
import BrandProfileCreationPage from "@/pages/BrandProfileCreationPage";

// In route configuration
<Route path="/create-profile/creator" component={ProfileCreationPage} />
<Route path="/create-profile/brand" component={BrandProfileCreationPage} />
<Route path="/create-profile" component={() => {
  // Show selection page or redirect based on user preference
  navigate("/create-profile/creator");
}} />
```

---

## Phase 6: Update Navigation and Buttons

### 5.1 Add "Join as Brand" Button

**File:** `frontend/src/components/HeroSection.tsx`

**Update buttons section:**
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <Link href="/search">
    <Button size="lg" variant="default" className="text-base bg-primary/90 backdrop-blur-sm border border-primary-border hover:bg-primary" data-testid="button-find-creators">
      Find Creators
      <ArrowRight className="ml-2 w-5 h-5" />
    </Button>
  </Link>
  <Link href="/create-profile/creator">
    <Button size="lg" variant="outline" className="text-base bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" data-testid="button-join-creator">
      Join as Creator
    </Button>
  </Link>
  <Link href="/create-profile/brand">
    <Button size="lg" variant="outline" className="text-base bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" data-testid="button-join-brand">
      Join as Brand
    </Button>
  </Link>
</div>
```

### 5.2 Fix Login/Signup Navigation

**File:** `frontend/src/components/Header.tsx`

**Current Issue:** Both buttons redirect to `/login`

**Fix:**
- Keep "Log In" button: `/login`
- Change "Sign Up" button: `/signup`

**File:** `frontend/src/pages/SignupPage.tsx` (NEW)

Create a new page identical to LoginPage but with different text:
```typescript
// Copy LoginPage.tsx and modify:
<CardTitle className="font-heading text-2xl">Join Creasearch</CardTitle>
<p className="text-muted-foreground mt-2">
  Sign up to connect with Pakistan's top creators
</p>
// Button text: "Sign up with Google" instead of "Continue with Google"
```

**Update Header.tsx:**
```tsx
<Link href="/signup">
  <Button className="hidden md:inline-flex" data-testid="button-signup">
    Sign Up
  </Button>
</Link>
```

---

## Phase 7: Backend API Updates

### 6.1 Update Profile Service

**File:** `backend/src/services/database.ts`

**Update ProfileFilters interface:**
```typescript
export interface ProfileFilters {
    search?: string;
    city?: string;
    country?: string; // NEW
    industry?: string; // NEW
    niche?: string; // NEW
    minFollowers?: number;
    maxFollowers?: number;
    collaborationType?: string;
    status?: 'pending' | 'approved' | 'rejected';
}
```

**Update getAll method:**
```typescript
async getAll(filters: ProfileFilters = {}): Promise<Profile[]> {
    const supabase = getSupabaseClient();
    let query = supabase
        .from('profiles')
        .select('*')
        .eq('status', filters.status || 'approved');

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,title.ilike.%${filters.search}%,industry.ilike.%${filters.search}%,niche.ilike.%${filters.search}%`);
    }

    if (filters.country) {
        query = query.eq('country', filters.country);
    }

    if (filters.city) {
        query = query.eq('city', filters.city);
    }

    if (filters.industry) {
        query = query.eq('industry', filters.industry);
    }

    if (filters.niche) {
        query = query.eq('niche', filters.niche);
    }

    // ... rest of filters

    const { data, error } = await query.order('creasearch_score', { ascending: false });
    if (error) throw error;
    return data || [];
}
```

### 6.2 Update Routes

**File:** `backend/src/routes.ts`

Ensure POST `/api/profiles` accepts new fields. The route already uses `req.body` which will include new fields if sent from frontend.

---

## Phase 8: Admin Dashboard Enhancement

### 7.1 Create Profile Detail Modal

**File:** `frontend/src/components/ProfileDetailModal.tsx` (NEW)

**Component to display full profile information:**

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Profile } from "@/lib/api";

interface ProfileDetailModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function ProfileDetailModal({
  profile,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: ProfileDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Details - {profile.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{profile.name}</h3>
              <p className="text-muted-foreground">{profile.title || "Creator"}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{profile.role}</Badge>
                <Badge variant="outline">{profile.status}</Badge>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Industry</p>
              <p className="text-base">{profile.industry || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Niche</p>
              <p className="text-base">{profile.niche || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-base">{profile.phone || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-base">
                {[profile.city, profile.country].filter(Boolean).join(", ") || profile.location || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Followers</p>
              <p className="text-base">{(profile.follower_total || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Creasearch Score</p>
              <p className="text-base">{profile.creasearch_score || 0}</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">About</p>
            <p className="text-base whitespace-pre-wrap">{profile.bio || "No bio provided"}</p>
          </div>

          {/* Collaboration Types */}
          {profile.collaboration_types && profile.collaboration_types.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Collaboration Types</p>
              <div className="flex flex-wrap gap-2">
                {profile.collaboration_types.map((type, idx) => (
                  <Badge key={idx} variant="secondary">{type}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {profile.social_links && Object.keys(profile.social_links).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Social Media Links</p>
              <div className="space-y-1">
                {Object.entries(profile.social_links).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}: {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Video Intro */}
          {profile.video_intro_url && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Video Introduction</p>
              <a href={profile.video_intro_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View Video
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Created: {new Date(profile.created_at).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Updated: {new Date(profile.updated_at).toLocaleString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="default"
              onClick={() => onApprove(profile.id)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => onReject(profile.id)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 7.2 Update Admin Dashboard

**File:** `frontend/src/pages/AdminDashboardPage.tsx`

**Add "View Details" button and modal:**

```typescript
import { ProfileDetailModal } from "@/components/ProfileDetailModal";

// Add state
const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// Update pending profiles list
{pendingProfiles.map((profile) => (
  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-md">
    {/* ... existing content ... */}
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedProfile(profile);
          setIsModalOpen(true);
        }}
      >
        View Details
      </Button>
      {/* ... approve/reject buttons ... */}
    </div>
  </div>
))}

// Add modal at bottom
<ProfileDetailModal
  profile={selectedProfile!}
  isOpen={isModalOpen && selectedProfile !== null}
  onClose={() => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  }}
  onApprove={handleApprove}
  onReject={handleReject}
  isLoading={actionLoading === selectedProfile?.id}
/>
```

---

## Phase 9: Security Fixes

### 8.1 Implement Rate Limiting

**File:** `backend/src/index.ts`

**Install dependency:**
```bash
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit
```

**Implementation:**
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Stricter limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Stricter limit for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Too many uploads, please try again later.',
  },
});

// Apply middleware
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/upload/', uploadLimiter);
```

### 8.2 Fix Sensitive Data in Logs

**File:** `backend/src/utils/logger.ts` (NEW)

**Create logger utility:**
```typescript
const sensitiveFields = [
  'user_id',
  'email',
  'password',
  'token',
  'api_key',
  'access_token',
  'refresh_token',
  'authorization',
  'secret',
];

function sanitize(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}

export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data ? sanitize(data) : '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? sanitize(error) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? sanitize(data) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data ? sanitize(data) : '');
    }
  },
};
```

**Update all files to use logger:**

**Files to update:**
- `backend/src/routes.ts` - Replace all `console.log`, `console.error`
- `backend/src/services/database.ts` - Replace console.log
- `backend/src/services/email.ts` - Replace console.log, console.error
- `backend/src/middleware/auth.ts` - Replace console.error
- `backend/src/index.ts` - Replace console.log, console.error

**Example replacement:**
```typescript
// Before
console.log("[POST] /api/profiles - Payload:", JSON.stringify(req.body));
console.error("Error creating profile:", error);

// After
import { logger } from './utils/logger';
logger.info("Creating profile", { body: req.body });
logger.error("Error creating profile", error);
```

### 8.3 Add Input Validation

**File:** `backend/src/middleware/validation.ts` (NEW)

**Install dependency:**
```bash
npm install zod
# zod is already installed, verify version
```

**Create validation middleware:**
```typescript
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Profile creation schema
export const profileCreateSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .trim()
    .refine((val) => !/\d/.test(val), "Name cannot contain numbers")
    .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), "Name can only contain letters, spaces, hyphens, and apostrophes"),
  title: z.string().max(200, "Title too long").trim().nullable().optional(),
  industry: z.string().min(1, "Industry is required").max(100, "Industry too long").trim(),
  niche: z.string().min(1, "Niche is required").max(100, "Niche too long").trim(),
  city: z.string().min(1, "City is required").max(100, "City name too long").trim(),
  country: z.string().length(2, "Country code is required"),
  phone: z.string().min(10, "Phone number is required").max(20, "Phone number too long").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  location: z.string().max(200).trim().nullable().optional(), // Keep for backward compatibility
  bio: z.string().max(2000, "Bio too long").trim().nullable().optional(),
  follower_total: z.number().int().min(0).max(100000000).optional(),
  collaboration_types: z.array(z.string().max(50)).max(10).optional(),
  social_links: z.record(z.string().url("Invalid URL")).optional(),
  avatar_url: z.string().url("Invalid URL").nullable().optional(),
  video_intro_url: z.string().url("Invalid URL").nullable().optional(),
  role: z.enum(['creator', 'organization', 'admin']).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
}).strict(); // Reject unknown fields

// Profile update schema (all fields optional)
export const profileUpdateSchema = profileCreateSchema.partial();

// Validation middleware factory
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Query parameter validation
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// URL parameter validation
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid URL parameters',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}
```

**Apply to routes:**

**File:** `backend/src/routes.ts`

```typescript
import { validate, validateQuery, validateParams } from './middleware/validation';
import { profileCreateSchema, profileUpdateSchema } from './middleware/validation';
import { z } from 'zod';

// Profile ID validation
const profileIdSchema = z.object({
  id: z.string().uuid("Invalid profile ID"),
});

// Query filters validation
const profileFiltersSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  country: z.string().length(2).optional(),
  industry: z.string().optional(),
  minFollowers: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxFollowers: z.string().regex(/^\d+$/).transform(Number).optional(),
  collaborationType: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Apply validation
app.post("/api/profiles", requireAuth, validate(profileCreateSchema), async (req, res) => {
  // req.body is now validated and sanitized
});

app.put("/api/profiles/:id", requireAuth, validateParams(profileIdSchema), validate(profileUpdateSchema), async (req, res) => {
  // Both params and body validated
});

app.get("/api/profiles", validateQuery(profileFiltersSchema), async (req, res) => {
  // Query params validated
});
```

**Additional XSS Protection:**

For text fields that might contain HTML, add sanitization:
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
}

// In validation schema
bio: z.string().max(2000).transform(sanitizeHtml).nullable().optional(),
```

---

## Phase 10: Update Search and Filtering

### 9.1 Update SearchPage

**File:** `frontend/src/pages/SearchPage.tsx`

**Add new filters:**
- Industry dropdown
- Niche dropdown (filtered by industry, optional)
- Country dropdown (updates city options)
- City dropdown (filtered by country)

**Update API call:**
```typescript
const filters: ProfileFilters = {
  search: searchQuery || undefined,
  city: selectedCities.length > 0 ? selectedCities[0] : undefined,
  country: selectedCountry || undefined,
  industry: selectedIndustry || undefined,
  niche: selectedNiche || undefined,
  minFollowers: followerRange[0] > 0 ? followerRange[0] * 1000 : undefined,
  collaborationType: selectedTypes.length > 0 ? selectedTypes[0] : undefined,
  page: currentPage,
  limit: creatorsPerPage,
};

const result = await profileApi.getAll(filters);
```

---

## Implementation Checklist

### Database & Schema
- [ ] Update `supabase/schema.sql` with:
  - Industry column (NOT NULL)
  - Niche column (NOT NULL)
  - City column (NOT NULL)
  - Country column (NOT NULL)
  - Phone column (NOT NULL)
- [ ] Run migration SQL in Supabase
- [ ] Update TypeScript interfaces in all files (all new fields as required)
- [ ] Test migration with existing data

### Frontend Components
- [ ] Create `validation.ts` utility file with real-time validation functions
- [ ] Create `countries-cities.ts` data file
- [ ] Create `CountrySelect` component
- [ ] Create `CitySelect` component
- [ ] Update `ProfileCreationPage.tsx` with:
  - Industry and niche fields (both required)
  - Phone number field (required)
  - Real-time validation for all fields
  - Name field validation (no numbers)
  - Error display for each field
- [ ] Create `BrandProfileCreationPage.tsx` with same validation
- [ ] Create `SignupPage.tsx`
- [ ] Create `ProfileDetailModal.tsx`
- [ ] Update `HeroSection.tsx` with brand button
- [ ] Update `Header.tsx` navigation
- [ ] Update `SearchPage.tsx` with new filters
- [ ] Update `AdminDashboardPage.tsx` with modal

### Backend
- [ ] Install `express-rate-limit`
- [ ] Create `logger.ts` utility
- [ ] Create `validation.ts` middleware
- [ ] Update `database.ts` with new filters
- [ ] Update `routes.ts` with validation
- [ ] Replace all console.log with logger
- [ ] Add rate limiting middleware
- [ ] Test all endpoints

### Testing
- [ ] Test real-time validation:
  - [ ] Name field rejects numbers
  - [ ] Name field shows error immediately when numbers are typed
  - [ ] Required fields show errors when empty
  - [ ] Phone number validates format in real-time
  - [ ] City field requires country selection first
- [ ] Test creator form with all required fields:
  - [ ] Name (required, no numbers)
  - [ ] Industry (required)
  - [ ] Niche (required)
  - [ ] Country (required)
  - [ ] City (required)
  - [ ] Phone (required)
- [ ] Test form submission:
  - [ ] Form prevents submission with validation errors
  - [ ] Form scrolls to first error field
  - [ ] All required fields must be valid before submission
- [ ] Test brand form creation with same validation
- [ ] Test country/city autocomplete
- [ ] Test search filtering with industry and niche filters
- [ ] Test admin profile detail modal shows all fields including phone
- [ ] Test rate limiting
- [ ] Test input validation
- [ ] Test login/signup navigation
- [ ] Test backward compatibility

---

## Dependencies

### Backend (`backend/package.json`)
```json
{
  "dependencies": {
    "express-rate-limit": "^7.1.5",
    "zod": "^3.24.2",
    "isomorphic-dompurify": "^2.9.0"
  },
  "devDependencies": {
    "@types/express-rate-limit": "^6.0.0"
  }
}
```

### Frontend (`frontend/package.json`)
```json
{
  "dependencies": {
    // No new dependencies needed - using existing shadcn/ui components
  }
}
```

---

## Migration Notes

1. **Backward Compatibility:** Keep `location` field during transition period
2. **Data Migration:** Run SQL to split existing location data
3. **Gradual Rollout:** Deploy backend first, then frontend
4. **Testing:** Test with existing profiles before full deployment

---

## Timeline Estimate

- **Phase 1-2:** Database & Data (2-3 hours)
- **Phase 3:** Components (4-5 hours)
- **Phase 4:** Forms (6-8 hours)
- **Phase 5:** Navigation (1-2 hours)
- **Phase 6:** Backend API (2-3 hours)
- **Phase 7:** Admin Dashboard (3-4 hours)
- **Phase 8:** Security Fixes (4-5 hours)
- **Phase 9:** Search Updates (2-3 hours)
- **Testing & Bug Fixes:** 4-6 hours

**Total Estimate:** 28-39 hours

---

## Success Criteria

1. ✅ Industry, Niche, Country, City, and Phone fields (all required) appear in forms and save correctly
2. ✅ Real-time validation works for all fields
3. ✅ Name field prevents numbers and shows errors immediately
4. ✅ Phone number field validates format in real-time
5. ✅ Form prevents submission until all required fields are valid
2. ✅ City and Country are separate fields with autocomplete
3. ✅ Brand and Creator forms are separate and functional
4. ✅ Rate limiting prevents excessive requests
5. ✅ No sensitive data in logs
6. ✅ Input validation prevents malicious input
7. ✅ Admin can view full profile details before approval
8. ✅ Login and Signup buttons navigate correctly

---

## Next Steps

1. Review and approve plan
2. Set up development branch
3. Begin Phase 1 implementation
4. Test each phase before moving to next
5. Deploy incrementally with monitoring
