# Command Event

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

SpiderFoot also emits `SpiderFoot.Ready` once, when the mod finishes loading. Its payload carries the shared storage key names described below.
