"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Phone, Building2, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DemoBanner } from "@/components/shell/demo-banner";

// Entirely made up — no real lead ever appears in this component, and no
// disposition button here writes anything anywhere.
const SAMPLE_LEADS = [
  { name: "Rebecca Hart", company: "Northwind Roofing", phone: "+1 (555) 019-2231", city: "Denver, CO" },
  { name: "Marcus Webb", company: "Bluepeak Logistics", phone: "+1 (555) 048-7710", city: "Austin, TX" },
  { name: "Priya Nandakumar", company: "Solace Dental Group", phone: "+1 (555) 062-3305", city: "Raleigh, NC" },
];

const DISPOSITIONS = [
  { code: "interested", label: "Connected — Interested", variant: "confirm" as const },
  { code: "callback", label: "Connected — Callback", variant: "secondary" as const },
  { code: "not_interested", label: "Connected — Not Interested", variant: "secondary" as const },
  { code: "voicemail", label: "Voicemail", variant: "secondary" as const },
  { code: "no_answer", label: "No Answer", variant: "ghost" as const },
];

export function DemoAgentView() {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const lead = SAMPLE_LEADS[index % SAMPLE_LEADS.length];

  function logDemoCall(label: string) {
    toast.success(`Demo mode — "${label}" logged, no real call was placed.`);
    setNotes("");
    setIndex((i) => i + 1);
  }

  return (
    <div className="p-4">
      <DemoBanner note="This lead, phone number, and every outcome below are made up — no real call is placed and nothing is saved." />

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Sample lead</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="font-display text-lg font-semibold text-ink">{lead.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {lead.company}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> <span className="tabular">{lead.phone}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {lead.city}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" /> Sample script: introduce yourself, confirm you’re
            speaking with {lead.name.split(" ")[0]}, and pitch the offer.
          </div>

          <Textarea
            placeholder="Call notes (not saved — this is a demo)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {DISPOSITIONS.map((d) => (
              <Button key={d.code} variant={d.variant} size="sm" onClick={() => logDemoCall(d.label)}>
                {d.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 flex items-center gap-2">
        <Badge variant="neutral">Sample lead {(index % SAMPLE_LEADS.length) + 1} of {SAMPLE_LEADS.length}</Badge>
        <span className="text-xs text-muted">Log any outcome above to see the next sample lead.</span>
      </div>
    </div>
  );
}
