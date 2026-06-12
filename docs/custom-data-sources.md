# Custom SpiderFoot Data Sources

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
