# SpiderFoot Documentation

SpiderFoot is a terminal command for discovering mod content from websites, Twotter profiles, and registered network targets.

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
