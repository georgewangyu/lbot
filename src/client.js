import { readFile } from 'fs/promises';
import { extname } from 'path';
import { loadApiConfig } from './credentials.js';

const API_BASE_URL = 'https://api.linkedin.com';
const IMAGE_MIME_TYPES = new Map([
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'],
    ['.gif', 'image/gif'],
]);

export class LinkedInClient {
    constructor(config = {}) {
        const defaults = loadApiConfig();
        this.accessToken = config.accessToken || defaults.accessToken;
        this.apiVersion = config.apiVersion || defaults.apiVersion || '202601';
    }

    async request(method, path, { body, headers = {}, raw = false } = {}) {
        if (!this.accessToken) {
            throw new Error('Missing credentials: LINKEDIN_ACCESS_TOKEN');
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'LinkedIn-Version': this.apiVersion,
                'X-Restli-Protocol-Version': '2.0.0',
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const text = await response.text();
        let payload = null;
        if (text) {
            try {
                payload = JSON.parse(text);
            } catch {
                payload = text;
            }
        }

        if (!response.ok) {
            throw new Error(`LinkedIn API ${method} ${path} failed (${response.status}): ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`);
        }

        if (raw) {
            return { headers: response.headers, body: payload };
        }

        return payload;
    }

    async uploadBinary(uploadUrl, { filePath, contentType }) {
        if (!this.accessToken) {
            throw new Error('Missing credentials: LINKEDIN_ACCESS_TOKEN');
        }

        const fileBuffer = await readFile(filePath);
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                ...(contentType ? { 'Content-Type': contentType } : {}),
            },
            body: fileBuffer,
        });

        const text = await response.text();
        if (!response.ok) {
            throw new Error(`LinkedIn image upload failed (${response.status}): ${text || '<empty response>'}`);
        }
    }

    async getUserInfo() {
        return this.request('GET', '/v2/userinfo');
    }

    async getResolvedAuthorUrn(explicitAuthor) {
        if (explicitAuthor) return explicitAuthor;

        const userInfo = await this.getUserInfo();
        if (!userInfo?.sub) {
            throw new Error('Could not derive LINKEDIN_PERSON_URN from /v2/userinfo. Set LINKEDIN_PERSON_URN explicitly.');
        }

        return `urn:li:person:${userInfo.sub}`;
    }

    async createTextPost({ author, commentary, visibility = 'PUBLIC' }) {
        const response = await this.request('POST', '/rest/posts', {
            body: {
                author,
                commentary,
                visibility,
                distribution: {
                    feedDistribution: 'MAIN_FEED',
                    targetEntities: [],
                    thirdPartyDistributionChannels: [],
                },
                lifecycleState: 'PUBLISHED',
                isReshareDisabledByAuthor: false,
            },
            raw: true,
        });

        return {
            id: response.headers.get('x-restli-id') || null,
            data: response.body,
        };
    }

    async initializeImageUpload({ owner }) {
        return this.request('POST', '/rest/images?action=initializeUpload', {
            body: {
                initializeUploadRequest: {
                    owner,
                },
            },
        });
    }

    async uploadImage({ owner, filePath }) {
        const extension = extname(filePath).toLowerCase();
        const contentType = IMAGE_MIME_TYPES.get(extension);
        if (!contentType) {
            throw new Error(`Unsupported image type for LinkedIn upload: ${extension || '<none>'}. Supported: .jpg, .jpeg, .png, .gif`);
        }

        const initialized = await this.initializeImageUpload({ owner });
        const uploadUrl = initialized?.value?.uploadUrl;
        const imageUrn = initialized?.value?.image;
        if (!uploadUrl || !imageUrn) {
            throw new Error(`LinkedIn image initializeUpload returned an unexpected payload: ${JSON.stringify(initialized)}`);
        }

        await this.uploadBinary(uploadUrl, { filePath, contentType });
        return {
            imageUrn,
        };
    }

    async createImagePost({ author, commentary, imageUrn, altText, visibility = 'PUBLIC' }) {
        const response = await this.request('POST', '/rest/posts', {
            body: {
                author,
                commentary,
                visibility,
                distribution: {
                    feedDistribution: 'MAIN_FEED',
                    targetEntities: [],
                    thirdPartyDistributionChannels: [],
                },
                content: {
                    media: {
                        ...(altText ? { altText } : {}),
                        id: imageUrn,
                    },
                },
                lifecycleState: 'PUBLISHED',
                isReshareDisabledByAuthor: false,
            },
            raw: true,
        });

        return {
            id: response.headers.get('x-restli-id') || null,
            data: response.body,
        };
    }
}
