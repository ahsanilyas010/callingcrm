"use client";

import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

// Stands in for every "create/edit/run" dialog trigger on the real ops
// pages — demo_ops has no write access to anything, so clicking any of
// these just explains that instead of opening a real form.
export function DemoActionButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      onClick={() => toast.info("Demo mode — this account can't create or change anything.")}
    >
      {children}
    </Button>
  );
}
