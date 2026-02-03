import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { Review } from "@/lib/api";

interface ReviewListProps {
    reviews: Review[];
    isLoading?: boolean;
}

export function ReviewList({ reviews, isLoading }: ReviewListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="py-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-1/4" />
                                    <div className="h-3 bg-muted rounded w-1/3" />
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <Card className="bg-muted/30">
                <CardContent className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-medium mb-1">No reviews yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Be the first to leave a review for this creator!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <Card key={review.id}>
                    <CardContent className="py-4">
                        <div className="flex gap-4">
                            {/* Reviewer Avatar */}
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={review.reviewer_avatar || undefined} alt={review.reviewer_name} />
                                <AvatarFallback>{review.reviewer_name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                {/* Header: Name + Date */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{review.reviewer_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Star Rating */}
                                <div className="flex gap-0.5 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= review.rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-muted-foreground"
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Comment */}
                                {review.comment && (
                                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
