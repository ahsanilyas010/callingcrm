// Single source of truth for user-visible brand copy — sidebar wordmark,
// login screen, PDF reports, outgoing emails, and a couple of admin-form
// labels. Every one of those call sites reads BRAND.* instead of a
// hardcoded string, so swapping branding (e.g. for a white-label demo) is
// a one-file edit here, not a repo-wide grep-and-replace.
//
// Real branding — restore this and delete the block below, then redeploy,
// once the pitch demo period is over.
// export const BRAND = {
//   productName: "ABPO Command",
//   metaDescription: "Assorted BPO — call centre CRM and workforce platform",
//   loginTagline: "Assorted BPO — call centre floor",
//   processorBadgeLabel: "ABPO",
//   processorLabel: "ABPO",
//   emailFromName: "Assorted BPO",
//   emailFromDomainFallback: "mail.assorted.group",
//   pdfFilenamePrefix: "assorted-bpo-client-report",
//   agentCodePlaceholder: "ABPO-014",
// };

// Temporary placeholder branding for a buyer pitch demo.
export const BRAND = {
  productName: "Command Center",
  metaDescription: "Call centre CRM and workforce platform",
  loginTagline: "Call centre floor",
  processorBadgeLabel: "Processor",
  processorLabel: "the platform",
  emailFromName: "Command Center",
  emailFromDomainFallback: "mail.example.com",
  pdfFilenamePrefix: "client-report",
  agentCodePlaceholder: "AGT-014",
};
