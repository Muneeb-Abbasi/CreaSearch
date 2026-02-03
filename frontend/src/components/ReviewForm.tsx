import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { reviewsApi, Review } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
    profileId: string;
    onReviewSubmitted: (review: Review) => void;
    userHasProfile: boolean;
}

export function ReviewForm({ profileId, onReviewSubmitted, userHasProfile }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: "Rating required",
                description: "Please select a star rating",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const review = await reviewsApi.create({
                profile_id: profileId,
                rating,
                comment: comment.trim() || undefined,
            });

            onReviewSubmitted(review);
            setRating(0);
            setComment("");
            toast({
                title: "Review submitted!",
                description: "Thank you for your feedback.",
            });
        } catch (error: any) {
            toast({
                title: "Failed to submit review",
                description: error.message || "Please try again later",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!userHasProfile) {
        return (
            <Card className="bg-muted/50">
                <CardContent className="py-6">
                    <p className="text-center text-muted-foreground">
                        Only verified users with approved profiles can leave reviews.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Leave a Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Star Rating */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                disabled={isSubmitting}
                            >
                                <Star
                                    className={`w-7 h-7 ${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Comment (optional)</label>
                    <Textarea
                        placeholder="Share your experience working with this creator..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className="w-full"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        "Submit Review"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
