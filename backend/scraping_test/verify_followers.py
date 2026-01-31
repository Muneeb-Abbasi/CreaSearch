"""
Instagram Follower Verification Script
=======================================
Verifies followers count from Instagram profile URLs using Apify API.

Usage:
    python verify_followers.py
    
    Or import and use programmatically:
    from verify_followers import verify_instagram, verify_profile
"""

import requests
import re
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass
from enum import Enum


# ============================================================================
# CONFIGURATION
# ============================================================================

APIFY_TOKEN = "apify_api_Op94fzwiMGuXyfFQfkvMbBSv80okcv0YV4ib"
REQUEST_TIMEOUT = 120  # seconds


class VerificationStatus(Enum):
    VERIFIED = "VERIFIED"
    PRIVATE = "PRIVATE"
    NOT_FOUND = "NOT_FOUND"
    FAILED = "FAILED"


@dataclass
class VerificationResult:
    platform: str
    profile_url: str
    username: Optional[str]
    followers_count: Optional[int]
    status: str
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "platform": self.platform,
            "profile_url": self.profile_url,
            "username": self.username,
            "followers_count": self.followers_count,
            "status": self.status,
            "error_message": self.error_message
        }


# ============================================================================
# URL PARSING
# ============================================================================

def extract_instagram_username(url: str) -> Optional[str]:
    """Extract username from Instagram profile URL."""
    url = url.rstrip("/")
    match = re.search(r"instagram\.com/([^/?]+)", url)
    return match.group(1) if match else None


# ============================================================================
# APIFY API HELPER
# ============================================================================

def run_actor(actor_id: str, payload: Dict) -> List[Dict]:
    """Run an Apify actor and return results."""
    url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
    
    try:
        response = requests.post(
            url,
            params={"token": APIFY_TOKEN},
            json=payload,
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print(f"  ⏱️  Timeout for actor: {actor_id}")
        return []
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Apify error ({actor_id}): {e}")
        return []


# ============================================================================
# INSTAGRAM VERIFICATION
# ============================================================================

def verify_instagram(profile_url: str) -> Tuple[Optional[int], VerificationStatus, Optional[str]]:
    """
    Verify Instagram profile followers count.
    
    Primary Actor: apify~instagram-api-scraper
    Fallback Actor: apify~instagram-scraper
    """
    username = extract_instagram_username(profile_url)
    
    # Primary actor - Instagram API Scraper
    payload = {
        "directUrls": [profile_url],
        "resultsType": "details",
        "resultsLimit": 1
    }
    
    data = run_actor("apify~instagram-api-scraper", payload)
    
    if data:
        item = data[0]
        if item.get("isPrivate"):
            return None, VerificationStatus.PRIVATE, "Account is private"
        
        followers = item.get("followersCount") or item.get("followers") or item.get("edge_followed_by", {}).get("count")
        if followers is not None:
            return followers, VerificationStatus.VERIFIED, None
    
    # Fallback actor - Instagram Scraper (search by username)
    if username:
        payload = {"search": username, "resultsLimit": 1}
        data = run_actor("apify~instagram-scraper", payload)
        
        if data:
            item = data[0]
            if item.get("isPrivate"):
                return None, VerificationStatus.PRIVATE, "Account is private"
            
            followers = item.get("followersCount") or item.get("followers")
            if followers is not None:
                return followers, VerificationStatus.VERIFIED, None
    
    return None, VerificationStatus.FAILED, "Could not retrieve profile data"


def verify_profile(profile_url: str) -> VerificationResult:
    """
    Verify followers count for an Instagram profile.
    
    Args:
        profile_url: The URL of the Instagram profile
    
    Returns:
        VerificationResult with followers count and status
    """
    username = extract_instagram_username(profile_url)
    
    print(f"\n🔍 Verifying INSTAGRAM: {username or profile_url}")
    
    try:
        count, status, error = verify_instagram(profile_url)
    except Exception as e:
        count, status, error = None, VerificationStatus.FAILED, str(e)
    
    result = VerificationResult(
        platform="instagram",
        profile_url=profile_url,
        username=username,
        followers_count=count,
        status=status.value,
        error_message=error
    )
    
    # Print result
    if status == VerificationStatus.VERIFIED:
        print(f"  ✅ {status.value}: {count:,} followers")
    else:
        print(f"  ⚠️  {status.value}: {error or 'Unknown error'}")
    
    return result


def verify_all_profiles(profiles: List[str]) -> List[VerificationResult]:
    """Verify multiple Instagram profile URLs."""
    results = []
    for url in profiles:
        result = verify_profile(url)
        results.append(result)
    return results


# ============================================================================
# TEST PROFILES - ADD YOUR PROFILE LINKS HERE
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🔐 INSTAGRAM FOLLOWER VERIFICATION")
    print("=" * 60)
    
    # ========================================
    # ADD YOUR INSTAGRAM PROFILE LINKS HERE
    # ========================================
    
    test_profiles = [
        "https://www.instagram.com/imohsintariq/",
    ]
    
    # ========================================
    
    if not test_profiles:
        print("\n⚠️  No profiles to verify!")
        print("   Add profile URLs to the 'test_profiles' list above.")
        print("\nExample URL:")
        print("   - https://www.instagram.com/username/")
    else:
        results = verify_all_profiles(test_profiles)
        
        print("\n" + "=" * 60)
        print("📊 VERIFICATION SUMMARY")
        print("=" * 60)
        
        for r in results:
            status_icon = "✅" if r.status == "VERIFIED" else "❌"
            count_str = f"{r.followers_count:,}" if r.followers_count else "N/A"
            print(f"{status_icon} {r.username or 'N/A':20} | {count_str:>12} | {r.status}")
        
        print("=" * 60)
