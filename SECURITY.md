# Security

## Current model

WellSet is a local, single-page demonstration. It has no backend, authentication, uploads, analytics, cookies, or external data access. Experiment state exists only in the current page session.

The page exposes three WebMCP tools. Tool definitions and results should be treated as untrusted website content by an agent. WellSet keeps inputs closed, performs its own validation, and reports mutations through compact verification receipts. The read-only inspect tool returns the complete current state when independent inspection is needed.

## Reporting

Please report a suspected vulnerability privately to `hello@kinhikar.com`. Do not include sensitive experimental data; the public demo is not intended for real clinical or production laboratory use.
