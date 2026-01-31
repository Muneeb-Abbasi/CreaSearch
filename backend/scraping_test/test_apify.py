import requests

APIFY_TOKEN = "apify_api_Op94fzwiMGuXyfFQfkvMbBSv80okcv0YV4ib"

# ---------------- Helper ----------------
def run_actor(actor_id, payload):
    url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
    try:
        r = requests.post(url, params={"token": APIFY_TOKEN}, json=payload, timeout=120)
        r.raise_for_status()
        data = r.json()
        return data
    except Exception as e:
        print(f"Apify error ({actor_id}): {e}")
        return []

# ---------------- INSTAGRAM ----------------
def verify_instagram(profile_url):
    username = profile_url.rstrip("/").split("/")[-1]

    # Primary actor
    data = run_actor("apify~instagram-scraper", {"search": username, "resultsLimit": 1})
    if data:
        item = data[0]
        if item.get("isPrivate"):
            return None, "PRIVATE"
        return item.get("followersCount") or item.get("followers"), "VERIFIED"

    # Fallback actor
    data = run_actor("pratikdani~instagram-profile-scraper", {"profileUrl": profile_url})
    if data:
        item = data[0]
        if item.get("isPrivate"):
            return None, "PRIVATE"
        return item.get("followers"), "VERIFIED"

    return None, "FAILED"

# ---------------- YOUTUBE ----------------
def verify_youtube(channel_url):
    data = run_actor("streamers~youtube-scraper", {"startUrls": [{"url": channel_url}], "maxResults": 1})
    if not data:
        return None, "NOT_FOUND"

    channel_info = data[0].get("aboutChannelInfo", {})
    subs = channel_info.get("numberOfSubscribers")
    if subs is None:
        return None, "HIDDEN"
    return subs, "VERIFIED"

# ---------------- TIKTOK ----------------
def verify_tiktok(profile_url):
    data = run_actor("apidojo~tiktok-user-scraper", {"startUrls": [{"url": profile_url}], "maxItems": 1})
    if not data:
        return None, "NOT_FOUND"

    item = data[0]
    if item.get("privateAccount"):
        return None, "PRIVATE"

    followers = item.get("followers")
    if followers is None:
        return None, "FAILED"

    return followers, "VERIFIED"

# ---------------- TEST ----------------
profiles = [
    ("instagram", "https://www.instagram.com/imohsintariq/"),
    ("youtube", "https://www.youtube.com/@ARYDigitalasia"),
    ("tiktok", "https://www.tiktok.com/@irfanjunejo")
]

for platform, url in profiles:
    try:
        if platform == "instagram":
            count, status = verify_instagram(url)
        elif platform == "youtube":
            count, status = verify_youtube(url)
        elif platform == "tiktok":
            count, status = verify_tiktok(url)
        else:
            continue
    except Exception as e:
        count, status = None, f"FAILED ({e})"

    print(f"{platform.upper()} | {count} | {status}")
