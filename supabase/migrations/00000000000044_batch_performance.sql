-- lead_batches already exists (one row per CSV/XLSX upload, with a
-- rows_total/accepted/rejected/duplicate/suppressed breakdown) but was
-- never actually written to by uploadVendorCsv, so it has always been
-- empty — this migration doesn't change that table, it adds the
-- per-batch "how many dialed / how many left" rollup that lead_batches'
-- own stored columns can't answer on their own (they need a live count
-- against leads.attempt_count, same reasoning as v_source_performance's
-- "worked"/"contacted" columns, just scoped to one batch instead of one
-- data source).
create or replace view v_batch_performance
with (security_invoker = true) as
select
  lb.id as batch_id,
  lb.campaign_id,
  lb.data_source_id,
  lb.uploaded_by,
  lb.original_filename,
  lb.acquired_at,
  lb.status,
  lb.rows_total,
  lb.rows_accepted,
  lb.rows_rejected,
  lb.rows_duplicate,
  lb.rows_suppressed,
  count(l.id) filter (where l.attempt_count > 0) as dialed,
  count(l.id) filter (where l.attempt_count = 0 and not l.do_not_call) as remaining
from lead_batches lb
left join leads l on l.batch_id = lb.id
group by lb.id;
