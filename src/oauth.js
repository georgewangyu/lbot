import { randomBytes } from 'crypto';

const AUTH_BASE_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const DEFAULT_SCOPES = ['openid', 'profile', 'email', 'w_member_social'];

export function buildAuthorizationUrl({
    clientId,
    redirectUri,
    scopes = DEFAULT_SCOPES,
    state = randomBytes(12).toString('hex'),
}) {
    const url = new URL(AUTH_BASE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('state', state);
    return { url: url.toString(), state };
}

export async function exchangeCodeForToken({
    clientId,
    clientSecret,
    redirectUri,
    code,
}) {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
    });

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });

    const text = await response.text();
    let payload;
    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        payload = { raw: text };
    }

    if (!response.ok) {
        throw new Error(`LinkedIn token exchange failed (${response.status}): ${JSON.stringify(payload)}`);
    }

    return payload;
}
