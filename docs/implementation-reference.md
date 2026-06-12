# Implementation Reference

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

## Implementation Reference

This guide is based on the following implementation behavior:

| Behavior | Source file |
|---|---|
| Command name, help examples, printed sections, event emission | `SpiderFootCommand.ts` |
| Twotter search, website indexing, SPIDERFOOT_INDEXED_SITES indexing, network exact search | `SpiderFootIntel.ts` |
| Visibility defaults, hidden visibility, network registration, visibility lookup order | `SpiderFootNetworkRegistry.ts` |
