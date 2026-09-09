# Depending on the SpiderFoot Mod

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

## Depending on the SpiderFoot Mod

There are two ways to use SpiderFoot in your mod.

**Copy the files in** (the [Quick Start](quick-start.md)). SpiderFoot becomes part of your mod. You import `registerSpiderFootSite()` and the rest directly, and everything works offline from your own code. Best for a self-contained mod.

**Depend on the SpiderFoot mod instead.** The player installs SpiderFoot separately, you list it in your `manifest.json` dependencies, and you send it your targets. You copy no files. Best when you do not want to maintain a copy, or when the player may already have SpiderFoot installed for other mods, since two copies would both try to register the `spiderfoot` command.

This page covers the second option.

You cannot `import` from another mod, so you send your targets through `SharedVariables` instead. Declare the dependency first:

```json
"dependencies": ["spiderfoot"]
```

SpiderFoot then picks up your targets from five keys:

| Key | Holds |
|---|---|
| `spiderfoot.intel` | `SpiderFootIntelRegistration[]` |
| `spiderfoot.sites` | `SpiderFootSiteEntry[]` |
| `spiderfoot.documents` | `SpiderFootDocumentRegistration[]` |
| `spiderfoot.phonebook` | `SpiderFootPhoneBookListing[]` |
| `spiderfoot.network.targets` | `SpiderFootNetworkRegistration[]` |

Each key holds an object keyed by contributing mod id, **not** a bare array:

```ts
SharedVariables.set("spiderfoot.intel", {
    "your-mod-id": [
        {
            keys: ["harbor logistics", "harbor"],
            match: "loose",
            results: [{ category: "contacts", value: "Ines Duarte" }],
        },
    ],
});
```

The per-mod slot matters. Each key is last-write-wins, so two mods writing a bare array would overwrite each other. Read the current object, add your own slot, and write back a **new** object. Do not mutate the stored one in place. SpiderFoot detects changes by comparing object identity, so an in-place mutation is not seen.

### These contributions do not persist

`SharedVariables` is session-only; it is cleared when the game closes. That is deliberate. Your mod's own state lives in `SaveStorage`, and you republish from it on load, so nothing here needs saving, and none of it bloats the player's save file.

**Register your contributions every time your mod loads.** If you only publish once when some quest starts, your content disappears after the player restarts.

If you also keep a copy of `SpiderFootBridge.ts` in your mod, it writes those keys for you:

```ts
import { publishSpiderFootContributions } from "./world/SpiderFootBridge";

publishSpiderFootContributions("your-mod-id", {
    intel: [...],
    sites: [...],
    documents: [...],
    phoneBook: [...],
    networkTargets: [...],
});
```

Call it again with the full current set whenever your content changes. Entries you drop are unregistered automatically; other mods' contributions are untouched. `withdrawSpiderFootContributions("your-mod-id")` removes everything you contributed.

### Content that changes during play

SpiderFoot emits `SpiderFoot.SearchStarting` with the query immediately before it reads your targets, and event handlers run synchronously. So if your content depends on live game state, such as pages that only exist after a quest completes, republish from that handler and SpiderFoot will see the fresh version in the same search:

```ts
Events.on("SpiderFoot.SearchStarting", () => {
    publishSpiderFootContributions("your-mod-id", { documents: buildDocumentsNow() });
});
```

Do not snapshot state-dependent content once at load. Anything gated behind player progress would be frozen at its start-of-session value.

### Load order does not matter

SpiderFoot re-reads shared storage immediately before every search, so it does not matter whether your mod loads before or after SpiderFoot. There is no handshake to wait for and no need to listen for `SpiderFoot.Ready` before publishing.

### Publishing website content across the boundary

`registerSpiderFootWebsite()` takes a class constructor, which cannot cross a mod boundary. Publish rendered pages instead, one document per page you want indexed:

```ts
publishSpiderFootContributions("your-mod-id", {
    documents: [
        {
            host: "harbor-logistics.com",
            path: "/contact",
            title: "Contact",
            description: "Reach the Harbor Logistics operations desk.",
            html: "<p>Email ops@harbor-logistics.com or find us at @harbor_ops.</p>",
            visibility: {
                surface: true,
                surfaceReferences: true,
                surfaceContacts: true,
                surfaceEmails: true,
                surfaceSocial: true,
            },
        },
    ],
});
```

Documents are parsed exactly like website class pages: emails, social handles, locations, and snippets are extracted from the HTML. The `seo: true` requirement does not apply, because you are choosing the pages explicitly.

If `visibility` is omitted, the document inherits the visibility of a registered site entry with the same host, falling back to the default.

Documents are keyed by host plus path, so republishing the same page replaces it.
