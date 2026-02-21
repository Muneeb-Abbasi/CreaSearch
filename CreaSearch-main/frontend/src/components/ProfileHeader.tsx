import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreasearchScore } from "./CreasearchScore";
import { VerificationBadge } from "./VerificationBadge";
import { MapPin, Users, Briefcase, MessageSquare, CheckCircle2 } from "lucide-react";
import { SiYoutube, SiInstagram, SiLinkedin, SiX } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Enhanced social links with verification data
interface SocialLinkData {
  url?: string;
  channelId?: string;
  channelTitle?: string;
  subscribers?: number;
  followers?: number;
  status?: 'PENDING' | 'VERIFIED' | 'VALIDATED' | 'HIDDEN' | 'NOT_FOUND' | 'FAILED';
  lastUpdated?: string;
}

interface SocialLinks {
  youtube?: string | SocialLinkData;
  instagram?: string | SocialLinkData;
  linkedin?: string;
  twitter?: string;
}

interface ProfileHeaderProps {
  name: string;
  title: string;
  location: string;
  avatarUrl: string;
  score: number;
  verified: boolean;
  followerCount: number;
  completedGigs: number;
  tags: string[];
  socialLinks?: SocialLinks;
  onInquiryClick?: () => void;
}

// Helper to extract URL from social link (string or object)
function getSocialUrl(link: string | SocialLinkData | undefined): string | undefined {
  if (!link) return undefined;
  if (typeof link === 'string') return link;
  return link.url;
}

// Helper to check if verified
function isVerified(link: string | SocialLinkData | undefined): boolean {
  if (!link || typeof link === 'string') return false;
  return link.status === 'VERIFIED' || link.status === 'VALIDATED';
}

// Helper to get subscriber/follower count
function getCount(link: string | SocialLinkData | undefined): number | null {
  if (!link || typeof link === 'string') return null;
  return link.subscribers || link.followers || null;
}

// Helper to get last updated date
function getLastUpdated(link: string | SocialLinkData | undefined): string | null {
  if (!link || typeof link === 'string') return null;
  return link.lastUpdated || null;
}

export function ProfileHeader({
  name,
  title,
  location,
  avatarUrl,
  score,
  verified,
  followerCount,
  completedGigs,
  tags,
  socialLinks,
  onInquiryClick,
}: ProfileHeaderProps) {
  const openLink = (url: string | undefined) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  const youtubeUrl = getSocialUrl(socialLinks?.youtube);
  const instagramUrl = getSocialUrl(socialLinks?.instagram);
  const youtubeVerified = isVerified(socialLinks?.youtube);
  const instagramVerified = isVerified(socialLinks?.instagram);
  const youtubeCount = getCount(socialLinks?.youtube);
  const instagramCount = getCount(socialLinks?.instagram);
  const youtubeLastUpdated = getLastUpdated(socialLinks?.youtube);
  const instagramLastUpdated = getLastUpdated(socialLinks?.instagram);

  // Calculate total verified followers
  const verifiedFollowerCount = (youtubeCount || 0) + (instagramCount || 0);
  const displayFollowerCount = verifiedFollowerCount > 0 ? verifiedFollowerCount : followerCount;

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TooltipProvider>
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <Avatar className="w-32 h-32 border-4 border-background">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-heading text-3xl font-bold mb-2" data-testid="text-profile-name">
                    {name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-3" data-testid="text-profile-title">
                    {title}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <VerificationBadge type="photo" verified={verified} />
                    <VerificationBadge type="video" verified={verified} />
                    {youtubeUrl && <VerificationBadge type="youtube" verified={youtubeVerified} />}
                    {instagramUrl && <VerificationBadge type="instagram" verified={instagramVerified} />}
                    {socialLinks?.linkedin && <VerificationBadge type="linkedin" verified={true} />}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <CreasearchScore score={score} size="lg" showBreakdown />
                  <span className="text-xs text-muted-foreground">Creasearch Score</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-muted-foreground cursor-help">
                      <Users className="w-4 h-4" />
                      <span>
                        {displayFollowerCount.toLocaleString()} followers
                        {verifiedFollowerCount > 0 && (
                          <CheckCircle2 className="w-3 h-3 ml-1 inline text-green-500" />
                        )}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      {youtubeCount !== null && (
                        <div>YouTube: {youtubeCount.toLocaleString()} subscribers</div>
                      )}
                      {instagramCount !== null && (
                        <div>Instagram: {instagramCount.toLocaleString()} followers</div>
                      )}
                      {verifiedFollowerCount === 0 && (
                        <div>User-reported: {followerCount.toLocaleString()}</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span>{completedGigs} completed gigs</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button data-testid="button-send-inquiry" onClick={onInquiryClick}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Inquiry
                </Button>
                {youtubeUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => openLink(youtubeUrl)} data-testid="button-youtube">
                        <SiYoutube className="w-4 h-4 mr-2" />
                        YouTube
                        {youtubeVerified && youtubeCount && (
                          <span className="ml-2 text-xs opacity-70">
                            {youtubeCount >= 1000000
                              ? `${(youtubeCount / 1000000).toFixed(1)}M`
                              : youtubeCount >= 1000
                                ? `${(youtubeCount / 1000).toFixed(0)}K`
                                : youtubeCount}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    {youtubeVerified && youtubeLastUpdated && (
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            Verified
                          </div>
                          <div className="text-muted-foreground mt-1">
                            Last updated: {formatDate(youtubeLastUpdated)}
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
                {instagramUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => openLink(instagramUrl)} data-testid="button-instagram">
                        <SiInstagram className="w-4 h-4 mr-2" />
                        Instagram
                        {instagramVerified && instagramCount && (
                          <span className="ml-2 text-xs opacity-70">
                            {instagramCount >= 1000000
                              ? `${(instagramCount / 1000000).toFixed(1)}M`
                              : instagramCount >= 1000
                                ? `${(instagramCount / 1000).toFixed(0)}K`
                                : instagramCount}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    {instagramVerified && instagramLastUpdated && (
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            Verified
                          </div>
                          <div className="text-muted-foreground mt-1">
                            Last updated: {formatDate(instagramLastUpdated)}
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
                {socialLinks?.linkedin && (
                  <Button variant="outline" onClick={() => openLink(socialLinks.linkedin)} data-testid="button-linkedin">
                    <SiLinkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
                {socialLinks?.twitter && (
                  <Button variant="outline" onClick={() => openLink(socialLinks.twitter)} data-testid="button-twitter">
                    <SiX className="w-4 h-4 mr-2" />
                    Twitter/X
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
