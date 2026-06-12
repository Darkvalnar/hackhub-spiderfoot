# How SpiderFoot Searches

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

## How SpiderFoot Searches

`searchSpiderFoot(query)` combines results from four functions:

```ts
return uniqueResults([
    ...searchTwotter(clean),
    ...searchWebDocuments(clean),
    ...searchNetworkExact(clean),
    ...searchPhoneBook(clean),
]);
```

SpiderFoot searches:

1. Twotter usernames
2. Indexed website content
3. Exact network matches
4. Phone book listings

Duplicate results are removed by category and value.

The phone book source is included in this mod as a customization example. The raw files in `public/` contain only the three built-in sources. See the **Custom SpiderFoot Data Sources** section for how the phone book was added and how to write your own sources.

---
