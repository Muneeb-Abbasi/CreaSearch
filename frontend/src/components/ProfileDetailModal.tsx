import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Profile } from "@/lib/api";
import { getCountryName } from "@/data/countries-cities";

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
                {[profile.city, profile.country ? getCountryName(profile.country) : null].filter(Boolean).join(", ") || profile.location || "Not specified"}
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
