import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/current-profile";
import { Activity, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LiveFloorPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, code, market, is_active, campaign_assignments(user_id)")
    .order("created_at", { ascending: false });

  const totalAgents = new Set(
    (campaigns ?? []).flatMap((c) =>
      (c as unknown as { campaign_assignments: { user_id: string }[] }).campaign_assignments.map(
        (a) => a.user_id,
      ),
    ),
  ).size;

  return (
    <div className="p-4">
      <Card className="mb-4 animate-slide-up">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 animate-pulse-dot text-brand-green-text" /> Live floor
          </CardTitle>
          <span className="text-xs text-muted">{totalAgents} agents assigned across campaigns</span>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted">
            Real-time headcount, aux states, and per-campaign call volume arrive with the agent
            workspace (Phase 3) and attendance (Phase 4). What&rsquo;s real today: campaigns and
            who&rsquo;s assigned to them.
          </p>
        </CardContent>
      </Card>

      {(campaigns ?? []).length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-line bg-white">
          <div className="text-center">
            <Activity className="mx-auto mb-2 h-6 w-6 text-muted" />
            <p className="text-sm text-muted">
              No campaigns yet. Create one in Campaigns to see it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(campaigns ?? []).map((c) => {
            const assignedCount = (
              c as unknown as { campaign_assignments: { user_id: string }[] }
            ).campaign_assignments.length;
            return (
              <Card key={c.id} className="animate-slide-up">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>{c.name}</CardTitle>
                    <p className="tabular text-xs text-muted">{c.code}</p>
                  </div>
                  {c.is_active ? (
                    <Badge variant="confirm">Live</Badge>
                  ) : (
                    <Badge variant="neutral">Not activated</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="blue">{c.market}</Badge>
                    <span className="text-muted">{assignedCount} agents assigned</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
