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
    findRegisteredSpiderFootNetworkTarget,
    resolveSpiderFootNetworkVisibility,
    normalizeSpiderFootVisibility,
} from "./SpiderFootNetworkRegistry";

export type { SpiderFootCategory, SpiderFootVisibility };

export interface SpiderFootResult {
    category: SpiderFootCategory;
    value: string;
}

export type SpiderFootIntelMatch = "exact" | "contains" | "loose";

export interface SpiderFootIntelRegistration {
    keys: string[];
    results: SpiderFootResult[];
    match?: SpiderFootIntelMatch;
}

interface RegisteredIntelEntry {
    id: string;
    keys: string[];
    match: SpiderFootIntelMatch;
    results: SpiderFootResult[];
}

const MIN_LOOSE_MATCH_LENGTH = 3;

const registeredSpiderFootIntel = new Map<string, RegisteredIntelEntry>();

function toIntelRegistration(
    first: string | SpiderFootIntelRegistration,
    results?: SpiderFootResult[],
): SpiderFootIntelRegistration | undefined {
    if (typeof first === "string") {
        return {
            keys: [first],
            results: results ?? [],
            match: "exact",
        };
    }

    return first;
}

function normalizeIntelKeys(keys: string[]): string[] {
    return unique(compact(keys).map((key) => normalize(key)));
}

function surfaceableIntelResults(results: SpiderFootResult[]): SpiderFootResult[] {
    return uniqueResults(results.filter((result) => result.category !== "references"));
}

export function registerSpiderFootIntel(query: string, results: SpiderFootResult[]): void;
export function registerSpiderFootIntel(registration: SpiderFootIntelRegistration): void;
export function registerSpiderFootIntel(
    first: string | SpiderFootIntelRegistration,
    results?: SpiderFootResult[],
): void {
    const registration = toIntelRegistration(first, results);

    if (!registration) {
        return;
    }

    const keys = normalizeIntelKeys(registration.keys);

    if (!keys.length) {
        return;
    }

    registeredSpiderFootIntel.set(keys[0], {
        id: keys[0],
        keys,
        match: registration.match ?? "exact",
        results: surfaceableIntelResults(registration.results),
    });
}

export function mergeSpiderFootIntel(query: string, results: SpiderFootResult[]): void;
export function mergeSpiderFootIntel(registration: SpiderFootIntelRegistration): void;
export function mergeSpiderFootIntel(
    first: string | SpiderFootIntelRegistration,
    results?: SpiderFootResult[],
): void {
    const registration = toIntelRegistration(first, results);

    if (!registration) {
        return;
    }

    const keys = normalizeIntelKeys(registration.keys);

    if (!keys.length) {
        return;
    }

    const existing = registeredSpiderFootIntel.get(keys[0]);

    registeredSpiderFootIntel.set(keys[0], {
        id: keys[0],
        keys: unique([...(existing?.keys ?? []), ...keys]),
        match: registration.match ?? existing?.match ?? "exact",
        results: surfaceableIntelResults([
            ...(existing?.results ?? []),
            ...registration.results,
        ]),
    });
}

export function unregisterSpiderFootIntel(query: string): void {
    const clean = normalize(query);

    if (!clean) {
        return;
    }

    for (const [id, entry] of registeredSpiderFootIntel) {
        if (id === clean || entry.keys.includes(clean)) {
            registeredSpiderFootIntel.delete(id);
        }
    }
}

function intelEntryMatches(entry: RegisteredIntelEntry, query: string): boolean {
    for (const key of entry.keys) {
        if (key === query) {
            return true;
        }

        if (
            entry.match === "exact" ||
            query.length < MIN_LOOSE_MATCH_LENGTH ||
            key.length < MIN_LOOSE_MATCH_LENGTH
        ) {
            continue;
        }

        if (entry.match === "contains" && query.includes(key)) {
            return true;
        }

        if (entry.match === "loose" && (query.includes(key) || key.includes(query))) {
            return true;
        }
    }

    return false;
}

function searchRegisteredSpiderFootIntel(query: string): SpiderFootResult[] {
    const clean = normalize(query);

    if (!clean) {
        return [];
    }

    const results: SpiderFootResult[] = [];

    for (const entry of registeredSpiderFootIntel.values()) {
        if (intelEntryMatches(entry, clean)) {
            results.push(...entry.results);
        }
    }

    return uniqueResults(results);
}

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

export const SPIDERFOOT_INDEXED_SITES: SpiderFootSiteEntry[] = [];

export function registerSpiderFootSite(entry: SpiderFootSiteEntry): void {
    const host = normalize(entry?.host);

    if (!host) {
        return;
    }

    const index = SPIDERFOOT_INDEXED_SITES.findIndex(
        (site) => normalize(site.host) === host,
    );

    if (index >= 0) {
        SPIDERFOOT_INDEXED_SITES[index] = entry;
        return;
    }

    SPIDERFOOT_INDEXED_SITES.push(entry);
}

export function unregisterSpiderFootSite(host: string): void {
    const clean = normalize(host);

    if (!clean) {
        return;
    }

    for (let index = SPIDERFOOT_INDEXED_SITES.length - 1; index >= 0; index -= 1) {
        if (normalize(SPIDERFOOT_INDEXED_SITES[index].host) === clean) {
            SPIDERFOOT_INDEXED_SITES.splice(index, 1);
        }
    }
}

export type WebsiteConstructor = new () => {
    Host: string;
    Pages: any[];
};

const WEBSITE_CLASSES: WebsiteConstructor[] = [];

export function registerSpiderFootWebsite(WebsiteClass: WebsiteConstructor): void {
    if (typeof WebsiteClass !== "function" || WEBSITE_CLASSES.includes(WebsiteClass)) {
        return;
    }

    WEBSITE_CLASSES.push(WebsiteClass);
}

export function unregisterSpiderFootWebsite(WebsiteClass: WebsiteConstructor): void {
    const index = WEBSITE_CLASSES.indexOf(WebsiteClass);

    if (index >= 0) {
        WEBSITE_CLASSES.splice(index, 1);
    }
}

export interface SpiderFootDocumentRegistration {
    host: string;
    path?: string;
    title: string;
    description?: string;
    search?: string[];
    html: string;
    visibility?: SpiderFootVisibility;
}

const registeredDocuments = new Map<string, SpiderFootDocumentRegistration>();

function documentKey(host: string, path?: string): string {
    return `${normalize(host)}${normalize(path) || "/"}`;
}

export function registerSpiderFootDocument(document: SpiderFootDocumentRegistration): void {
    const host = normalize(document?.host);

    if (!host || typeof document.html !== "string") {
        return;
    }

    registeredDocuments.set(documentKey(host, document.path), document);
}

export function unregisterSpiderFootDocument(host: string, path?: string): void {
    const clean = normalize(host);

    if (!clean) {
        return;
    }

    if (path !== undefined) {
        registeredDocuments.delete(documentKey(clean, path));
        return;
    }

    for (const [key, document] of registeredDocuments) {
        if (normalize(document.host) === clean) {
            registeredDocuments.delete(key);
        }
    }
}

export type SpiderFootSearchHook = (query: string) => void;

const searchHooks: SpiderFootSearchHook[] = [];

export function registerSpiderFootSearchHook(fn: SpiderFootSearchHook): void {
    if (typeof fn !== "function" || searchHooks.includes(fn)) {
        return;
    }

    searchHooks.push(fn);
}

export function unregisterSpiderFootSearchHook(fn: SpiderFootSearchHook): void {
    const index = searchHooks.indexOf(fn);

    if (index >= 0) {
        searchHooks.splice(index, 1);
    }
}

function runSearchHooks(query: string): void {
    for (const hook of searchHooks) {
        try {
            hook(query);
        } catch {
            continue;
        }
    }
}

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
    const handles: string[] = [];

    for (const match of text.matchAll(/@[a-z0-9_]{3,32}/gi)) {
        const index = match.index ?? 0;
        const previous = index > 0 ? text[index - 1] : "";
        const next = text[index + match[0].length] ?? "";

        if (/[\w.%-]/.test(previous) || next === ".") {
            continue;
        }

        handles.push(match[0]);
    }

    return unique(handles);
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
    ensureTwotterInit();
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
    }

    return results;
}

function getAllowedWebsiteDocuments(): SpiderFootWebDocument[] {
    const documents: SpiderFootWebDocument[] = [];

    for (const WebsiteClass of WEBSITE_CLASSES) {
        if (typeof WebsiteClass !== "function") {
            continue;
        }

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
                site.owner ?? "",
                site.sector ?? "",
                site.host,
                ...(site.capabilities ?? []),
            ],
            html,
            visibility,
        });
    }

    for (const document of registeredDocuments.values()) {
        const visibility = document.visibility
            ? normalizeSpiderFootVisibility(document.visibility)
            : siteVisibility(findIndexedSiteByHost(document.host));

        if (!visibility.surface) {
            continue;
        }

        documents.push({
            host: document.host,
            path: document.path || "/",
            title: document.title,
            description: document.description,
            search: document.search ?? [],
            html: document.html,
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
            push(results, "references", `${url} - ${document.title}`);

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

    const registeredTarget =
        findRegisteredSpiderFootNetworkTarget(search);

    if (registeredTarget?.visibility.surface) {
        const visibility = registeredTarget.visibility;

        if (
            visibility.surfaceInfrastructure &&
            visibility.surfaceIps
        ) {
            push(
                results,
                "infrastructure",
                registeredTarget.ip,
            );
        }

        if (
            visibility.surfaceInfrastructure &&
            visibility.surfaceDomains &&
            registeredTarget.domain
        ) {
            push(
                results,
                "infrastructure",
                registeredTarget.domain,
            );
        }
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

        const subnetMatchesIp =
            exactIp && normalize(anySubnet.ip) === search;

        const subnetMatchesDomain =
            Boolean(domain) && normalize(domain) === search;

        const subnetMatchesName =
            Boolean(name) && normalize(name) === search;

        const subnetMatches =
            subnetMatchesIp ||
            subnetMatchesDomain ||
            subnetMatchesName;

        if (subnetMatches) {
            if (
                visibility.surfaceInfrastructure &&
                visibility.surfaceIps
            ) {
                push(results, "infrastructure", anySubnet.ip);
            }

            if (
                visibility.surfaceInfrastructure &&
                visibility.surfaceDomains &&
                domain
            ) {
                push(results, "infrastructure", domain);
            }

            if (visibility.surfaceLocations) {
                const location = compact([
                    anySubnet.location?.city,
                    anySubnet.location?.country,
                ]).join(", ");

                push(results, "locations", location);
            }
        }

        for (const user of anySubnet.users ?? []) {
            const anyUser = user as any;
            const email = anyUser.email?.address;
            const emailMatches =
                exactEmail && normalize(email) === search;

            if (!emailMatches && !subnetMatches) {
                continue;
            }

            const fullName = compact([
                anyUser.firstName,
                anyUser.lastName,
            ]).join(" ");

            if (
                visibility.surfaceNetworkUsers &&
                visibility.surfaceContacts
            ) {
                push(results, "contacts", fullName);
            }

            if (visibility.surfaceEmails) {
                push(results, "contacts", email);
            }

            if (visibility.surfaceSocial && fullName) {
                for (const socialResult of searchTwotter(fullName)) {
                    push(
                        results,
                        socialResult.category,
                        socialResult.value,
                    );
                }
            }

            if (
                visibility.surfaceInfrastructure &&
                visibility.surfaceIps
            ) {
                push(results, "infrastructure", anySubnet.ip);
            }

            if (
                visibility.surfaceInfrastructure &&
                visibility.surfaceDomains &&
                domain
            ) {
                push(results, "infrastructure", domain);
            }
        }
    }

    return results;
}

export interface SpiderFootPhoneBookListing {
    name: string;
    phoneNumber: string;
    aliases?: string[];
    organization?: string;
    role?: string;
    location?: string;
    website?: string;
    visibility?: SpiderFootVisibility;
}

const PHONE_BOOK_LISTINGS: SpiderFootPhoneBookListing[] = [];

export function registerSpiderFootPhoneBookListing(
    listing: SpiderFootPhoneBookListing,
): void {
    const key = normalize(listing?.phoneNumber) || normalize(listing?.name);

    if (!key) {
        return;
    }

    const index = PHONE_BOOK_LISTINGS.findIndex(
        (entry) => (normalize(entry.phoneNumber) || normalize(entry.name)) === key,
    );

    if (index >= 0) {
        PHONE_BOOK_LISTINGS[index] = listing;
        return;
    }

    PHONE_BOOK_LISTINGS.push(listing);
}

export function unregisterSpiderFootPhoneBookListing(phoneNumberOrName: string): void {
    const clean = normalize(phoneNumberOrName);

    if (!clean) {
        return;
    }

    for (let index = PHONE_BOOK_LISTINGS.length - 1; index >= 0; index -= 1) {
        const entry = PHONE_BOOK_LISTINGS[index];

        if (normalize(entry.phoneNumber) === clean || normalize(entry.name) === clean) {
            PHONE_BOOK_LISTINGS.splice(index, 1);
        }
    }
}

function searchPhoneBook(query: string): SpiderFootResult[] {
    const clean = normalize(query);

    if (!clean) {
        return [];
    }

    const results: SpiderFootResult[] = [];

    for (const listing of PHONE_BOOK_LISTINGS) {
        const visibility = normalizeSpiderFootVisibility(listing.visibility);

        if (!visibility.surface) {
            continue;
        }

        const searchable = compact([
            listing.name,
            listing.phoneNumber,
            listing.location,
            ...(listing.aliases ?? []),
        ]).join(" ").toLowerCase();

        if (!searchable.includes(clean)) {
            continue;
        }

        if (visibility.surfaceContacts) {
            push(results, "contacts", listing.name);
            push(results, "contacts", listing.phoneNumber);
        }

        if (
            visibility.surfaceInfrastructure &&
            visibility.surfaceDomains &&
            listing.website
        ) {
            push(results, "infrastructure", listing.website);
        }

        if (visibility.surfaceLocations) {
            push(results, "locations", listing.location);
        }

        if (visibility.surfaceReferences) {
            push(
                results,
                "references",
                `Phone book listing: ${listing.name}${
                    listing.organization ? ` - ${listing.organization}` : ""
                }`,
            );

            if (listing.role) {
                push(results, "references", listing.role);
            }
        }
    }

    return results;
}

const twotterInitializers: Array<() => void> = [];
const completedTwotterInitializers = new Set<() => void>();

export function registerTwotterInit(fn: () => void): void {
    if (typeof fn !== "function" || twotterInitializers.includes(fn)) {
        return;
    }

    twotterInitializers.push(fn);
}

export function unregisterTwotterInit(fn: () => void): void {
    const index = twotterInitializers.indexOf(fn);

    if (index >= 0) {
        twotterInitializers.splice(index, 1);
    }

    completedTwotterInitializers.delete(fn);
}

function ensureTwotterInit(): void {
    for (const fn of twotterInitializers) {
        if (completedTwotterInitializers.has(fn)) {
            continue;
        }

        try {
            fn();
            completedTwotterInitializers.add(fn);
        } catch {
            continue;
        }
    }
}

export function searchSpiderFoot(query: string): SpiderFootResult[] {
    const clean = normalize(query);

    if (!clean) {
        return [];
    }

    runSearchHooks(clean);

    return uniqueResults([
        ...searchTwotter(clean),
        ...searchWebDocuments(clean),
        ...searchNetworkExact(clean),
        ...searchPhoneBook(clean),
        ...searchRegisteredSpiderFootIntel(clean),
    ]);
}
