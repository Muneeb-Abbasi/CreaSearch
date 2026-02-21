import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreasearchScore } from "./CreasearchScore";
import { CheckCircle2, MapPin, Users } from "lucide-react";

interface CreatorCardProps {
  id: string;
  name: string;
  title: string;
  location: string;
  imageUrl: string;
  videoThumbnail?: string;
  score: number;
  verified: boolean;
  followerCount: number;
  tags: string[];
  onClick?: () => void;
}

export function CreatorCard({
  name,
  title,
  location,
  imageUrl,
  score,
  verified,
  followerCount,
  tags,
  onClick,
}: CreatorCardProps) {
  return (
    <Card
      className="group overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all"
      onClick={onClick}
      data-testid="card-creator"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute top-3 right-3">
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-1">
            <CreasearchScore score={score} size="sm" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg" data-testid="text-creator-name">
              {name}
            </h3>
            {verified && <CheckCircle2 className="w-4 h-4 text-green-400" />}
          </div>
          <p className="text-sm text-white/90 mb-2" data-testid="text-creator-title">
            {title}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{followerCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
