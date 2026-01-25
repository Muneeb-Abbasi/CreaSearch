import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Youtube, Instagram, Linkedin } from "lucide-react";
import { SiX } from "react-icons/si";

interface VerificationBadgeProps {
  type: "photo" | "video" | "youtube" | "instagram" | "linkedin" | "twitter";
  verified?: boolean;
  className?: string;
}

export function VerificationBadge({ type, verified = true, className = "" }: VerificationBadgeProps) {
  const icons = {
    photo: <CheckCircle2 className="w-3 h-3" />,
    video: <CheckCircle2 className="w-3 h-3" />,
    youtube: <Youtube className="w-3 h-3" />,
    instagram: <Instagram className="w-3 h-3" />,
    linkedin: <Linkedin className="w-3 h-3" />,
    twitter: <SiX className="w-3 h-3" />,
  };

  const labels = {
    photo: "Verified Photo",
    video: "Video Verified",
    youtube: "YouTube",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    twitter: "Twitter",
  };

  if (!verified) return null;

  return (
    <Badge
      variant="secondary"
      className={`gap-1 ${className}`}
      data-testid={`badge-${type}`}
    >
      {icons[type]}
      <span>{labels[type]}</span>
    </Badge>
  );
}
