import { redirect } from "next/navigation";
import { UserPlus, Building2 } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-profile";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoBanner } from "@/components/shell/demo-banner";
import { DemoActionButton } from "../demo-action-button";
import { DUMMY_CAMPAIGNS, DUMMY_CLIENTS } from "../dummy-data";

export default async function DemoCampaignsPage() {
  const profile = await requireProfile();
  if (profile.role !== "demo_ops") redirect("/");

  return (
    <div className="p-4">
      <DemoBanner note="Every campaign and client on this page is made up — none of them are real." />

      <Tabs defaultValue="campaigns">
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="campaigns">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-muted">{DUMMY_CAMPAIGNS.length} campaigns · never mix markets in one campaign</p>
            <DemoActionButton>
              <Building2 className="h-4 w-4" /> Create campaign
            </DemoActionButton>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DUMMY_CAMPAIGNS.map((c) => (
              <div key={c.code} className="hover-lift animate-slide-up block rounded-lg border border-line bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-ink">{c.name}</div>
                    <div className="tabular text-xs text-muted">{c.code}</div>
                  </div>
                  {c.isActive ? <Badge variant="confirm">Live</Badge> : <Badge variant="neutral">Not activated</Badge>}
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="blue">{c.market}</Badge>
                  <Badge variant="neutral">{c.audience}</Badge>
                  <Badge variant="neutral">{c.vertical}</Badge>
                  {c.riskTier === "elevated" && <Badge variant="warning">Elevated risk</Badge>}
                </div>
                <div className="text-xs text-muted">Client: {c.client}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-muted">{DUMMY_CLIENTS.length} clients</p>
            <DemoActionButton>
              <UserPlus className="h-4 w-4" /> Add client
            </DemoActionButton>
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Country</th>
                  <th className="px-3 py-2 font-medium">Contact email</th>
                  <th className="px-3 py-2 font-medium">Controller</th>
                  <th className="px-3 py-2 font-medium">DPA signed</th>
                </tr>
              </thead>
              <tbody>
                {DUMMY_CLIENTS.map((c) => (
                  <tr key={c.name} className="h-[38px] border-b border-line last:border-0">
                    <td className="px-3 py-1.5 font-medium text-ink">{c.name}</td>
                    <td className="px-3 py-1.5 text-muted">{c.country}</td>
                    <td className="px-3 py-1.5 text-muted">
                      {c.email ?? <span className="text-warning">Not set</span>}
                    </td>
                    <td className="px-3 py-1.5">
                      {c.isController ? <Badge variant="blue">Client</Badge> : <Badge variant="neutral">Processor</Badge>}
                    </td>
                    <td className="px-3 py-1.5 text-muted">
                      {c.dpaSigned ?? <span className="text-warning">Not on file</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
