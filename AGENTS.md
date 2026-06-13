# LBot Agent Instructions

## Mission

`lbot` is a LinkedIn operator client for official OAuth setup, identity checks,
and posting. Keep the repo tightly scoped around the surfaces LinkedIn actually
permits.

## Working Rules

1. Treat official OAuth and posting as the primary product surface.
2. Keep member and organization posting paths explicit.
3. Do not imply broad feed-reading or consumer-social automation features that
   LinkedIn does not reliably expose.

## Validation

```bash
npm run env
npm test
```
