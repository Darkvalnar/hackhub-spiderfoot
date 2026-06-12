import {
    Network,
    Twotter,
    type DynamicWebsitePageDefinition,
    type WebsitePageDefinition,
} from "@hotbunny/hackhub-content-sdk";

import {
    DEFAULT_SPIDERFOOT_VISIBILITY,
    type SpiderFootCategory,
    type SpiderFootVisibility,
    resolveSpiderFootNetworkVisibility,
    normalizeSpiderFootVisibility,
} from "./SpiderFootNetworkRegistry";

// Mod authors: import your own website classes here and add them to WEBSITE_CLASSES below.

export type { SpiderFootCategory, SpiderFootVisibility };

export interface SpiderFootResult {
    category: SpiderFootCategory;
    value: string;
}

/**
 * Represents a site that SpiderFoot can index directly (without a full website class).
 * Add entries here to make targets searchable without creating a full website.
 * Each entry surfaces name, summary, owner, sector, host, and optionally abuse@host.
 */
export interface SpiderFootSiteEntry {
    host: string;
    name: string;
    summary?: string;
    owner?: string;
    sector?: string;
    capabilities?: string[];
    subdomains?: string[];
    spiderfoot?: SpiderFootVisibility;
}

/**
 * Mod authors: add entries here to make targets searchable without a full website class.
 */
export const SPIDERFOOT_INDEXED_SITES: SpiderFootSiteEntry[] = [];

interface SpiderFootWebDocument {
    host: string;
    path: string;
    title: string;
    description?: string;
    search?: string[];
    html: string;
    visibility: Required<SpiderFootVisibility>;
}

function pageMetadata(
    host: string,
    page: WebsitePageDefinition | DynamicWebsitePageDefinition | any,
): {
    path: string;
    title: string;
    description?: string;
    search?: string[];
    html: string;
} | undefined {
    if (typeof page?.html === "string") {
        return {
            path: String(page.path ?? "/"),
            title: String(page.title ?? host),
            description: String(page.description ?? ""),
            search: Array.isArray(page.search) ? page.search.map(String) : [],
            html: page.html,
        };
    }

    if (typeof page?.metadata !== "function") {
        return undefined;
    }

    const path = String(page.path ?? "/");
    const metadata = page.metadata({
        url: `https://${host}${path}`,
        params: {},
        query: {},
        searchStr: "",
    });

    if (!metadata || typeof metadata.html !== "string") {
        return undefined;
    }

    return {
        path,
        title: String(metadata.title ?? host),
        description: String(metadata.description ?? ""),
        search: Array.isArray(metadata.search) ? metadata.search.map(String) : [],
        html: metadata.html,
    };
}

type WebsiteConstructor = new () => {
    Host: string;
    Pages: any[];
};

/**
 * Mod authors: import your website class and add it to this list.
 * Only pages with seo: true are indexed by SpiderFoot.
 */
const WEBSITE_CLASSES: WebsiteConstructor[] = [];

function normalize(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

function compact(values: Array<string | undefined | null>): string[] {
    return values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);
}

function unique(values: string[]): string[] {
    const seen = new Set<string>();
    const output: string[] = [];

    for (const value of values) {
        const clean = value.trim();
        const key = clean.toLowerCase();

        if (!clean || seen.has(key)) {
            continue;
        }

        seen.add(key);
        output.push(clean);
    }

    return output;
}

function push(
    results: SpiderFootResult[],
    category: SpiderFootCategory,
    value?: string | null,
): void {
    const clean = String(value ?? "").trim();

    if (!clean) {
        return;
    }

    results.push({
        category,
        value: clean,
    });
}

function uniqueResults(results: SpiderFootResult[]): SpiderFootResult[] {
    const seen = new Set<string>();

    return results.filter((result) => {
        const key = `${result.category}:${normalize(result.value)}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function isIp(value: string): boolean {
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value.trim());
}

function isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function emailDomain(email: string): string | undefined {
    const parts = email.split("@");
    return parts.length === 2 ? parts[1].toLowerCase() : undefined;
}

function stripHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function extractEmails(text: string): string[] {
    return unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []);
}

function extractHandles(text: string): string[] {
    return unique(text.match(/@[a-z0-9_]{3,32}/gi) ?? []);
}

function extractContextWindows(text: string, query: string, radius = 260): string[] {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const windows: string[] = [];

    if (!lowerQuery) {
        return windows;
    }

    let index = lowerText.indexOf(lowerQuery);

    while (index >= 0) {
        const start = Math.max(0, index - radius);
        const end = Math.min(text.length, index + query.length + radius);
        windows.push(text.slice(start, end));

        index = lowerText.indexOf(lowerQuery, index + lowerQuery.length);
    }

    return windows;
}

function extractSnippet(text: string, query: string): string | undefined {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const index = cleanText.toLowerCase().indexOf(query.toLowerCase());

    if (index < 0) {
        return undefined;
    }

    const start = Math.max(0, index - 80);
    const end = Math.min(cleanText.length, index + query.length + 140);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < cleanText.length ? "..." : "";

    return `${prefix}${cleanText.slice(start, end)}${suffix}`;
}

function extractLocationCandidates(text: string): string[] {
    const candidates: string[] = [];

    const patterns = [
        /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3},\s(?:United States|Germany|Netherlands|United Kingdom|Canada|France|Japan|Singapore|In-Game)\b/g,
        /\b\d{1,5}\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,4}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Plaza|Square)\b(?:,\s[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})?/g,
        /\b(?:Fiction City|Port Azure|San Francisco|Amsterdam|Tokyo|Singapore)\b/g,
    ];

    for (const pattern of patterns) {
        candidates.push(...(text.match(pattern) ?? []));
    }

    return unique(candidates);
}

function usernameCandidates(value: string): string[] {
    const clean = normalize(value).replace(/^@/, "");

    return unique([
        clean,
        clean.replace(/[\s.-]+/g, "_"),
        clean.replace(/[\s._-]+/g, ""),
    ]);
}

function twotterDisplayName(user: any): string {
    return compact([
        user.name ?? user.firstName,
        user.surname ?? user.lastName,
    ]).join(" ");
}

function siteVisibility(site?: SpiderFootSiteEntry): Required<SpiderFootVisibility> {
    if (!site) {
        return DEFAULT_SPIDERFOOT_VISIBILITY;
    }

    return normalizeSpiderFootVisibility(site.spiderfoot);
}

function findIndexedSiteByHost(host: string): SpiderFootSiteEntry | undefined {
    const normalized = normalize(host);

    return SPIDERFOOT_INDEXED_SITES.find((site) => {
        if (normalize(site.host) === normalized) {
            return true;
        }

        return (site.subdomains ?? []).some((subdomain) => normalize(subdomain) === normalized);
    });
}

function searchTwotter(query: string): SpiderFootResult[] {
    const results: SpiderFootResult[] = [];
    const checked = new Set<string>();

    for (const username of usernameCandidates(query)) {
        if (!username || checked.has(username)) {
            continue;
        }

        checked.add(username);

        const user = Twotter.getUserByUsername(username);

        if (!user) {
            continue;
        }

        const anyUser = user as any;
        const displayName = twotterDisplayName(anyUser);

        push(results, "social", `@${anyUser.username}`);
        push(results, "contacts", displayName);
        push(results, "references", anyUser.bio);

        if (anyUser.verified) {
            push(results, "references", "Verified public profile");
        }
    }

    return results;
}

function getAllowedWebsiteDocuments(): SpiderFootWebDocument[] {
    const documents: SpiderFootWebDocument[] = [];

    for (const WebsiteClass of WEBSITE_CLASSES) {
        const site = new WebsiteClass();
        const sourceSite = findIndexedSiteByHost(site.Host);
        const visibility = siteVisibility(sourceSite);

        if (!visibility.surface) {
            continue;
        }

        for (const page of site.Pages ?? []) {
            const anyPage = page as any;

            if (anyPage.seo !== true) {
                continue;
            }

            const metadata = pageMetadata(site.Host, anyPage);

            if (!metadata) {
                continue;
            }

            documents.push({
                host: site.Host,
                path: metadata.path,
                title: metadata.title,
                description: metadata.description,
                search: metadata.search,
                html: metadata.html,
                visibility,
            });
        }
    }

    for (const site of SPIDERFOOT_INDEXED_SITES) {
        const visibility = siteVisibility(site);

        if (!visibility.surface) {
            continue;
        }

        const html = [
            site.name,
            site.summary,
            site.owner,
            site.sector,
            site.host,
            visibility.surfaceEmails ? `abuse@${site.host}` : "",
        ].join(" ");

        documents.push({
            host: site.host,
            path: "/",
            title: site.name,
            description: site.summary,
            search: [
                site.name,
                site.owner,
                site.sector,
                site.host,
                ...(site.capabilities ?? []),
            ],
            html,
            visibility,
        });
    }

    return documents;
}

function searchWebDocuments(query: string): SpiderFootResult[] {
    const results: SpiderFootResult[] = [];
    const search = normalize(query);
    const documents = getAllowedWebsiteDocuments();

    for (const document of documents) {
        const visibility = document.visibility;

        if (!visibility.surface) {
            continue;
        }

        const text = stripHtml(document.html);
        const url = `https://${document.host}${document.path}`;
        const searchableText = compact([
            document.host,
            document.path,
            document.title,
            document.description,
            ...(document.search ?? []),
            text,
        ]).join(" ");

        if (!normalize(searchableText).includes(search)) {
            continue;
        }

        if (visibility.surfaceReferences) {
            push(results, "references", `${url} — ${document.title}`);

            const snippet = extractSnippet(
                compact([
                    document.title,
                    document.description,
                    text,
                ]).join(" "),
                query,
            );

            if (snippet) {
                push(results, "references", snippet);
            }
        }

        const contextWindows = extractContextWindows(searchableText, query);

        for (const window of contextWindows) {
            if (visibility.surfaceEmails || visibility.surfaceContacts) {
                for (const email of extractEmails(window)) {
                    push(results, "contacts", email);
                }
            }

            if (visibility.surfaceSocial) {
                for (const handle of extractHandles(window)) {
                    push(results, "social", handle);

                    for (const socialResult of searchTwotter(handle)) {
                        push(results, socialResult.category, socialResult.value);
                    }
                }
            }

            if (visibility.surfaceLocations) {
                for (const location of extractLocationCandidates(window)) {
                    push(results, "locations", location);
                }
            }
        }

        if (isEmail(query) && (visibility.surfaceEmails || visibility.surfaceContacts)) {
            for (const email of extractEmails(searchableText)) {
                if (normalize(email) === search) {
                    push(results, "contacts", email);

                    if (visibility.surfaceInfrastructure && visibility.surfaceDomains) {
                        push(results, "infrastructure", emailDomain(email));
                    }
                }
            }
        }
    }

    return results;
}

function searchNetworkExact(query: string): SpiderFootResult[] {
    const results: SpiderFootResult[] = [];
    const search = normalize(query);
    const exactIp = isIp(query);
    const exactEmail = isEmail(query);

    if (!exactIp && !exactEmail && !search) {
        return results;
    }

    for (const subnet of Network.getAllSubnets()) {
        const anySubnet = subnet as any;
        const domain = anySubnet.domain?.name;
        const name = anySubnet.name;
        const visibility = resolveSpiderFootNetworkVisibility({
            ip: anySubnet.ip,
            domain,
            name,
        });

        if (!visibility?.surface) {
            continue;
        }

        const subnetMatchesIp = exactIp && normalize(anySubnet.ip) === search;
        const subnetMatchesDomain = Boolean(domain) && normalize(domain) === search;
        const subnetMatchesName = Boolean(name) && normalize(name) === search;
        const subnetMatches = subnetMatchesIp || subnetMatchesDomain || subnetMatchesName;

        if (subnetMatches) {
            if (visibility.surfaceInfrastructure && visibility.surfaceIps) {
                push(results, "infrastructure", anySubnet.ip);
            }

            if (visibility.surfaceInfrastructure && visibility.surfaceDomains && domain) {
                push(results, "infrastructure", domain);
            }

            if (visibility.surfaceLocations) {
                const location = compact([
                    anySubnet.location?.city,
                    anySubnet.location?.country,
                ]).join(", ");

                push(results, "locations", location);
            }

            if (visibility.surfaceReferences && domain) {
                push(results, "references", `Network record associated with ${domain}`);
            } else if (visibility.surfaceReferences && name) {
                push(results, "references", `Network record associated with ${name}`);
            }
        }

        for (const user of anySubnet.users ?? []) {
            const anyUser = user as any;
            const email = anyUser.email?.address;
            const emailMatches = exactEmail && normalize(email) === search;

            if (!emailMatches && !subnetMatches) {
                continue;
            }

            const fullName = compact([
                anyUser.firstName,
                anyUser.lastName,
            ]).join(" ");

            if (visibility.surfaceNetworkUsers && visibility.surfaceContacts) {
                push(results, "contacts", fullName);
            }

            if (visibility.surfaceEmails) {
                push(results, "contacts", email);
            }

            if (visibility.surfaceSocial && fullName) {
                for (const socialResult of searchTwotter(fullName)) {
                    push(results, socialResult.category, socialResult.value);
                }
            }

            if (visibility.surfaceInfrastructure && visibility.surfaceIps) {
                push(results, "infrastructure", anySubnet.ip);
            }

            if (visibility.surfaceInfrastructure && visibility.surfaceDomains && domain) {
                push(results, "infrastructure", domain);
            }

            if (visibility.surfaceReferences && domain && (fullName || anyUser.username || email)) {
                push(results, "references", `${fullName || anyUser.username || email} is listed on ${domain}`);
            }
        }
    }

    return results;
}

export function searchSpiderFoot(query: string): SpiderFootResult[] {
    const clean = normalize(query);

    if (!clean) {
        return [];
    }

    return uniqueResults([
        ...searchTwotter(clean),
        ...searchWebDocuments(clean),
        ...searchNetworkExact(clean),
    ]);
}
