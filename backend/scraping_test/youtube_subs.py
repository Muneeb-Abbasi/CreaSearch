from googleapiclient.discovery import build
from urllib.parse import urlparse

YOUTUBE_API_KEY = "AIzaSyCtHkG3dYU_rOf3bRs_ngDYd0Vh4Zfvm5c"

youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)


def extract_channel_identifier(channel_url):
    """
    Returns (type, value)
    type: 'id' | 'username' | 'handle'
    """
    path = urlparse(channel_url).path.strip("/")

    if path.startswith("channel/"):
        return "id", path.split("/")[1]

    if path.startswith("@"):
        return "handle", path[1:]

    return "username", path


def get_channel_id(channel_url):
    id_type, value = extract_channel_identifier(channel_url)

    if id_type == "id":
        return value

    # For @handle or username
    response = youtube.search().list(
        q=value,
        part="snippet",
        type="channel",
        maxResults=1
    ).execute()

    items = response.get("items", [])
    if not items:
        return None

    return items[0]["snippet"]["channelId"]


def get_subscriber_count(channel_url):
    channel_id = get_channel_id(channel_url)
    if not channel_id:
        return None, "NOT_FOUND"

    response = youtube.channels().list(
        part="statistics",
        id=channel_id
    ).execute()

    items = response.get("items", [])
    if not items:
        return None, "NOT_FOUND"

    stats = items[0]["statistics"]

    if "subscriberCount" not in stats:
        return None, "HIDDEN"

    return int(stats["subscriberCount"]), "VERIFIED"


# ---------------- TEST ----------------
channels = [
    "https://www.youtube.com/@raftartv"
]

for ch in channels:
    subs, status = get_subscriber_count(ch)
    print(f"YOUTUBE | {subs} | {status}")
