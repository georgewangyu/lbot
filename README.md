---
doc_schema: "doc-frontmatter-v1"
doc_id: "lbot/README"
doc_type: "readme"
doc_status: "active"
title: "lbot — LinkedIn Automation Client"
description: "Official LinkedIn posting CLI for auth bootstrap, text posts, and single-image posts."
memory_eligible: false
memory_priority: "low"
doc_tags:
  - "domain:social-media"
  - "tool:lbot"
  - "type:readme"
---
# lbot — LinkedIn Automation Client

Minimal LinkedIn automation client for official API posting.
Modeled after `xbot`, but the access model is different:

- LinkedIn publishing uses the official OAuth + Posts API path
- the write API is available, but app setup and scopes are stricter than X
- member reading is limited; this repo starts with identity inspection plus write flows

## Architecture

```text
lbot/
├── src/
│   ├── cli.js            # Unified CLI (auth bootstrap + posting)
│   ├── client.js         # LinkedIn REST client
│   ├── credentials.js    # Shared credential loader (.env + private token file)
│   └── oauth.js          # Authorization URL + code exchange helpers
├── setup/
│   └── OFFICIAL_API_SETUP.md  # Durable setup note for LinkedIn app + OAuth
├── research/
│   └── ACCESS_NOTES.md   # Practical notes on read/write constraints
├── README.md
└── .env.example
```

## Installation

```bash
npm install
```

## Credentials

Set these in `georgerepo/.tokens/linkedin.env` or `lbot/.env`:

```env
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://127.0.0.1:8787/callback
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_PERSON_URN=urn:li:person:...
LINKEDIN_ORGANIZATION_URN=urn:li:organization:...
LINKEDIN_API_VERSION=202601
```

Notes:

- `w_member_social` lives under LinkedIn's self-serve `Share on LinkedIn` product, so personal posting is the right first setup target
- `LINKEDIN_PERSON_URN` is optional if the token also has `openid profile`; `lbot me` can derive it from `/v2/userinfo`
- `LINKEDIN_ORGANIZATION_URN` is only needed for page/org posting
- org/community-management access is the more approval-heavy part; this repo treats member posting as the primary stable path

## Usage

Generate an auth URL:

```bash
node src/cli.js auth-url
```

Exchange the authorization code:

```bash
node src/cli.js exchange-code '<code-from-callback>'
```

Inspect the authenticated member:

```bash
node src/cli.js me
```

Post as your personal profile:

```bash
node src/cli.js post "hello from lbot"
```

Post with a single image:

```bash
node src/cli.js post --image /absolute/path/to/image.png --alt-text "Screenshot of the workflow" "hello from lbot"
```

Post as an organization:

```bash
node src/cli.js post --organization "hello from the company page"
```

Show resolved config state:

```bash
node src/cli.js env
```

## What Works Today

- build OAuth authorization URLs
- exchange auth codes for access tokens
- inspect token-backed identity through `/v2/userinfo`
- publish text posts through the official Posts API
- upload a single image through the official Images API and attach it to a post

## What Is Intentionally Missing

- browser automation fallback
- document upload flows
- generic feed-reading commands like `xbot home`

Those are possible later, but LinkedIn’s access model is much tighter than X and not all read surfaces are broadly available.

## Setup Notes

- `setup/OFFICIAL_API_SETUP.md` — exact app, OAuth, scope, and posting setup
- `research/ACCESS_NOTES.md` — practical notes on LinkedIn’s read/write boundaries
