# Visibility Settings

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
