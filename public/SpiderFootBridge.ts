import { Events, SharedVariables } from "@hotbunny/hackhub-content-sdk";

import {
    type SpiderFootDocumentRegistration,
    type SpiderFootIntelRegistration,
    type SpiderFootPhoneBookListing,
    type SpiderFootSiteEntry,
    registerSpiderFootDocument,
    registerSpiderFootIntel,
    registerSpiderFootPhoneBookListing,
    registerSpiderFootSearchHook,
    registerSpiderFootSite,
    unregisterSpiderFootDocument,
    unregisterSpiderFootIntel,
    unregisterSpiderFootPhoneBookListing,
    unregisterSpiderFootSite,
} from "./SpiderFootIntel";

import {
    type SpiderFootNetworkRegistration,
    registerSpiderFootNetworkTarget,
} from "./SpiderFootNetworkRegistry";

export const SPIDERFOOT_INTEL_KEY = "spiderfoot.intel";
export const SPIDERFOOT_SITES_KEY = "spiderfoot.sites";
export const SPIDERFOOT_DOCUMENTS_KEY = "spiderfoot.documents";
export const SPIDERFOOT_PHONEBOOK_KEY = "spiderfoot.phonebook";
export const SPIDERFOOT_NETWORK_TARGETS_KEY = "spiderfoot.network.targets";

export const SPIDERFOOT_READY_EVENT = "SpiderFoot.Ready";
export const SPIDERFOOT_SEARCH_EVENT = "SpiderFoot.Search";
export const SPIDERFOOT_SEARCH_STARTING_EVENT = "SpiderFoot.SearchStarting";
export const SPIDERFOOT_CONTRIBUTIONS_CHANGED_EVENT = "SpiderFoot.ContributionsChanged";

export interface SpiderFootContributions {
    intel?: SpiderFootIntelRegistration[];
    sites?: SpiderFootSiteEntry[];
    documents?: SpiderFootDocumentRegistration[];
    phoneBook?: SpiderFootPhoneBookListing[];
    networkTargets?: SpiderFootNetworkRegistration[];
}

type OwnerMap<T> = Record<string, T[]>;

interface AppliedContribution {
    intelKeys: string[];
    siteHosts: string[];
    documentHosts: Array<[string, string]>;
    phoneBookKeys: string[];
}

const appliedByOwner = new Map<string, AppliedContribution>();

const CONTRIBUTION_KEYS = [
    SPIDERFOOT_INTEL_KEY,
    SPIDERFOOT_SITES_KEY,
    SPIDERFOOT_DOCUMENTS_KEY,
    SPIDERFOOT_PHONEBOOK_KEY,
    SPIDERFOOT_NETWORK_TARGETS_KEY,
];

const lastSeenByKey = new Map<string, unknown>();

function normalizeOwner(owner: unknown): string {
    return String(owner ?? "").trim().toLowerCase();
}

function readOwnerMap<T>(key: string): OwnerMap<T> {
    const raw = SharedVariables.get<OwnerMap<T>>(key);

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return {};
    }

    return raw;
}

function writeOwnerSlot<T>(key: string, owner: string, entries: T[] | undefined): void {
    const current = readOwnerMap<T>(key);
    const next: OwnerMap<T> = { ...current };

    if (!entries || !entries.length) {
        delete next[owner];
    } else {
        next[owner] = entries;
    }

    SharedVariables.set(key, next);
}

export function publishSpiderFootContributions(
    owner: string,
    contributions: SpiderFootContributions,
): void {
    const key = normalizeOwner(owner);

    if (!key) {
        return;
    }

    writeOwnerSlot(SPIDERFOOT_INTEL_KEY, key, contributions.intel);
    writeOwnerSlot(SPIDERFOOT_SITES_KEY, key, contributions.sites);
    writeOwnerSlot(SPIDERFOOT_DOCUMENTS_KEY, key, contributions.documents);
    writeOwnerSlot(SPIDERFOOT_PHONEBOOK_KEY, key, contributions.phoneBook);
    writeOwnerSlot(SPIDERFOOT_NETWORK_TARGETS_KEY, key, contributions.networkTargets);

    try {
        Events.emit(SPIDERFOOT_CONTRIBUTIONS_CHANGED_EVENT, { owner: key });
    } catch {
        return;
    }
}

export function withdrawSpiderFootContributions(owner: string): void {
    publishSpiderFootContributions(owner, {});
}

function hasChanged(): boolean {
    let changed = false;

    for (const key of CONTRIBUTION_KEYS) {
        const current = SharedVariables.get(key) ?? null;

        if (lastSeenByKey.get(key) !== current) {
            lastSeenByKey.set(key, current);
            changed = true;
        }
    }

    return changed;
}

function revokeApplied(owner: string): void {
    const applied = appliedByOwner.get(owner);

    if (!applied) {
        return;
    }

    for (const key of applied.intelKeys) {
        unregisterSpiderFootIntel(key);
    }

    for (const host of applied.siteHosts) {
        unregisterSpiderFootSite(host);
    }

    for (const [host, path] of applied.documentHosts) {
        unregisterSpiderFootDocument(host, path);
    }

    for (const key of applied.phoneBookKeys) {
        unregisterSpiderFootPhoneBookListing(key);
    }

    appliedByOwner.delete(owner);
}

function applyOwner(
    owner: string,
    intel: SpiderFootIntelRegistration[],
    sites: SpiderFootSiteEntry[],
    documents: SpiderFootDocumentRegistration[],
    phoneBook: SpiderFootPhoneBookListing[],
    networkTargets: SpiderFootNetworkRegistration[],
): void {
    const applied: AppliedContribution = {
        intelKeys: [],
        siteHosts: [],
        documentHosts: [],
        phoneBookKeys: [],
    };

    for (const entry of intel) {
        if (!entry || !Array.isArray(entry.keys) || !Array.isArray(entry.results)) {
            continue;
        }

        registerSpiderFootIntel(entry);

        const primary = String(entry.keys[0] ?? "").trim().toLowerCase();

        if (primary) {
            applied.intelKeys.push(primary);
        }
    }

    for (const site of sites) {
        if (!site || !site.host) {
            continue;
        }

        registerSpiderFootSite(site);
        applied.siteHosts.push(site.host);
    }

    for (const document of documents) {
        if (!document || !document.host || typeof document.html !== "string") {
            continue;
        }

        registerSpiderFootDocument(document);
        applied.documentHosts.push([document.host, document.path || "/"]);
    }

    for (const listing of phoneBook) {
        if (!listing || (!listing.phoneNumber && !listing.name)) {
            continue;
        }

        registerSpiderFootPhoneBookListing(listing);
        applied.phoneBookKeys.push(listing.phoneNumber || listing.name);
    }

    for (const target of networkTargets) {
        if (!target || !target.sourceKey || !target.ip) {
            continue;
        }

        registerSpiderFootNetworkTarget(target);
    }

    appliedByOwner.set(owner, applied);
}

export function drainSpiderFootContributions(force = false): void {
    const changed = hasChanged();

    if (!force && !changed) {
        return;
    }

    const intel = readOwnerMap<SpiderFootIntelRegistration>(SPIDERFOOT_INTEL_KEY);
    const sites = readOwnerMap<SpiderFootSiteEntry>(SPIDERFOOT_SITES_KEY);
    const documents = readOwnerMap<SpiderFootDocumentRegistration>(SPIDERFOOT_DOCUMENTS_KEY);
    const phoneBook = readOwnerMap<SpiderFootPhoneBookListing>(SPIDERFOOT_PHONEBOOK_KEY);
    const networkTargets = readOwnerMap<SpiderFootNetworkRegistration>(SPIDERFOOT_NETWORK_TARGETS_KEY);

    const owners = new Set<string>([
        ...Object.keys(intel),
        ...Object.keys(sites),
        ...Object.keys(documents),
        ...Object.keys(phoneBook),
        ...Object.keys(networkTargets),
    ]);

    for (const owner of appliedByOwner.keys()) {
        if (!owners.has(owner)) {
            revokeApplied(owner);
        }
    }

    for (const owner of owners) {
        revokeApplied(owner);
        applyOwner(
            owner,
            intel[owner] ?? [],
            sites[owner] ?? [],
            documents[owner] ?? [],
            phoneBook[owner] ?? [],
            networkTargets[owner] ?? [],
        );
    }
}

export function installSpiderFootBridge(): void {
    for (const name of [
        SPIDERFOOT_READY_EVENT,
        SPIDERFOOT_SEARCH_EVENT,
        SPIDERFOOT_SEARCH_STARTING_EVENT,
        SPIDERFOOT_CONTRIBUTIONS_CHANGED_EVENT,
    ]) {
        try {
            Events.register(name);
        } catch {
            continue;
        }
    }

    registerSpiderFootSearchHook((query) => {
        try {
            Events.emit(SPIDERFOOT_SEARCH_STARTING_EVENT, { query });
        } catch {
            drainSpiderFootContributions();
            return;
        }

        drainSpiderFootContributions();
    });

    try {
        Events.on(SPIDERFOOT_CONTRIBUTIONS_CHANGED_EVENT, () => {
            drainSpiderFootContributions(true);
        });
    } catch {
        drainSpiderFootContributions(true);
    }

    drainSpiderFootContributions(true);

    try {
        Events.emit(SPIDERFOOT_READY_EVENT, {
            intelKey: SPIDERFOOT_INTEL_KEY,
            sitesKey: SPIDERFOOT_SITES_KEY,
            documentsKey: SPIDERFOOT_DOCUMENTS_KEY,
            phoneBookKey: SPIDERFOOT_PHONEBOOK_KEY,
            networkTargetsKey: SPIDERFOOT_NETWORK_TARGETS_KEY,
        });
    } catch {
        return;
    }
}
