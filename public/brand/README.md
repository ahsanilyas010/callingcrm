# Brand assets — placeholder

The build spec (section 2) references a full set of pre-processed logo
crops (`assorted-logo-64h.png`, `assorted-mark.png`, favicon set, etc.)
sampled from a supplied logo master `3.png`. That master was not attached
to this build, so this directory is currently empty and the app renders a
generated placeholder mark (`src/components/brand/mark.tsx`) instead — three
circles in the exact brand hexes, standing in for the real three-gear mark.

To swap in the real assets:

1. Drop the files listed in spec section 2 into this directory using the
   exact names given there.
2. Replace usages of `<BrandMark />` / `<BrandLockup />` with `<img>` tags
   pointing at the real files (sidebar uses `assorted-logo-64h.png`
   expanded / `mark-32.png` collapsed; PDF/report headers use
   `assorted-logo-128h.png`).
3. Get the vector SVG source from Barkha per the spec's open follow-up —
   raster crops are fine at the sizes given but won't scale into print.
4. Confirm whether the client-facing wordmark should read "Assorted BPO"
   rather than "Assorted Business Services" before it ships on a client
   report.
