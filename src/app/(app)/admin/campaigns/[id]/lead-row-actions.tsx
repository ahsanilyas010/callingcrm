"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { markScreened } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";

export function LeadRowActions({
  leadId,
  screeningStatus,
  doNotCall,
}: {
  leadId: string;
  screeningStatus: string;
  doNotCall: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (doNotCall || screeningStatus === "passed") return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markScreened(leadId);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Marked as passed screening");
            router.refresh();
          }
        })
      }
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5" />
      )}
      Mark screened
    </Button>
  );
}
