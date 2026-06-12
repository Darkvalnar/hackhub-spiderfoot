# Quick Start

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

## Quick Start

**1. Copy the three files from the `public/` folder into your mod.**

`SpiderFootCommand.ts` goes in your mod's `commands/` folder:

```
your-mod/
  src/
    commands/
      SpiderFootCommand.ts
```

`SpiderFootIntel.ts` and `SpiderFootNetworkRegistry.ts` can go anywhere. This mod puts them in a `world/` folder, but that is not required. If you place them somewhere else, update the import at the top of `SpiderFootCommand.ts`:

```ts
// default — assumes the other two files are in ../world/ relative to the commands folder
import {
    searchSpiderFoot,
    type SpiderFootCategory,
    type SpiderFootResult,
} from "../world/SpiderFootIntel";
```

Change the path to wherever you placed `SpiderFootIntel.ts`.

**2. Import `SpiderFootCommand` in your mod's entry point.**

The `@RegisterCommand` decorator only fires when the module is imported. Add this line to your `index.ts` (or whichever file is your mod entry point):

```ts
import "./commands/SpiderFootCommand";
```

The command is now registered and players can run `spiderfoot <target>` from the terminal. Continue reading to add your own targets to it.

---
