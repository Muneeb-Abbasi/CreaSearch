import os
import requests
import json
import sys

# Load API token from environment variable, behaving like the instagram.ts service
APIFY_API_TOKEN=" "
REQUEST_TIMEOUT = 120  # 120 seconds

if not APIFY_API_TOKEN:
    print("Error: APIFY_API_TOKEN or APIFY_TOKEN environment variable not set.")
    print("Please set it. Example: set APIFY_TOKEN=your_token")
    sys.exit(1)

def run_apify_actor(actor_id: str, payload: dict):
    url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
    
    # print(f"Running Apify actor {actor_id}...")
    try:
        response = requests.post(
            f"{url}?token={APIFY_API_TOKEN}",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=REQUEST_TIMEOUT
        )
        
        if response.status_code not in (200, 201):
            print(f"Apify error: {response.status_code} {response.reason}")
            print(response.text)
            return []
            
        return response.json()
    except requests.exceptions.Timeout:
        print("Apify request timed out")
        return []
    except requests.exceptions.RequestException as e:
        print(f"Apify request error: {e}")
        return []

def scrape_facebook_profile(profile_url: str):
    # Depending on the Apify actor, the payload might vary. 
    # The official apify/facebook-pages-scraper uses "startUrls"
    payload = {
        "startUrls": [{"url": profile_url}],
        "resultsLimit": 1
    }
    
    # print(f"Sending request to Apify with payload: {json.dumps(payload)}")
    data = run_apify_actor('apify~facebook-pages-scraper', payload)
    
    if data and len(data) > 0:
        return data[0]
    
    return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python facebook_apify_test.py <facebook_profile_url>")
        sys.exit(1)
        
    url = sys.argv[1]
    
    result = scrape_facebook_profile(url)
    
    if result:
        followers = result.get('followers')
        if followers is not None:
            print(followers)
        else:
            # If followers count is missing, show a clear message
            print("Followers count not found.")
    else:
        # Avoid printing anything else if it failed, or show a clear error
        sys.exit(1)
