#!/usr/bin/env node

import { Command } from 'commander';
import { LinkedInClient } from './client.js';
import { getEnv, loadApiConfig, loadOAuthConfig, requireEnv } from './credentials.js';
import { buildAuthorizationUrl, exchangeCodeForToken } from './oauth.js';

const program = new Command();

program
    .name('lbot')
    .description('LinkedIn CLI for auth bootstrap and official post publishing')
    .version('1.0.0');

program
    .command('auth-url')
    .description('Generate a LinkedIn OAuth authorization URL')
    .option('--redirect-uri <uri>', 'Override redirect URI')
    .option('--scope <scopes>', 'Space-separated scopes', 'openid profile email w_member_social')
    .option('--state <value>', 'Explicit OAuth state value')
    .action((options) => {
        try {
            const oauth = loadOAuthConfig({ redirectUri: options.redirectUri });
            requireEnv(['LINKEDIN_CLIENT_ID']);

            const { url, state } = buildAuthorizationUrl({
                clientId: oauth.clientId,
                redirectUri: oauth.redirectUri,
                scopes: options.scope.trim().split(/\s+/),
                state: options.state,
            });

            console.log(`State: ${state}`);
            console.log(url);
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('exchange-code <code>')
    .description('Exchange a LinkedIn OAuth authorization code for an access token')
    .option('--redirect-uri <uri>', 'Override redirect URI')
    .action(async (code, options) => {
        try {
            requireEnv(['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET']);
            const oauth = loadOAuthConfig({ redirectUri: options.redirectUri });
            const token = await exchangeCodeForToken({
                clientId: oauth.clientId,
                clientSecret: oauth.clientSecret,
                redirectUri: oauth.redirectUri,
                code,
            });

            console.log(JSON.stringify(token, null, 2));
            if (token.access_token) {
                console.log('\nSuggested env additions:');
                console.log(`LINKEDIN_ACCESS_TOKEN=${token.access_token}`);
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('me')
    .description('Inspect token-backed member identity via /v2/userinfo')
    .action(async () => {
        try {
            const client = new LinkedInClient();
            const userInfo = await client.getUserInfo();
            console.log(JSON.stringify(userInfo, null, 2));
            if (userInfo?.sub) {
                console.log(`\nDerived member author URN: urn:li:person:${userInfo.sub}`);
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('post <text>')
    .description('Publish a text post via the official LinkedIn Posts API')
    .option('--author <urn>', 'Explicit author URN, defaults to LINKEDIN_PERSON_URN or /v2/userinfo')
    .option('--organization', 'Post as LINKEDIN_ORGANIZATION_URN instead of the member URN')
    .option('--visibility <value>', 'Visibility enum', 'PUBLIC')
    .action(async (text, options) => {
        try {
            const client = new LinkedInClient();
            const api = loadApiConfig();

            let author = options.author || api.personUrn;
            if (options.organization) {
                author = api.organizationUrn;
                if (!author) {
                    throw new Error('Missing credentials: LINKEDIN_ORGANIZATION_URN');
                }
            }

            if (!author) {
                author = await client.getResolvedAuthorUrn();
            }

            const result = await client.createTextPost({
                author,
                commentary: text,
                visibility: options.visibility,
            });

            console.log(`Posted successfully. Author: ${author}`);
            if (result.id) {
                console.log(`Post ID: ${result.id}`);
            }
            if (result.data) {
                console.log(JSON.stringify(result.data, null, 2));
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('env')
    .description('Show the currently resolved non-secret configuration')
    .action(() => {
        const api = loadApiConfig();
        console.log(JSON.stringify({
            apiVersion: api.apiVersion,
            personUrn: api.personUrn || null,
            organizationUrn: api.organizationUrn || null,
            redirectUri: getEnv('LINKEDIN_REDIRECT_URI') || 'http://127.0.0.1:8787/callback',
            hasClientId: Boolean(getEnv('LINKEDIN_CLIENT_ID')),
            hasClientSecret: Boolean(getEnv('LINKEDIN_CLIENT_SECRET')),
            hasAccessToken: Boolean(getEnv('LINKEDIN_ACCESS_TOKEN')),
        }, null, 2));
    });

program.parse();
