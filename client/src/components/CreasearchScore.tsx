import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreasearchScoreProps {
  score: number;
  showBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CreasearchScore({ score, showBreakdown = false, size = "md" }: CreasearchScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 86) return "text-yellow-600 dark:text-yellow-500";
    if (score >= 61) return "text-green-600 dark:text-green-500";
    if (score >= 31) return "text-blue-600 dark:text-blue-500";
    return "text-muted-foreground";
  };

  const getProgressColor = (score: number) => {
    if (score >= 86) return "bg-yellow-600 dark:bg-yellow-500";
    if (score >= 61) return "bg-green-600 dark:bg-green-500";
    if (score >= 31) return "bg-blue-600 dark:bg-blue-500";
    return "bg-muted-foreground";
  };

  const sizeClasses = {
    sm: "w-12 h-12 text-xs",
    md: "w-16 h-16 text-sm",
    lg: "w-24 h-24 text-lg",
  };

  const breakdown = (
    <div className="space-y-2">
      <div className="font-medium text-sm">Score Breakdown</div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Follower Reach (40%)</span>
          <span>{Math.round(score * 0.4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Profile Completion (20%)</span>
          <span>{Math.round(score * 0.2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Verification (10%)</span>
          <span>{Math.round(score * 0.1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gigs Completed (30%)</span>
          <span>{Math.round(score * 0.3)}</span>
        </div>
      </div>
    </div>
  );

  const scoreDisplay = (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8%"
          className="text-muted/30"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8%"
          className={getScoreColor(score)}
          strokeDasharray={`${(score / 100) * 283} 283`}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-semibold ${getScoreColor(score)}`}>
        {score}
      </div>
    </div>
  );

  if (showBreakdown) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div data-testid="score-display">{scoreDisplay}</div>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          {breakdown}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div data-testid="score-display">{scoreDisplay}</div>;
}
