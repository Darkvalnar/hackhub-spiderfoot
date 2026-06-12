# Troubleshooting

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

## Troubleshooting

| Problem | Check |
|---|---|
| The command does not exist | Confirm `SpiderFootCommand` is included in the mod and decorated with `@RegisterCommand` |
| Search returns no results | Confirm the target is indexed and `surface` is not `false` |
| Website page does not appear | Confirm the website class is in `WEBSITE_CLASSES` and the page has `seo: true` |
| SPIDERFOOT_INDEXED_SITES entry does not appear | Confirm the entry has `surface` enabled or no hidden visibility override |
| Emails do not appear | Confirm `surfaceEmails: true` or `surfaceContacts: true` |
| Social handles do not appear | Confirm `surfaceSocial: true` and the handle appears near the matched text |
| IPs do not appear | Confirm `surfaceInfrastructure: true` and `surfaceIps: true` |
| Domains do not appear | Confirm `surfaceInfrastructure: true` and `surfaceDomains: true` |
| Network users do not appear | Confirm `surfaceNetworkUsers: true` and `surfaceContacts: true` |
| Network target cannot be found by name | Confirm the actual network device `name` matches the searched name |
| Network target cannot be found by domain | Confirm the actual network device has `domain: { name: "..." }` and the registration uses the same domain |
| Network target cannot be found by IP | Confirm the registered IP matches the network device IP |

---
