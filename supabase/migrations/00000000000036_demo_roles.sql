-- Two demo-only roles for sales/investor walkthroughs, so nobody has to
-- hand out a real staff or client login (and its real lead/call data) just
-- to show the product. demo_ops sees the real list of currently-running
-- campaigns (credibility that the platform is actually live) but every
-- other number on its dashboard is fabricated. demo_agent sees a fake
-- dial-workspace and a fake client-report view, both 100% dummy data —
-- it never gets a campaigns grant, so it can't see anything real at all.
--
-- Split into two ALTER TYPE ... ADD VALUE statements (each commits on its
-- own) followed by a separate policy update, since Postgres won't let a
-- freshly added enum value be used in the same transaction it was added
-- in.
alter type app_role add value if not exists 'demo_ops';
alter type app_role add value if not exists 'demo_agent';
