# Files and Permissions

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

## Files

SpiderFoot is implemented by four TypeScript files:

| File | Purpose |
|---|---|
| `SpiderFootCommand.ts` | Registers the `spiderfoot` command and prints results |
| `SpiderFootIntel.ts` | Searches Twotter, website documents, and registered network targets |
| `SpiderFootNetworkRegistry.ts` | Defines visibility settings and registers network targets |
| `SpiderFootBridge.ts` | Sends and receives targets between separate mods |

The first three are all you need. `SpiderFootBridge.ts` is only for moving targets between separate mods.

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

Clean raw copies of the three files, without demo content or the phone book source, are available in the `public/` folder. These are the recommended starting point for integrating SpiderFoot into your own mod.

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
