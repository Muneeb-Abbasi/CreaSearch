import { VerificationBadge } from "../VerificationBadge";

export default function VerificationBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-8">
      <VerificationBadge type="photo" />
      <VerificationBadge type="video" />
      <VerificationBadge type="youtube" />
      <VerificationBadge type="instagram" />
      <VerificationBadge type="linkedin" />
      <VerificationBadge type="twitter" />
    </div>
  );
}
