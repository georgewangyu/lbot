# LBot Vision

`lbot` should be a dependable LinkedIn operator client for official OAuth
setup, identity inspection, and posting.

## Product Thesis

LinkedIn is useful as a professional publishing surface, but its API access is
tighter than consumer social platforms. This repo should make the allowed path
legible instead of pretending broad feed automation or unofficial behavior is
the product.

## Goals

- Keep member posting reliable through the official OAuth and Posts API path.
- Make organization posting requirements explicit.
- Preserve a small CLI that agents can operate without hidden glue.
- Keep setup notes honest about scopes, product access, and failure modes.

## Non-Goals

- Do not imply broad LinkedIn feed-reading support.
- Do not add browser automation fallback unless there is a deliberate approval
  gate.
- Do not turn the repo into a generic social scheduler.
