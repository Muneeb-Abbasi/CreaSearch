import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreasearchScore } from "./CreasearchScore";
import { VerificationBadge } from "./VerificationBadge";
import { MapPin, Users, Briefcase, MessageSquare } from "lucide-react";
import { SiYoutube, SiInstagram, SiLinkedin, SiX } from "react-icons/si";

interface SocialLinks {
  youtube?: string;
  instagram?: string;
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

  return (
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
                  {socialLinks?.youtube && <VerificationBadge type="youtube" verified={true} />}
                  {socialLinks?.instagram && <VerificationBadge type="instagram" verified={true} />}
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
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{followerCount.toLocaleString()} followers</span>
              </div>
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
              {socialLinks?.youtube && (
                <Button variant="outline" onClick={() => openLink(socialLinks.youtube)} data-testid="button-youtube">
                  <SiYoutube className="w-4 h-4 mr-2" />
                  YouTube
                </Button>
              )}
              {socialLinks?.instagram && (
                <Button variant="outline" onClick={() => openLink(socialLinks.instagram)} data-testid="button-instagram">
                  <SiInstagram className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
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
  );
}
