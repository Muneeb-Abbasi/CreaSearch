import { CreatorCard } from "../CreatorCard";
import creatorImage1 from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";

export default function CreatorCardExample() {
  return (
    <div className="max-w-sm p-8">
      <CreatorCard
        id="1"
        name="Ayesha Khan"
        title="Tech Content Creator & Speaker"
        location="Karachi, Pakistan"
        imageUrl={creatorImage1}
        score={85}
        verified={true}
        followerCount={125000}
        tags={["Tech", "Education", "YouTube", "Podcasts"]}
        onClick={() => console.log("Creator card clicked")}
      />
    </div>
  );
}
