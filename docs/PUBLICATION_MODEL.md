# Publication Model — how private JasVerse truth becomes a public page

## The firewall, in one line

```
PRIVATE JASVERSE TRUTH (JasVerse-Operations)
        ↓
   PUBLICATION GATE   (a human/AI decision: is this safe and intended to be public?)
        ↓
SANITIZED PUBLIC PROJECTION (data/public-*.json in THIS repo)
        ↓
     JASVERSE.COM
```

`JasVerse-Labs/JasVerse-Operations` is internal canonical truth — project
registries, capability catalogs, environment details, evidence. This
repository (`JasVerseAppSite`) is a **public projection**, not a mirror.

## What this site's browser code is NOT allowed to do

- **Never** fetch `JasVerse-Operations` (or any private repository)
  directly from client-side JavaScript.
- **Never** embed a GitHub token, API key, or any credential in any file
  served to a browser.
- **Never** render a raw internal registry YAML/JSON file on a public page.

## What this site's browser code DOES do

It fetches only `data/public-*.json` files that live in **this**
repository, are committed by a human/AI decision (not generated live from
a private source at request time), and pass
`scripts/validate-public-data.mjs` before merge (Part 16's
`PUBLICATION_FIREWALL` CI gate).

## How a public JSON file gets updated today (current state, honestly)

```
CROSS_REPO_AUTO_SYNC = NOT_IMPLEMENTED
```

There is currently **no automatic pipeline** that takes a JasVerse-Operations
change and regenerates this repository's `data/public-*.json` files. Every
public JSON file in this repository today was written by an AI/human who
read the relevant Operations evidence directly and manually transcribed
only the allowlisted, public-safe fields — this is a real, working
publication gate exercised by hand, not a placeholder.

**Why not automated yet:** implementing a safe cross-repository sync would
require either (a) a GitHub Actions `repository_dispatch`/workflow-call
from `JasVerse-Operations` into `JasVerseAppSite` (needs a fine-grained PAT
or GitHub App installation with write access scoped to this repo only), or
(b) a scheduled pull from `JasVerseAppSite`'s own CI reading
`JasVerse-Operations`'s public files via the GitHub API (needs at least
read access to a private repository, which is not nothing to grant). Per
this activation's own instruction ("document one bounded auth gap rather
than inventing fake automation"), this gap is recorded here rather than
faked. See `runtime/PUBLICATION_REGISTRY.yaml` in `JasVerse-Operations` for
the structured tracking of what's safe to publish going forward — the
automation described above is future work, not built in this activation.

## The Publication Registry

`JasVerse-Operations`'s `runtime/PUBLICATION_REGISTRY.yaml` is where every
JasVerse asset's public-visibility DECISION lives — separate from whether
it's technically capable of being public. **Default is always `PRIVATE`.**
An internal project reaching `ACTIVE` does not automatically make it
public; a human/AI must explicitly decide `PUBLIC` or `PUBLIC_SUMMARY_ONLY`
and record why.

## Allowlisted public JSON schema (enforced by scripts/validate-public-data.mjs)

See that script for the authoritative, machine-checked list. Summary: an
`id`, a `name`, a `status` from a fixed enum, a `summary` string, an
optional `public_url` (must be `https://`), an optional `surfaces` object
(web/pwa/android/ios/windows/linux/macos, each from a fixed enum), and
`last_verified` (a date). Any other field is rejected by the validator —
this is defense-in-depth against ever accidentally publishing a secret,
token, account ID, database ID, worker ID, private repo path, or internal
note.
