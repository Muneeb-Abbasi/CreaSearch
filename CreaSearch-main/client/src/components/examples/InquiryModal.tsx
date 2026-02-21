import { useState } from "react";
import { InquiryModal } from "../InquiryModal";
import { Button } from "@/components/ui/button";

export default function InquiryModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Inquiry Modal</Button>
      <InquiryModal
        open={open}
        onClose={() => setOpen(false)}
        creatorName="Ayesha Khan"
      />
    </div>
  );
}
