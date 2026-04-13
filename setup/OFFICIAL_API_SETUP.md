---
doc_schema: "doc-frontmatter-v1"
doc_id: "lbot/setup/OFFICIAL_API_SETUP"
doc_type: "setup_note"
doc_status: "active"
title: "Official API Setup"
description: "Durable setup notes for connecting lbot to LinkedIn OAuth and the Posts API."
memory_eligible: false
memory_priority: "low"
doc_tags:
  - "domain:social-media"
  - "tool:lbot"
  - "platform:linkedin"
  - "type:setup_note"
---
# Official API Setup

This note captures the intended setup flow for `lbot`.

The core distinction from `xbot`:

- there is an official LinkedIn write API for posts
- getting access is more bureaucratic than X
- broad feed-reading is not the right assumption

## Required Credentials

`lbot` uses these environment variables:

```env
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://127.0.0.1:8787/callback
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_PERSON_URN=urn:li:person:...
LINKEDIN_ORGANIZATION_URN=urn:li:organization:...
LINKEDIN_API_VERSION=202601
```

Credential mapping:

- App `Client ID` -> `LINKEDIN_CLIENT_ID`
- App `Client Secret` -> `LINKEDIN_CLIENT_SECRET`
- OAuth access token -> `LINKEDIN_ACCESS_TOKEN`
- Member URN -> `LINKEDIN_PERSON_URN`
- Organization/Page URN -> `LINKEDIN_ORGANIZATION_URN`

## Where To Put Them

Supported locations:

- `georgerepo/.tokens/linkedin.env`
- `lbot/.env`

## Console Setup Flow

### 1. Create a LinkedIn app

Go to:

- `https://www.linkedin.com/developers/apps`

Create a new app tied to the LinkedIn account that should manage this integration.

### 2. Configure auth

In the app settings:

- add an OAuth redirect URL
- for local work, use a loopback redirect like `http://127.0.0.1:8787/callback`
- copy the app `Client ID` and `Client Secret`

### 3. Request the right product / scope access

For the personal-profile posting path, the minimum useful scope set is:

- `openid`
- `profile`
- `email`
- `w_member_social`

Why:

- `w_member_social` is the write permission for member posting
- `openid profile` lets `lbot me` derive the member URN through `/v2/userinfo`

Practical note:

- `w_member_social` is exposed through LinkedIn's self-serve `Share on LinkedIn` product, so you should start there
- broader organization and community-management access is where the approval burden gets heavier

For organization/page posting, you will also need organization-level posting access and admin rights for that page.

### 4. Generate the auth URL

From the repo root:

```bash
node src/cli.js auth-url
```

Open the printed URL in a browser, approve the app, then capture the `code` parameter from the callback URL.

### 5. Exchange the authorization code

```bash
node src/cli.js exchange-code '<code>'
```

Store the returned access token in `LINKEDIN_ACCESS_TOKEN`.

### 6. Verify the token and derive the author URN

```bash
node src/cli.js me
```

If the token has the right scopes, this should print the `/v2/userinfo` payload and a derived value like:

```text
urn:li:person:...
```

Add that as `LINKEDIN_PERSON_URN` if you want deterministic posting without discovery.

### 7. Publish a test post

```bash
node src/cli.js post "hello from lbot"
```

## Verification Checklist

- `auth-url` prints a valid LinkedIn consent URL
- `exchange-code` returns an access token
- `me` returns the authenticated member identity
- `post` creates a text post through `/rest/posts`

## Likely Failure Modes

### Missing app credentials

You will see:

```text
Missing credentials: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
```

Meaning the app keys are not loaded from `.env` or `georgerepo/.tokens/linkedin.env`.

### Missing member-write scope

LinkedIn will reject the post request if the token lacks `w_member_social`.

### Token works for identity but post still fails

That usually means:

- the app does not have the right product approval
- the token was minted with insufficient scopes
- you are trying to post as an organization without the organization-level permission/admin binding

### Cannot derive `LINKEDIN_PERSON_URN`

If `/v2/userinfo` does not provide a usable `sub`, set `LINKEDIN_PERSON_URN` manually from the developer tools or your own verified API response.

## Current Practical Recommendation

Start with:

1. personal-profile posting
2. text-only posts
3. explicit local env storage in `georgerepo/.tokens/linkedin.env`

Do not start with image posts or org posting unless the plain member-write path is already verified.
