---
doc_schema: "doc-frontmatter-v1"
doc_id: "lbot/research/ACCESS_NOTES"
doc_type: "research_note"
doc_status: "active"
title: "LinkedIn Access Notes"
description: "Practical notes on lbot scope and access boundaries."
memory_eligible: false
memory_priority: "low"
doc_tags:
  - "domain:social-media"
  - "tool:lbot"
  - "platform:linkedin"
  - "type:research_note"
---
# LinkedIn Access Notes

`lbot` should assume a stricter surface than `xbot`.

## Working model

- posting is the primary official automation path
- identity inspection is practical if the token includes `openid profile`
- general feed-reading is not the baseline assumption

## Repo stance

- optimize first for a stable personal-posting workflow
- add organization posting only after the member path is verified
- do not build broad scraping or browser automation unless the official path proves insufficient

## Near-term extension ideas

- document/carousel support
- organization/page posting helper
- local callback server for OAuth code capture
