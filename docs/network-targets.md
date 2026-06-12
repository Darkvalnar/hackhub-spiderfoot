# Network Target Registration

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

## Network Target Registration

Network targets are not indexed automatically. SpiderFoot only checks network records that can resolve visibility through `registerSpiderFootNetworkTarget(...)`.

Use this for:

- servers
- databases
- mail gateways
- internal systems
- quest-specific infrastructure
- NPC-associated infrastructure

### Registration Shape

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "company-db",
    ip: "198.51.100.42",
    domain: "db.example-bank.com",
    name: "Company Database",

    visibility: {
        surface: true,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: true,
        surfaceReferences: true,
    },
});
```

`sourceKey` and `ip` are required. If either is missing after normalization, registration does nothing.

`domain` and `name` are optional.

---

## What Network Registration Stores

`registerSpiderFootNetworkTarget(...)` stores visibility data and lookup mappings.

It does not create a network device, website, page, or document.

Internally it stores:

- `sourceKey -> visibility`
- `ip -> sourceKey`
- `domain -> sourceKey`
- `name -> sourceKey`

Visibility lookup order is:

1. Domain
2. IP
3. Name

```ts
(domain ? sourceKeyByDomain.get(domain) : undefined)
    ?? (ip ? sourceKeyByIp.get(ip) : undefined)
    ?? (name ? sourceKeyByName.get(name) : undefined)
```

---

## Creating a Network Target with the HackHub SDK

SpiderFoot searches subnets returned by:

```ts
Network.getAllSubnets()
```

The network target must exist in the HackHub network system, and the SpiderFoot registration must match that network target.

Example:

```ts
import {
    Network,
    NetworkDeviceType,
} from "@hotbunny/hackhub-content-sdk";

import {
    registerSpiderFootNetworkTarget,
} from "./SpiderFootNetworkRegistry";

const dbIp = Network.randomIp();

Network.createSubnetNetwork({
    ip: dbIp,
    type: NetworkDeviceType.Device,
    name: "Company Database",
    domain: {
        name: "db.example-bank.com",
    },
    location: {
        latitude: "37.7601",
        longitude: "-122.4201",
        city: "Port Azure",
        country: "In-Game",
    },
    ports: [
        {
            external: 3306,
            internal: 3306,
            active: true,
            service: "mysql",
            version: "ledgerdb/8.0",
        },
    ],
    users: [
        Network.createUser({
            username: "db.view",
            password: "ledger-read",
            firstName: "Database",
            lastName: "Viewer",
            email: {
                address: "db.view@example-bank.com",
                password: "mail-password",
            },
            online: true,
        }),
    ],
});

registerSpiderFootNetworkTarget({
    sourceKey: "company-db",
    ip: dbIp,
    domain: "db.example-bank.com",
    name: "Company Database",

    visibility: {
        surface: true,
        surfaceContacts: true,
        surfaceEmails: true,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: true,
        surfaceLocations: true,
        surfaceReferences: true,
        surfaceNetworkUsers: true,
    },
});
```

Important:

- The `ip` in the registration must match the network device IP.
- The `domain` in the registration should match `domain.name` on the network device.
- The `name` in the registration should match `name` on the network device if players should search by name.
- Registering a name alone does not create a searchable network name. SpiderFoot compares the query to the actual subnet `name`.

---

## Network Search Behavior

SpiderFoot performs exact network matching.

It can match:

- exact IP
- exact domain
- exact subnet name
- exact network user email address

Examples:

```bash
spiderfoot 198.51.100.42
spiderfoot db.example-bank.com
spiderfoot Company Database
spiderfoot db.view@example-bank.com
```

When the subnet itself matches by IP, domain, or name:

- `surfaceInfrastructure` + `surfaceIps` allows the IP.
- `surfaceInfrastructure` + `surfaceDomains` allows the domain.
- `surfaceLocations` allows `city, country` from the subnet location.
- `surfaceReferences` allows a network association reference.

When a user email matches, or when a matching subnet contains users:

- `surfaceNetworkUsers` + `surfaceContacts` allows the full name.
- `surfaceEmails` allows the email address.
- `surfaceSocial` may perform a Twotter lookup from the full name.
- `surfaceInfrastructure` settings may show IP and domain.
- `surfaceReferences` may show that the user is listed on the domain.

---
