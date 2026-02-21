import { ProfileHeader } from "../ProfileHeader";
import creatorImage from "@assets/generated_images/Pakistani_female_creator_headshot_b1688276.png";

export default function ProfileHeaderExample() {
  return (
    <ProfileHeader
      name="Ayesha Khan"
      title="Tech Content Creator & Speaker"
      location="Karachi, Pakistan"
      avatarUrl={creatorImage}
      score={85}
      verified={true}
      followerCount={250000}
      completedGigs={47}
      tags={["Tech", "Education", "YouTube", "Podcasts", "Public Speaking"]}
    />
  );
}
