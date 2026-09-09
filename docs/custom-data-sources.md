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
- [Depending on the SpiderFoot Mod](depending-on-spiderfoot.md)
- [Demo Content](demo-content.md)
- [Troubleshooting](troubleshooting.md)
- [Implementation Reference](implementation-reference.md)

---

## Custom SpiderFoot Data Sources

SpiderFoot searches these built-in sources on every query:

```ts
return uniqueResults([
    ...searchTwotter(clean),
    ...searchWebDocuments(clean),
    ...searchNetworkExact(clean),
    ...searchPhoneBook(clean),
    ...searchRegisteredSpiderFootIntel(clean),
]);
```

You do not add sources by editing that list. Register your data instead, using the SpiderFoot categories:

```ts
"social"
"contacts"
"infrastructure"
"locations"
"references"
```

`references` is reserved for reachable website HTML. `registerSpiderFootIntel()` drops results in that category; use `registerSpiderFootDocument()` if you want a page to produce Web References.

For static data, register it once at mod load:

```ts
import { registerSpiderFootIntel } from "./world/SpiderFootIntel";

registerSpiderFootIntel({
    keys: ["mara vale", "m vale", "@m_vale"],
    match: "loose",
    results: [
        { category: "contacts", value: "Mara Vale" },
        { category: "social", value: "@m_vale" },
    ],
});
```

`match` controls how a query reaches the entry:

| Mode | Behavior |
|---|---|
| `"exact"` *(default)* | The query must equal one of `keys` |
| `"contains"` | A key appears somewhere in the query, so `harbor logistics ltd` still finds `harbor logistics` |
| `"loose"` | The query and a key contain one another, in either direction. Also matches partial typing like `harbor` |

`contains` and `loose` ignore queries and keys shorter than three characters, so a one-letter search never matches everything. Pick `contains` when your keys are full names or domains the player might type extra words around; pick `loose` when you also want partial input to find the record. The short form `registerSpiderFootIntel("mara vale", results)` registers a single exact key.

For data that changes during play, register a search hook. It runs immediately before every search, so you can re-register entries that depend on current game state:

```ts
import { registerSpiderFootSearchHook, registerSpiderFootIntel } from "./world/SpiderFootIntel";

registerSpiderFootSearchHook(() => {
    registerSpiderFootIntel({
        keys: ["harbor ops"],
        results: currentHarborContacts(),
    });
});
```

A hook that throws is skipped; it does not stop the search or the other hooks.

Use `unregisterSpiderFootIntel(key)` to withdraw an entry. It matches any of the entry's keys, not just the first.

---

### Phone Book Source Example

This example adds a simple phone book. It lets players search a person's name, alias, organization, role, or phone number and return the in-game phone number under `Contacts`.

The phone book is a built-in source. You register listings; you do not write the search function.

```ts
import { registerSpiderFootPhoneBookListing } from "./world/SpiderFootIntel";

registerSpiderFootPhoneBookListing({
    name: "Mara Vale",
    phoneNumber: "555-0134",
    aliases: ["mara", "m vale"],
    organization: "Example Bank",
    role: "Chief Financial Officer",
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
});

registerSpiderFootPhoneBookListing({
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
});
```

A listing is matched when the query appears anywhere in its name, phone number, location, or aliases. Listings are keyed by `phoneNumber`, falling back to `name`, so registering the same number twice replaces the earlier listing. Remove one with `unregisterSpiderFootPhoneBookListing("555-0134")`.

Each field is gated by the listing's own visibility:

| Field | Requires |
|---|---|
| `name`, `phoneNumber` | `surfaceContacts` |
| `website` | `surfaceInfrastructure` and `surfaceDomains` |
| `location` | `surfaceLocations` |
| `organization`, `role` | `surfaceReferences` |
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
  Phone book listing: Mara Vale - Example Bank
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
  Phone book listing: Mara Vale - Example Bank
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
