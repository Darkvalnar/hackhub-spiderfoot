export type SpiderFootCategory =
    | "social"
    | "contacts"
    | "infrastructure"
    | "locations"
    | "references";

export interface SpiderFootVisibility {
    surface?: boolean;
    surfaceSocial?: boolean;
    surfaceContacts?: boolean;
    surfaceEmails?: boolean;
    surfaceInfrastructure?: boolean;
    surfaceDomains?: boolean;
    surfaceIps?: boolean;
    surfaceLocations?: boolean;
    surfaceReferences?: boolean;
    surfaceNetworkUsers?: boolean;
}

export const DEFAULT_SPIDERFOOT_VISIBILITY: Required<SpiderFootVisibility> = {
    surface: true,
    surfaceSocial: true,
    surfaceContacts: true,
    surfaceEmails: true,
    surfaceInfrastructure: true,
    surfaceDomains: true,
    surfaceIps: false,
    surfaceLocations: true,
    surfaceReferences: true,
    surfaceNetworkUsers: false,
};

export const HIDDEN_SPIDERFOOT_VISIBILITY: Required<SpiderFootVisibility> = {
    surface: false,
    surfaceSocial: false,
    surfaceContacts: false,
    surfaceEmails: false,
    surfaceInfrastructure: false,
    surfaceDomains: false,
    surfaceIps: false,
    surfaceLocations: false,
    surfaceReferences: false,
    surfaceNetworkUsers: false,
};

export interface SpiderFootNetworkRegistration {
    sourceKey: string;
    ip: string;
    domain?: string;
    name?: string;
    visibility?: SpiderFootVisibility;
}

const visibilityBySourceKey = new Map<string, Required<SpiderFootVisibility>>();
const sourceKeyByIp = new Map<string, string>();
const sourceKeyByDomain = new Map<string, string>();
const sourceKeyByName = new Map<string, string>();

function normalize(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

export function normalizeSpiderFootVisibility(
    visibility?: SpiderFootVisibility,
): Required<SpiderFootVisibility> {
    if (visibility?.surface === false) {
        return HIDDEN_SPIDERFOOT_VISIBILITY;
    }

    return {
        ...DEFAULT_SPIDERFOOT_VISIBILITY,
        ...(visibility ?? {}),
        surface: visibility?.surface ?? DEFAULT_SPIDERFOOT_VISIBILITY.surface,
    };
}

export function registerSpiderFootNetworkTarget(
    registration: SpiderFootNetworkRegistration,
): void {
    const sourceKey = normalize(registration.sourceKey);
    const ip = normalize(registration.ip);
    const domain = normalize(registration.domain);
    const name = normalize(registration.name);

    if (!sourceKey || !ip) {
        return;
    }

    visibilityBySourceKey.set(
        sourceKey,
        normalizeSpiderFootVisibility(registration.visibility),
    );

    sourceKeyByIp.set(ip, sourceKey);

    if (domain) {
        sourceKeyByDomain.set(domain, sourceKey);
    }

    if (name) {
        sourceKeyByName.set(name, sourceKey);
    }
}

export function resolveSpiderFootNetworkVisibility(args: {
    ip?: string;
    domain?: string;
    name?: string;
}): Required<SpiderFootVisibility> | undefined {
    const ip = normalize(args.ip);
    const domain = normalize(args.domain);
    const name = normalize(args.name);

    const sourceKey =
        (domain ? sourceKeyByDomain.get(domain) : undefined) ??
        (ip ? sourceKeyByIp.get(ip) : undefined) ??
        (name ? sourceKeyByName.get(name) : undefined);

    if (!sourceKey) {
        return undefined;
    }

    return visibilityBySourceKey.get(sourceKey);
}
