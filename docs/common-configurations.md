# Common Configurations

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

## Common Website Configurations

### Public Organization

```ts
spiderfoot: {
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

### Website Only

```ts
spiderfoot: {
    surface: true,
    surfaceSocial: true,
    surfaceContacts: true,
    surfaceEmails: true,
    surfaceInfrastructure: false,
    surfaceDomains: false,
    surfaceIps: false,
    surfaceLocations: true,
    surfaceReferences: true,
    surfaceNetworkUsers: false,
}
```

### Hidden Website

```ts
spiderfoot: {
    surface: false,
}
```

### Technical Website

```ts
spiderfoot: {
    surface: true,
    surfaceSocial: false,
    surfaceContacts: false,
    surfaceEmails: false,
    surfaceInfrastructure: true,
    surfaceDomains: true,
    surfaceIps: true,
    surfaceLocations: false,
    surfaceReferences: true,
    surfaceNetworkUsers: false,
}
```

---

## Common Network Configurations

### Hidden Network Target

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "secret-server",
    ip: secretIp,
    visibility: {
        surface: false,
    },
});
```

### Infrastructure-Only Target

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "internal-db",
    ip: databaseIp,
    domain: "db.example-bank.com",
    name: "Internal Database",

    visibility: {
        surface: true,
        surfaceSocial: false,
        surfaceContacts: false,
        surfaceEmails: false,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: true,
        surfaceLocations: false,
        surfaceReferences: true,
        surfaceNetworkUsers: false,
    },
});
```

### Discoverable Staff System

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "staff-portal",
    ip: portalIp,
    domain: "staff.example-bank.com",
    name: "Staff Portal",

    visibility: {
        surface: true,
        surfaceSocial: true,
        surfaceContacts: true,
        surfaceEmails: true,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: false,
        surfaceLocations: true,
        surfaceReferences: true,
        surfaceNetworkUsers: true,
    },
});
```

---
