# hackhub-spiderfoot

## Overview

SpiderFoot is a terminal command for discovering mod content from websites, Twotter profiles, and registered network targets.

Players run it with:

```bash
spiderfoot <target>
```

Examples:

```bash
spiderfoot nexacorp
spiderfoot @elena_ross
spiderfoot elena ross
spiderfoot security@nexacorp.com
spiderfoot db.nexacorp.com
```

SpiderFoot prints results in five sections:

| Section | Result category |
|---|---|
| Social | Twotter handles and social handles found in indexed content |
| Contacts | Names and email addresses |
| Infrastructure | Domains and IP addresses |
| Locations | Cities, countries, and address-like text |
| Web References | Matching pages, snippets, and related references |

If nothing matches, the command prints:

```text
No intelligence records found.
```

---

## Example Command Output

The exact `Investigation ID` changes every run. SpiderFoot always prints the same report structure: header, target, collection stages, then either a warning or the five result sections.

### Help Output

Running SpiderFoot without a target, or with `-h` / `--help`, prints:

```text
Usage: spiderfoot <target>
Examples:
  spiderfoot nexacorp
  spiderfoot @elena_ross
  spiderfoot elena ross
  spiderfoot security@nexacorp.com
  spiderfoot db.nexacorp.com
```

### No Results

If the search finishes but no records match, SpiderFoot prints:

```text
======================================================
                      SPIDERFOOT
              Open Source Intelligence
======================================================

Target: unknown target
Investigation ID: sf-lx1a2b3c

[+] Initializing passive collection modules...
[+] Searching approved public website content...
[+] Correlating social records...
[+] Mapping contact and location references...
[+] Building intelligence report...

No intelligence records found.
```

### Website Match

For a website page containing:

```html
<h1>Example Bank</h1>
<p>Contact security@example-bank.com for security disclosures.</p>
<p>Headquarters: Port Azure, In-Game.</p>
<p>Follow @example_bank.</p>
```

a search such as:

```bash
spiderfoot example bank
```

may print:

```text
======================================================
                      SPIDERFOOT
              Open Source Intelligence
======================================================

Target: example bank
Investigation ID: sf-lx1a2b3c

[+] Initializing passive collection modules...
[+] Searching approved public website content...
[+] Correlating social records...
[+] Mapping contact and location references...
[+] Building intelligence report...

[OK] Intelligence report complete.

Social
  @example_bank

Contacts
  security@example-bank.com

Infrastructure
No data found.

Locations
  Port Azure, In-Game
  Port Azure

Web References
  https://example-bank.com/ — Example Bank
  Example Bank Public banking website for Example Bank. Example Bank Contact security@example-bank.com for security disclosures. Headquarters: Port Azure, In-Game. Follow @example_bank.
```

The snippet under `Web References` is generated from the matching page title, description, and stripped HTML content. Long snippets may be shortened with `...`.

### Email Search

If an indexed website document contains `security@example-bank.com`, a direct email search:

```bash
spiderfoot security@example-bank.com
```

may print:

```text
[OK] Intelligence report complete.

Social
No data found.

Contacts
  security@example-bank.com

Infrastructure
  example-bank.com

Locations
No data found.

Web References
  https://example-bank.com/ — Example Bank
  ...Contact security@example-bank.com for security disclosures...
```

The domain appears under `Infrastructure` only when `surfaceInfrastructure` and `surfaceDomains` are enabled.

### Twotter Match

If a Twotter user exists with username `victor_hale`, running:

```bash
spiderfoot victor hale
```

may print:

```text
[OK] Intelligence report complete.

Social
  @victor_hale

Contacts
  Victor Hale

Infrastructure
No data found.

Locations
No data found.

Web References
  Executive at Example Bank.
  Verified public profile
```

`Verified public profile` appears only when the matched Twotter account is verified.

### Network Target Match

For a registered network target with IP `198.51.100.42`, domain `db.example-bank.com`, name `Company Database`, and a user `Database Viewer`, running:

```bash
spiderfoot Company Database
```

may print:

```text
[OK] Intelligence report complete.

Social
No data found.

Contacts
  Database Viewer
  db.view@example-bank.com

Infrastructure
  198.51.100.42
  db.example-bank.com

Locations
  Port Azure, In-Game

Web References
  Network record associated with db.example-bank.com
  Database Viewer is listed on db.example-bank.com
```

Network user names require both `surfaceNetworkUsers: true` and `surfaceContacts: true`. Network user email addresses require `surfaceEmails: true`.


## Files

SpiderFoot is implemented by three TypeScript files:

| File | Purpose |
|---|---|
| `SpiderFootCommand.ts` | Registers the `spiderfoot` command and prints results |
| `SpiderFootIntel.ts` | Searches Twotter, website documents, and registered network targets |
| `SpiderFootNetworkRegistry.ts` | Defines visibility settings and registers network targets |

This mod places `SpiderFootCommand.ts` in a `commands` folder and the other two files in a `world` folder. That folder structure is not required. If the files are moved, update the relative imports between them.

The command file imports the search code like this:

```ts
import {
    searchSpiderFoot,
    type SpiderFootCategory,
    type SpiderFootResult,
} from "../world/SpiderFootIntel";
```

If `SpiderFootIntel.ts` is not in `../world`, update that import.

Clean raw copies of the three files — without demo content or the phone book source — are available in the `public/` folder. These are the recommended starting point for integrating SpiderFoot into your own mod.

---

## Required Manifest Permissions

SpiderFoot uses:

- `Events.emit(...)` in `SpiderFootCommand.ts`
- `Network.getAllSubnets()` in `SpiderFootIntel.ts`

Add these permissions to `manifest.json`:

```json
{
  "permissions": ["events", "network"]
}
```

Twotter access does not require a manifest permission.

---

## How SpiderFoot Searches

`searchSpiderFoot(query)` combines results from four functions:

```ts
return uniqueResults([
    ...searchTwotter(clean),
    ...searchWebDocuments(clean),
    ...searchNetworkExact(clean),
    ...searchPhoneBook(clean),
]);
```

SpiderFoot searches:

1. Twotter usernames
2. Indexed website content
3. Exact network matches
4. Phone book listings

Duplicate results are removed by category and value.

The phone book source is included in this mod as a customization example. The raw files in `public/` contain only the three built-in sources. See the **Custom SpiderFoot Data Sources** section for how the phone book was added and how to write your own sources.

---


## Custom SpiderFoot Data Sources

SpiderFoot data sources are plain TypeScript functions that return `SpiderFootResult[]`.

The three built-in sources in the raw files are:

```ts
return uniqueResults([
    ...searchTwotter(clean),
    ...searchWebDocuments(clean),
    ...searchNetworkExact(clean),
]);
```

To add another source, create a function in `SpiderFootIntel.ts` that accepts the normalized query and returns results using the existing SpiderFoot categories:

```ts
"social"
"contacts"
"infrastructure"
"locations"
"references"
```

Then add that function to the `uniqueResults([...])` list.

Custom sources are mod code. They are not a HackHub SDK API. They use the same result shape that SpiderFoot already prints through `SpiderFootCommand.ts`.

---

### Phone Book Source Example

This example adds a simple phone book. It lets players search a person's name, alias, organization, role, or phone number and return the in-game phone number under `Contacts`.

Add this in `SpiderFootIntel.ts`, near the other search functions:

```ts
interface SpiderFootPhoneBookListing {
    name: string;
    phoneNumber: string;
    aliases?: string[];
    organization?: string;
    role?: string;
    location?: string;
    website?: string;
    visibility?: SpiderFootVisibility;
}

const PHONE_BOOK_LISTINGS: SpiderFootPhoneBookListing[] = [
    {
        name: "Mara Vale",
        phoneNumber: "555-0134",
        aliases: ["mara", "m vale"],
        organization: "Example Bank",
        role: "Vendor Accounts Manager",
        location: "Port Azure, In-Game",
        website: "example-bank.com",
        visibility: {
            surface: true,
            surfaceContacts: true,
            surfaceInfrastructure: true,
            surfaceDomains: true,
            surfaceLocations: true,
            surfaceReferences: true,
        },
    },
    {
        name: "Dorian Knox",
        phoneNumber: "555-0198",
        aliases: ["d knox"],
        organization: "Example Bank",
        role: "Security Desk",
        website: "security.example-bank.com",
        visibility: {
            surface: true,
            surfaceContacts: true,
            surfaceInfrastructure: true,
            surfaceDomains: true,
            surfaceReferences: true,
        },
    },
];
```

Then add the search function:

```ts
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
            listing.organization,
            listing.role,
            listing.location,
            listing.website,
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
                    listing.organization ? ` — ${listing.organization}` : ""
                }`,
            );

            if (listing.role) {
                push(results, "references", listing.role);
            }
        }
    }

    return results;
}
```

Finally, add it to `searchSpiderFoot(query)`:

```ts
export function searchSpiderFoot(query: string): SpiderFootResult[] {
    const clean = normalize(query);

    if (!clean) {
        return [];
    }

    return uniqueResults([
        ...searchTwotter(clean),
        ...searchWebDocuments(clean),
        ...searchNetworkExact(clean),
        ...searchPhoneBook(clean),
    ]);
}
```

The order matters only when duplicate category/value pairs exist. `uniqueResults(...)` keeps the first matching value and removes later duplicates.

---

### Phone Book Output Example

With the listing above, running:

```bash
spiderfoot mara vale
```

may print:

```text
[OK] Intelligence report complete.

Social
No data found.

Contacts
  Mara Vale
  555-0134

Infrastructure
  example-bank.com

Locations
  Port Azure, In-Game

Web References
  Phone book listing: Mara Vale — Example Bank
  Vendor Accounts Manager
```

Searching by phone number also works because the phone number is included in the source's searchable text:

```bash
spiderfoot 555-0134
```

may print:

```text
[OK] Intelligence report complete.

Social
No data found.

Contacts
  Mara Vale
  555-0134

Infrastructure
  example-bank.com

Locations
  Port Azure, In-Game

Web References
  Phone book listing: Mara Vale — Example Bank
  Vendor Accounts Manager
```

---

### Phone Book Visibility

The phone book example uses the same visibility settings as the rest of SpiderFoot.

For a public listing:

```ts
visibility: {
    surface: true,
    surfaceContacts: true,
    surfaceLocations: true,
    surfaceReferences: true,
}
```

For a listing that can be found by name but should not expose the phone number, do not use this source as written. In the example function, `surfaceContacts` controls both the person's name and phone number because SpiderFoot only has a `contacts` category.

Use separate fields if your mod needs finer control:

```ts
interface SpiderFootPhoneBookListing {
    name: string;
    phoneNumber: string;
    surfacePhoneNumber?: boolean;
    visibility?: SpiderFootVisibility;
}
```

Then only push the phone number when `surfacePhoneNumber` is true:

```ts
if (visibility.surfaceContacts) {
    push(results, "contacts", listing.name);

    if (listing.surfacePhoneNumber) {
        push(results, "contacts", listing.phoneNumber);
    }
}
```

For a hidden listing:

```ts
visibility: {
    surface: false,
}
```

`normalizeSpiderFootVisibility(...)` converts that into a fully hidden visibility object, so the listing is skipped.

---

### When to Use a Custom Source

Use a custom SpiderFoot source when the data is not naturally part of:

- a website page
- a `SPIDERFOOT_INDEXED_SITES` entry
- a Twotter profile
- a HackHub network subnet

Examples:

- phone book listings
- public company registries
- conference attendee lists
- leaked contact sheets
- government license records
- internal HR records that should only expose selected fields

Keep the source function small. It should only decide whether the query matches and then return normal SpiderFoot results.

---

## Visibility Settings

Visibility settings control which categories SpiderFoot may display.

```ts
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
```

### Default Visibility

If a visibility value is not provided, SpiderFoot uses:

```ts
{
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
}
```

### Hidden Visibility

If `surface` is set to `false`, SpiderFoot normalizes the whole visibility object to hidden:

```ts
{
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
}
```

Use this when a website or network target should not appear in SpiderFoot results.

---

## Visibility Reference

### `surface`

Master visibility switch.

```ts
surface: true
```

The target can appear in SpiderFoot.

```ts
surface: false
```

The target is hidden and all other visibility settings are disabled.

### `surfaceSocial`

Allows social handles and Twotter-related results.

### `surfaceContacts`

Allows names and contact entries.

### `surfaceEmails`

Allows email addresses.

### `surfaceInfrastructure`

Parent switch for infrastructure results.

If this is `false`, domains and IP addresses are hidden.

### `surfaceDomains`

Allows domains.

Requires:

```ts
surfaceInfrastructure: true
```

### `surfaceIps`

Allows IP addresses.

Requires:

```ts
surfaceInfrastructure: true
```

The default is `false`.

### `surfaceLocations`

Allows location results.

### `surfaceReferences`

Allows page references, snippets, and related reference text.

### `surfaceNetworkUsers`

Allows users from registered network targets to appear.

Network user names require both:

```ts
surfaceNetworkUsers: true
surfaceContacts: true
```

Network user email addresses require:

```ts
surfaceEmails: true
```

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

## Twotter Integration

SpiderFoot searches Twotter usernames directly with:

```ts
Twotter.getUserByUsername(username)
```

A query is converted into username candidates by:

- lowercasing
- removing a leading `@`
- replacing spaces, dots, and hyphens with `_`
- removing spaces, dots, underscores, and hyphens

Example:

```bash
spiderfoot victor hale
```

can try usernames like:

```text
victor hale
victor_hale
victorhale
```

If a Twotter user is found, SpiderFoot can return:

- `@username` under Social
- display name under Contacts
- bio under Web References
- `Verified public profile` under Web References if the account is verified

### Creating a Twotter Profile

```ts
import { Twotter } from "@hotbunny/hackhub-content-sdk";

const user = Twotter.createUser({
    username: "victor_hale",
    firstName: "Victor",
    lastName: "Hale",
    bio: "Executive at Example Bank.",
    verified: true,
});

Twotter.addUser(user);
```

Twotter itself does not require a manifest permission.

---

## Network Target Registration

Network targets are not indexed automatically. SpiderFoot only checks network records that can resolve visibility through `registerSpiderFootNetworkTarget(...)`.

Use this for:

- servers
- databases
- mail gateways
- internal systems
- quest-specific infrastructure
- NPC-associated infrastructure

### Registration Shape

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "company-db",
    ip: "198.51.100.42",
    domain: "db.example-bank.com",
    name: "Company Database",

    visibility: {
        surface: true,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: true,
        surfaceReferences: true,
    },
});
```

`sourceKey` and `ip` are required. If either is missing after normalization, registration does nothing.

`domain` and `name` are optional.

---

## What Network Registration Stores

`registerSpiderFootNetworkTarget(...)` stores visibility data and lookup mappings.

It does not create a network device, website, page, or document.

Internally it stores:

- `sourceKey -> visibility`
- `ip -> sourceKey`
- `domain -> sourceKey`
- `name -> sourceKey`

Visibility lookup order is:

1. Domain
2. IP
3. Name

```ts
(domain ? sourceKeyByDomain.get(domain) : undefined)
    ?? (ip ? sourceKeyByIp.get(ip) : undefined)
    ?? (name ? sourceKeyByName.get(name) : undefined)
```

---

## Creating a Network Target with the HackHub SDK

SpiderFoot searches subnets returned by:

```ts
Network.getAllSubnets()
```

The network target must exist in the HackHub network system, and the SpiderFoot registration must match that network target.

Example:

```ts
import {
    Network,
    NetworkDeviceType,
} from "@hotbunny/hackhub-content-sdk";

import {
    registerSpiderFootNetworkTarget,
} from "./SpiderFootNetworkRegistry";

const dbIp = Network.randomIp();

Network.createSubnetNetwork({
    ip: dbIp,
    type: NetworkDeviceType.Device,
    name: "Company Database",
    domain: {
        name: "db.example-bank.com",
    },
    location: {
        latitude: "37.7601",
        longitude: "-122.4201",
        city: "Port Azure",
        country: "In-Game",
    },
    ports: [
        {
            external: 3306,
            internal: 3306,
            active: true,
            service: "mysql",
            version: "ledgerdb/8.0",
        },
    ],
    users: [
        Network.createUser({
            username: "db.view",
            password: "ledger-read",
            firstName: "Database",
            lastName: "Viewer",
            email: {
                address: "db.view@example-bank.com",
                password: "mail-password",
            },
            online: true,
        }),
    ],
});

registerSpiderFootNetworkTarget({
    sourceKey: "company-db",
    ip: dbIp,
    domain: "db.example-bank.com",
    name: "Company Database",

    visibility: {
        surface: true,
        surfaceContacts: true,
        surfaceEmails: true,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: true,
        surfaceLocations: true,
        surfaceReferences: true,
        surfaceNetworkUsers: true,
    },
});
```

Important:

- The `ip` in the registration must match the network device IP.
- The `domain` in the registration should match `domain.name` on the network device.
- The `name` in the registration should match `name` on the network device if players should search by name.
- Registering a name alone does not create a searchable network name. SpiderFoot compares the query to the actual subnet `name`.

---

## Network Search Behavior

SpiderFoot performs exact network matching.

It can match:

- exact IP
- exact domain
- exact subnet name
- exact network user email address

Examples:

```bash
spiderfoot 198.51.100.42
spiderfoot db.example-bank.com
spiderfoot Company Database
spiderfoot db.view@example-bank.com
```

When the subnet itself matches by IP, domain, or name:

- `surfaceInfrastructure` + `surfaceIps` allows the IP.
- `surfaceInfrastructure` + `surfaceDomains` allows the domain.
- `surfaceLocations` allows `city, country` from the subnet location.
- `surfaceReferences` allows a network association reference.

When a user email matches, or when a matching subnet contains users:

- `surfaceNetworkUsers` + `surfaceContacts` allows the full name.
- `surfaceEmails` allows the email address.
- `surfaceSocial` may perform a Twotter lookup from the full name.
- `surfaceInfrastructure` settings may show IP and domain.
- `surfaceReferences` may show that the user is listed on the domain.

---

## Common Website Configurations

### Public Organization

```ts
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
}
```

### Website Only

```ts
spiderfoot: {
    surface: true,
    surfaceSocial: true,
    surfaceContacts: true,
    surfaceEmails: true,
    surfaceInfrastructure: false,
    surfaceDomains: false,
    surfaceIps: false,
    surfaceLocations: true,
    surfaceReferences: true,
    surfaceNetworkUsers: false,
}
```

### Hidden Website

```ts
spiderfoot: {
    surface: false,
}
```

### Technical Website

```ts
spiderfoot: {
    surface: true,
    surfaceSocial: false,
    surfaceContacts: false,
    surfaceEmails: false,
    surfaceInfrastructure: true,
    surfaceDomains: true,
    surfaceIps: true,
    surfaceLocations: false,
    surfaceReferences: true,
    surfaceNetworkUsers: false,
}
```

---

## Common Network Configurations

### Hidden Network Target

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "secret-server",
    ip: secretIp,
    visibility: {
        surface: false,
    },
});
```

### Infrastructure-Only Target

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "internal-db",
    ip: databaseIp,
    domain: "db.example-bank.com",
    name: "Internal Database",

    visibility: {
        surface: true,
        surfaceSocial: false,
        surfaceContacts: false,
        surfaceEmails: false,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: true,
        surfaceLocations: false,
        surfaceReferences: true,
        surfaceNetworkUsers: false,
    },
});
```

### Discoverable Staff System

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "staff-portal",
    ip: portalIp,
    domain: "staff.example-bank.com",
    name: "Staff Portal",

    visibility: {
        surface: true,
        surfaceSocial: true,
        surfaceContacts: true,
        surfaceEmails: true,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: false,
        surfaceLocations: true,
        surfaceReferences: true,
        surfaceNetworkUsers: true,
    },
});
```

---

## Command Event

After a search, SpiderFoot emits:

```ts
Events.emit("SpiderFoot.Search", {
    query,
    results,
});
```

If no results are found, `results` is an empty array.

This event can be used by quests or other systems that need to react when the player runs SpiderFoot.

---

## Troubleshooting

| Problem | Check |
|---|---|
| The command does not exist | Confirm `SpiderFootCommand` is included in the mod and decorated with `@RegisterCommand` |
| Search returns no results | Confirm the target is indexed and `surface` is not `false` |
| Website page does not appear | Confirm the website class is in `WEBSITE_CLASSES` and the page has `seo: true` |
| SPIDERFOOT_INDEXED_SITES entry does not appear | Confirm the entry has `surface` enabled or no hidden visibility override |
| Emails do not appear | Confirm `surfaceEmails: true` or `surfaceContacts: true` |
| Social handles do not appear | Confirm `surfaceSocial: true` and the handle appears near the matched text |
| IPs do not appear | Confirm `surfaceInfrastructure: true` and `surfaceIps: true` |
| Domains do not appear | Confirm `surfaceInfrastructure: true` and `surfaceDomains: true` |
| Network users do not appear | Confirm `surfaceNetworkUsers: true` and `surfaceContacts: true` |
| Network target cannot be found by name | Confirm the actual network device `name` matches the searched name |
| Network target cannot be found by domain | Confirm the actual network device has `domain: { name: "..." }` and the registration uses the same domain |
| Network target cannot be found by IP | Confirm the registered IP matches the network device IP |

---

## Implementation Reference

This guide is based on the following implementation behavior:

| Behavior | Source file |
|---|---|
| Command name, help examples, printed sections, event emission | `SpiderFootCommand.ts` |
| Twotter search, website indexing, SPIDERFOOT_INDEXED_SITES indexing, network exact search | `SpiderFootIntel.ts` |
| Visibility defaults, hidden visibility, network registration, visibility lookup order | `SpiderFootNetworkRegistry.ts` |
