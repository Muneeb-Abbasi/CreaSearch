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
  if (country.length !== 2) {
    return { isValid: false, error: "Invalid country code" };
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

// Title validation (optional field)
export function validateTitle(title: string): ValidationResult {
  if (!title.trim()) {
    return { isValid: true }; // Optional
  }
  if (title.length > 200) {
    return { isValid: false, error: "Title must be less than 200 characters" };
  }
  return { isValid: true };
}

// Bio validation (optional field)
export function validateBio(bio: string): ValidationResult {
  if (!bio.trim()) {
    return { isValid: true }; // Optional
  }
  if (bio.length > 2000) {
    return { isValid: false, error: "Bio must be less than 2000 characters" };
  }
  return { isValid: true };
}

// Follower count validation
export function validateFollowerCount(count: string): ValidationResult {
  if (!count.trim()) {
    return { isValid: true }; // Optional
  }
  const num = parseInt(count, 10);
  if (isNaN(num)) {
    return { isValid: false, error: "Follower count must be a number" };
  }
  if (num < 0) {
    return { isValid: false, error: "Follower count cannot be negative" };
  }
  if (num > 100000000) {
    return { isValid: false, error: "Follower count is too large" };
  }
  return { isValid: true };
}

// Instagram URL validation
export function validateInstagramUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true }; // Optional
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.match(/^(www\.)?instagram\.com$/i)) {
      return { isValid: false, error: "Please enter a valid Instagram URL (instagram.com)" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid Instagram URL" };
  }
}

// YouTube URL validation
export function validateYouTubeUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true }; // Optional
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.match(/^(www\.)?(youtube\.com|youtu\.be)$/i)) {
      return { isValid: false, error: "Please enter a valid YouTube URL (youtube.com)" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid YouTube URL" };
  }
}

// LinkedIn URL validation
export function validateLinkedInUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true }; // Optional
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.match(/^(www\.)?linkedin\.com$/i)) {
      return { isValid: false, error: "Please enter a valid LinkedIn URL (linkedin.com)" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid LinkedIn URL" };
  }
}

// Twitter/X URL validation
export function validateTwitterUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true }; // Optional
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.match(/^(www\.)?(twitter\.com|x\.com)$/i)) {
      return { isValid: false, error: "Please enter a valid Twitter/X URL (twitter.com or x.com)" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid Twitter/X URL" };
  }
}
