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
- [Depending on the SpiderFoot Mod](depending-on-spiderfoot.md)
- [Demo Content](demo-content.md)
- [Troubleshooting](troubleshooting.md)
- [Implementation Reference](implementation-reference.md)

---

## Quick Start

This adds SpiderFoot to your mod by copying its files in, which is what most mods want. If you would rather depend on the separately installed SpiderFoot mod instead of keeping a copy, see [Depending on the SpiderFoot Mod](depending-on-spiderfoot.md).

**1. Copy the SpiderFoot files from the `public/` folder into your mod.**

Three files are required. `SpiderFootBridge.ts` is a fourth, optional one, needed
only if you also want to receive contributions from other mods or publish to a
separately installed SpiderFoot. The three below do not import it, so leaving it
out changes nothing.

`SpiderFootCommand.ts` goes in your mod's `commands/` folder:

```
your-mod/
  src/
    commands/
      SpiderFootCommand.ts
```

`SpiderFootIntel.ts` and `SpiderFootNetworkRegistry.ts` can go anywhere. This mod puts them in a `world/` folder, but that is not required. If you place them somewhere else, update the import at the top of `SpiderFootCommand.ts`:

```ts
// default: assumes the other two files are in ../world/ relative to the commands folder
import {
    searchSpiderFoot,
    type SpiderFootCategory,
    type SpiderFootResult,
} from "../world/SpiderFootIntel";
```

Change the path to wherever you placed `SpiderFootIntel.ts`. `SpiderFootBridge.ts`
imports from both of the other two, so if you take it, keep it beside them or
update its imports the same way.

**2. Import `SpiderFootCommand` in your mod's entry point.**

The `@RegisterCommand` decorator only fires when the module is imported. Add this line to your `index.ts` (or whichever file is your mod entry point):

```ts
import "./commands/SpiderFootCommand";
```

That is it. Players can now run `spiderfoot <target>` in your mod, and you are ready to [add your own targets](custom-data-sources.md).

If you would rather not keep a copy of these files in your mod, there is a second option: have the player install SpiderFoot as its own mod and send your targets to it. See [Depending on the SpiderFoot Mod](depending-on-spiderfoot.md).
