import { CreasearchScore } from "../CreasearchScore";

export default function CreasearchScoreExample() {
  return (
    <div className="flex items-center gap-8 p-8">
      <div className="space-y-2 text-center">
        <CreasearchScore score={45} size="sm" />
        <div className="text-xs text-muted-foreground">Small</div>
      </div>
      <div className="space-y-2 text-center">
        <CreasearchScore score={72} size="md" showBreakdown />
        <div className="text-xs text-muted-foreground">Medium with tooltip</div>
      </div>
      <div className="space-y-2 text-center">
        <CreasearchScore score={92} size="lg" />
        <div className="text-xs text-muted-foreground">Large</div>
      </div>
    </div>
  );
}
