import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

function loadEnvFile(filePath) {
    if (!existsSync(filePath)) return {};

    const loaded = {};
    const lines = readFileSync(filePath, 'utf8').split('\n');
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || !line.includes('=')) continue;

        const [key, ...rest] = line.split('=');
        let value = rest.join('=').trim();
        if (value.length >= 2 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'")) {
            value = value.slice(1, -1);
        }
        loaded[key.trim()] = value;
    }
    return loaded;
}

let fileVars = null;

function getFileVars() {
    if (fileVars) return fileVars;

    const dir = fileURLToPath(new URL('.', import.meta.url));
    const localEnv = resolve(dir, '..', '.env');
    const privateEnv = resolve(homedir(), 'Documents/Workspace/georgerepo/.tokens/linkedin.env');

    fileVars = { ...loadEnvFile(privateEnv), ...loadEnvFile(localEnv) };
    return fileVars;
}

export function getEnv(key) {
    return process.env[key] || getFileVars()[key] || '';
}

export function requireEnv(keys) {
    const missing = keys.filter((key) => !getEnv(key));
    if (missing.length) {
        throw new Error(`Missing credentials: ${missing.join(', ')}`);
    }
}

export function loadOAuthConfig(overrides = {}) {
    return {
        clientId: overrides.clientId || getEnv('LINKEDIN_CLIENT_ID'),
        clientSecret: overrides.clientSecret || getEnv('LINKEDIN_CLIENT_SECRET'),
        redirectUri: overrides.redirectUri || getEnv('LINKEDIN_REDIRECT_URI') || 'http://127.0.0.1:8787/callback',
    };
}

export function loadApiConfig() {
    return {
        accessToken: getEnv('LINKEDIN_ACCESS_TOKEN'),
        personUrn: getEnv('LINKEDIN_PERSON_URN'),
        organizationUrn: getEnv('LINKEDIN_ORGANIZATION_URN'),
        apiVersion: getEnv('LINKEDIN_API_VERSION') || '202601',
    };
}
