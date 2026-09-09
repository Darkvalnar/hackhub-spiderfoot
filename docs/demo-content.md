# Demo Content

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

## Demo Content

SpiderFoot ships a small NexaCorp example: a website, a network host, two Twotter accounts, two phone book listings, and the Signal Hunt demo quest.

All of it is behind the **Load NexaCorp demo content** mod setting, which is **off by default**. With it off, `nexacorp.com` does not resolve, nothing NexaCorp appears in search results, and the demo quest is never offered.

Turn it on to explore a working example, and leave it off when SpiderFoot is a dependency of your own mod, so the example content stays out of your world.

The setting is read once when the mod loads. Toggling it takes effect on the next load.

### Updating from an earlier version

The toggle is new, and it defaults to off. If you had the demo content before, it will be gone after updating until you switch the setting on.

That matters if a player is part way through the Signal Hunt demo quest. The quest is only offered while the setting is on, so a new player never gets a quest they cannot finish, but a save that already started one will find that `nexacorp.com` no longer resolves. Switching the setting back on restores it.
