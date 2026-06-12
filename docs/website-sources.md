# Website Sources

## Documentation Pages

- [SpiderFoot Documentation](index.md)
- [Quick Start](quick-start.md)
- [Files and Permissions](files-and-permissions.md)
- [How SpiderFoot Searches](search-behavior.md)
- [Custom SpiderFoot Data Sources](custom-data-sources.md)
- [Visibility Settings](visibility.md)
- [Website Sources](website-sources.md)
- [Twotter Integration](twotter.md)
- [Network Target Registration](network-targets.md)
- [Common Configurations](common-configurations.md)
- [Command Event](command-event.md)
- [Troubleshooting](troubleshooting.md)
- [Implementation Reference](implementation-reference.md)

---

## Website Sources

SpiderFoot indexes website content from two sources:

1. Website classes listed in `WEBSITE_CLASSES`
2. Entries in `SPIDERFOOT_INDEXED_SITES`

These are separate paths.

---

## Registered Website Classes

`SpiderFootIntel.ts` contains a `WEBSITE_CLASSES` list.

```ts
const WEBSITE_CLASSES: WebsiteConstructor[] = [
    NexaCorpSite,
];
```

To make your own website classes searchable, import them into `SpiderFootIntel.ts` and add them to `WEBSITE_CLASSES`.

Example:

```ts
import { ExampleBankWebsite } from "../websites/ExampleBankWebsite";

const WEBSITE_CLASSES: WebsiteConstructor[] = [
    ExampleBankWebsite,
];
```

The import path depends on where your website class is stored.

---

## Website Page Indexing

For website classes in `WEBSITE_CLASSES`, SpiderFoot only indexes pages where:

```ts
seo: true
```

The code skips pages that do not set `seo` to `true`:

```ts
if (anyPage.seo !== true) {
    continue;
}
```

For indexed pages, SpiderFoot reads:

- `path`
- `title`
- `description`
- `search`
- `html`

### Static Page Example

```ts
import {
    RegisterWebsite,
    Website,
} from "@hotbunny/hackhub-content-sdk";

const homeHtml = `
    <h1>Example Bank</h1>
    <p>Contact security@example-bank.com for security disclosures.</p>
    <p>Headquarters: Port Azure, In-Game.</p>
    <p>Follow @example_bank.</p>
`;

@RegisterWebsite
export class ExampleBankWebsite extends Website {
    SiteName = "Example Bank";
    Host = "example-bank.com";
    Icon = "";

    Pages = [
        {
            path: "/",
            title: "Example Bank",
            description: "Public banking website for Example Bank.",
            seo: true,
            search: [
                "example bank",
                "banking",
                "security contact",
            ],
            html: homeHtml,
        },
    ];
}
```

With the default visibility settings, a matching SpiderFoot search may surface:

- `security@example-bank.com` under Contacts
- `@example_bank` under Social
- `Port Azure, In-Game` under Locations
- `https://example-bank.com/ — Example Bank` under Web References

### Dynamic Page Example

`DynamicWebsitePageDefinition` is a HackHub Content SDK page type. SpiderFoot supports it by calling the page's `metadata(context)` function during indexing and reading the returned page metadata.

```ts
import {
    RegisterWebsite,
    Website,
    type DynamicWebsitePageDefinition,
} from "@hotbunny/hackhub-content-sdk";

const productHtml = `
    <h1>Vendor Management</h1>
    <p>Vendor payment operations for Example Bank.</p>
`;

@RegisterWebsite
export class ExampleVendorWebsite extends Website {
    SiteName = "Example Vendor Portal";
    Host = "vendors.example-bank.com";
    Icon = "";

    Pages = [
        {
            path: "/vendors/:vendorId",
            seo: true,
            metadata(context) {
                return {
                    title: "Vendor Management",
                    description: "Procurement and vendor operations.",
                    search: [
                        "vendors",
                        "procurement",
                        "payments",
                    ],
                    html: productHtml,
                };
            },
        } satisfies DynamicWebsitePageDefinition,
    ];
}
```

SpiderFoot indexes the object returned from `metadata(context)`. The returned object must include an `html` string or the dynamic page is skipped.

During SpiderFoot indexing, the metadata function receives an empty route/query context. Dynamic pages that require route parameters should provide fallback metadata if they need to appear in SpiderFoot.

---

## Website Visibility for Registered Website Classes

For website classes, SpiderFoot looks for a matching entry in `SPIDERFOOT_INDEXED_SITES` by host or subdomain.

```ts
findIndexedSiteByHost(site.Host)
```

If a matching `SPIDERFOOT_INDEXED_SITES` entry exists, SpiderFoot uses that entry's `spiderfoot` visibility.

If no matching entry exists, SpiderFoot uses the default visibility.

Example `SPIDERFOOT_INDEXED_SITES` entry that controls visibility for a website class:

```ts
export const SPIDERFOOT_INDEXED_SITES: SpiderFootSiteEntry[] = [
    {
        host: "example-bank.com",
        subdomains: ["vendors.example-bank.com"],
        name: "Example Bank",
        summary: "Public banking and vendor operations.",
        owner: "Example Bank",
        sector: "Finance",
        capabilities: ["banking", "vendors", "payments"],

        spiderfoot: {
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
        },
    },
];
```

---

## SPIDERFOOT_INDEXED_SITES Indexing

SpiderFoot also creates searchable documents directly from `SPIDERFOOT_INDEXED_SITES`.

For each surfaced entry, it builds HTML-like searchable content from:

```ts
site.name
site.summary
site.owner
site.sector
site.host
```

If `surfaceEmails` is enabled, it also includes:

```text
abuse@<host>
```

The searchable keywords are:

```ts
[
    site.name,
    site.owner,
    site.sector,
    site.host,
    ...(site.capabilities ?? []),
]
```

`SPIDERFOOT_INDEXED_SITES` entries do not use page-level `seo: true`. The `seo: true` requirement only applies to pages inside registered website classes listed in `WEBSITE_CLASSES`.

### SPIDERFOOT_INDEXED_SITES-Only Example

Use this when the target should appear in SpiderFoot but does not need a full website class.

```ts
export const SPIDERFOOT_INDEXED_SITES: SpiderFootSiteEntry[] = [
    {
        host: "example-bank.com",
        name: "Example Bank",
        summary: "Public banking and payment services.",
        owner: "Example Bank",
        sector: "Finance",
        capabilities: [
            "banking",
            "payments",
            "customer portal",
        ],

        spiderfoot: {
            surface: true,
            surfaceEmails: true,
            surfaceInfrastructure: true,
            surfaceDomains: true,
            surfaceIps: false,
            surfaceReferences: true,
        },
    },
];
```

With `surfaceEmails: true`, SpiderFoot includes `abuse@example-bank.com` in the indexed content.

---

## Website Search Behavior

SpiderFoot searches website documents by combining:

- Host
- Path
- Title
- Description
- Search keywords
- Text content stripped from HTML

HTML is stripped before searching. The query must appear in the normalized searchable text.

When a page matches:

- `surfaceReferences` allows the page URL and title to be returned.
- `surfaceReferences` also allows a snippet around the match.
- `surfaceEmails` or `surfaceContacts` allows emails found near the match.
- `surfaceSocial` allows handles found near the match.
- `surfaceLocations` allows location-like text found near the match.

Email extraction uses this pattern:

```ts
/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
```

Handle extraction uses this pattern:

```ts
/@[a-z0-9_]{3,32}/gi
```

Location extraction looks for supported country formats, street address formats, and the built-in city names:

```text
Fiction City
Port Azure
San Francisco
Amsterdam
Tokyo
Singapore
```

---
