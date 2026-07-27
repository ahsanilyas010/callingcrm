"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/current-profile";
import { getConnector, connectorRegistry } from "@/lib/connectors/registry";
import { importLeads } from "@/lib/connectors/pipeline";
import { parseVendorFile, normaliseVendorRow, type VendorCsvFieldMap } from "@/lib/connectors/vendor-csv";
import { captureException } from "@/lib/error-tracking";
import type { Json } from "@/lib/supabase/types";

export interface ActionResult {
  error?: string;
  ok?: boolean;
  imported?: number;
  rejected?: number;
}

// Registers a data_source row backed by one of the built-in connectors.
// `config.connector_key` is how the admin/data screen knows which
// connector's "Run fetch" dialog to offer for this source.
export async function registerConnectorSource(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager"].includes(profile.role)) return { error: "Not authorized." };

  const connectorKey = String(formData.get("connector_key") ?? "");
  const connector = connectorRegistry[connectorKey];
  if (!connector) return { error: "Unknown connector." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "A name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("data_sources").insert({
    name,
    source_type: connector.market === "UK" && connectorKey === "companies_house" ? "public_api" : "public_open_data",
    market: connector.market,
    lawful_basis: connector.lawfulBasis,
    config: { connector_key: connectorKey } as Json,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/data");
  return { ok: true };
}

// Section 6.4 — triggers one of the registered API/open-data connectors.
// Runs the whole fetch -> normalise -> import cycle and records it in
// source_fetch_runs regardless of outcome, so a failed run is as visible
// as a successful one.
export async function runConnectorFetch(params: {
  connectorKey: string;
  dataSourceId: string;
  campaignId: string;
  fetchParams: Record<string, unknown>;
}): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "team_lead"].includes(profile.role)) {
    return { error: "Not authorized." };
  }

  const connector = getConnector(params.connectorKey);
  if (!connector) return { error: `Unknown connector "${params.connectorKey}".` };

  const supabase = await createClient();
  const { data: run, error: runError } = await supabase
    .from("source_fetch_runs")
    .insert({
      data_source_id: params.dataSourceId,
      campaign_id: params.campaignId,
      triggered_by: profile.id,
      params: params.fetchParams as Json,
      status: "running",
    })
    .select("id")
    .single();
  if (runError || !run) return { error: runError?.message ?? "Could not start fetch run." };

  try {
    const raw = await connector.fetch(params.fetchParams);
    const records = raw.map((r) => connector.normalise(r)).filter((r) => r !== null);

    const outcome = await importLeads({
      supabase,
      campaignId: params.campaignId,
      dataSourceId: params.dataSourceId,
      records,
    });

    await supabase
      .from("source_fetch_runs")
      .update({
        finished_at: new Date().toISOString(),
        records_found: raw.length,
        records_imported: outcome.imported,
        records_rejected: raw.length - records.length + outcome.rejected,
        status: "complete",
      })
      .eq("id", run.id);

    revalidatePath("/admin/data");
    return { ok: true, imported: outcome.imported, rejected: outcome.rejected };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed.";
    captureException(err, { action: "runConnectorFetch", dataSourceId: params.dataSourceId, runId: run.id });
    await supabase
      .from("source_fetch_runs")
      .update({ finished_at: new Date().toISOString(), status: "failed", error: message })
      .eq("id", run.id);
    revalidatePath("/admin/data");
    return { error: message };
  }
}

// Section 6.4 — "Vendor CSV | Both | Licensed | Generic import path with
// mandatory provenance capture." Same commit path as the API connectors;
// logged the same way in source_fetch_runs so import history is one list,
// not two.
export async function uploadVendorCsv(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!["super_admin", "ops_manager", "team_lead"].includes(profile.role)) {
    return { error: "Not authorized." };
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const dataSourceId = String(formData.get("data_source_id") ?? "");
  const countryHint = String(formData.get("country") ?? "GB");
  const file = formData.get("file");

  if (!campaignId || !dataSourceId || !(file instanceof File)) {
    return { error: "Campaign, data source and a file are required." };
  }

  const fieldMap: VendorCsvFieldMap = {
    phone: String(formData.get("map_phone") ?? "") || undefined,
    firstName: String(formData.get("map_first_name") ?? "") || undefined,
    lastName: String(formData.get("map_last_name") ?? "") || undefined,
    companyName: String(formData.get("map_company_name") ?? "") || undefined,
    jobTitle: String(formData.get("map_job_title") ?? "") || undefined,
    email: String(formData.get("map_email") ?? "") || undefined,
    addressLine1: String(formData.get("map_address") ?? "") || undefined,
    city: String(formData.get("map_city") ?? "") || undefined,
    region: String(formData.get("map_region") ?? "") || undefined,
    postcode: String(formData.get("map_postcode") ?? "") || undefined,
    externalRef: String(formData.get("map_external_ref") ?? "") || undefined,
  };
  if (!fieldMap.phone) return { error: "A phone-number column mapping is required." };

  const supabase = await createClient();
  const { data: run, error: runError } = await supabase
    .from("source_fetch_runs")
    .insert({
      data_source_id: dataSourceId,
      campaign_id: campaignId,
      triggered_by: profile.id,
      params: { fieldMap, filename: file.name } as Json,
      status: "running",
    })
    .select("id")
    .single();
  if (runError || !run) return { error: runError?.message ?? "Could not start import run." };

  try {
    const { rows } = parseVendorFile(await file.arrayBuffer());
    const records = rows
      .map((row) => normaliseVendorRow(row, fieldMap, countryHint))
      .filter((r) => r !== null);

    const outcome = await importLeads({
      supabase,
      campaignId,
      dataSourceId,
      records,
    });

    await supabase
      .from("source_fetch_runs")
      .update({
        finished_at: new Date().toISOString(),
        records_found: rows.length,
        records_imported: outcome.imported,
        records_rejected: rows.length - records.length + outcome.rejected,
        status: "complete",
      })
      .eq("id", run.id);

    revalidatePath("/admin/data");
    return { ok: true, imported: outcome.imported, rejected: outcome.rejected };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed.";
    captureException(err, { action: "uploadVendorCsv", dataSourceId, runId: run.id });
    await supabase
      .from("source_fetch_runs")
      .update({ finished_at: new Date().toISOString(), status: "failed", error: message })
      .eq("id", run.id);
    revalidatePath("/admin/data");
    return { error: message };
  }
}
