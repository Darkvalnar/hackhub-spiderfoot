

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

`registerSpiderFootNetworkTarget(...)` stores the registered target and its visibility settings in memory.

It does not create a network device, website, page, or document.

Internally it stores:

- `sourceKey -> visibility`
- `ip -> sourceKey`
- `domain -> sourceKey`
- `name -> sourceKey`
- `sourceKey -> registered target`

The stored target contains its registered IP, optional domain, optional name, and normalized visibility settings.  
  
This allows SpiderFoot to surface a registered target immediately when the player searches its exact IP, domain, or name. It does not need to wait for a newly created HackHub network to become available through `Network.getAllSubnets()`.

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

`registerSpiderFootNetworkTarget(...)` registers a network target with SpiderFoot. It does not create the actual HackHub network device.

When a target should exist as a connectable or hackable network, create it with the HackHub `Network` API and then register the same target with SpiderFoot.

These two operations serve different purposes:

- `Network.createSubnetNetwork(...)` creates the actual in-game network device.
- `registerSpiderFootNetworkTarget(...)` controls whether and how that network can be surfaced through SpiderFoot.

SpiderFoot stores the IP, domain, name, and visibility settings passed to `registerSpiderFootNetworkTarget(...)`. This allows exact searches for the registered IP, domain, or name to surface the target immediately.

SpiderFoot also searches matching loaded subnets returned by:

```
Network.getAllSubnets()
```

The loaded HackHub subnet provides additional network data such as:

- location information
- network users
- user email addresses
- social-profile correlations
- other data stored on the subnet

For a complete connectable or hackable target, the HackHub network and SpiderFoot registration should use the same IP, domain, and name.

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

In this example:

- `Network.createSubnetNetwork(...)` creates an actual network device.
- `registerSpiderFootNetworkTarget(...)` does not create a second device.
- The SpiderFoot registration associates the existing target with its OSINT visibility rules.
- The same generated `dbIp` is passed to both functions, ensuring that SpiderFoot results refer to the actual HackHub network.

### Immediate Registered-Target Results

SpiderFoot can immediately match a target by its exact registered:

- IP
- domain
- name

For example:

```
spiderfoot db.example-bank.com
```

can immediately surface:

```
Infrastructure
  <generated database IP>
  db.example-bank.com
```

provided that:

```
surface: true
surfaceInfrastructure: true
surfaceIps: true
surfaceDomains: true
```

are enabled.

This immediate lookup uses the values supplied to `registerSpiderFootNetworkTarget(...)`. It does not require the newly created subnet to already be returned by `Network.getAllSubnets()`.

### Loaded Subnet Results

SpiderFoot also checks the actual HackHub subnet through `Network.getAllSubnets()`.

Once the subnet is available there, SpiderFoot can use the data stored on the network device to surface additional information.

Depending on the visibility configuration, this can include:

- the subnet location
- network-user names
- network-user email addresses
- Twotter profiles associated with network users
- references connecting users to the network
- the subnet IP and domain

The directly registered target and the loaded HackHub subnet represent the same network. SpiderFoot removes duplicate results when both lookup paths return the same IP or domain.

### Matching the Registration to the Network

The values passed to `registerSpiderFootNetworkTarget(...)` should match the actual HackHub network:

- `ip` should match the network device IP.
- `domain` should match `domain.name` on the network device.
- `name` should match `name` on the network device.
- `sourceKey` should uniquely identify this SpiderFoot registration.

Using the same values keeps immediate registered-target results consistent with results retrieved later from the loaded HackHub subnet.

The `sourceKey` is an internal SpiderFoot identifier. It does not need to match the domain, IP, or network name, but it must be stable and unique within the mod.

### Registering a SpiderFoot-Only Target

A mod author may register a target with SpiderFoot without creating a HackHub subnet:

```ts
registerSpiderFootNetworkTarget({
    sourceKey: "external-provider",
    ip: "203.0.113.24",
    domain: "status.example-provider.com",
    name: "Example Provider",

    visibility: {
        surface: true,
        surfaceInfrastructure: true,
        surfaceDomains: true,
        surfaceIps: true,
        surfaceReferences: true,
    },
});
```

This makes the registered IP, domain, name, and network association searchable through SpiderFoot.

However, because no HackHub subnet exists, the target will not be connectable or hackable, and SpiderFoot cannot retrieve subnet-only information such as:

- network users
- user email accounts
- ports and services
- subnet location data
- other runtime network properties

Use this approach only when the target is intended to exist as OSINT information rather than as an actual in-game network device.

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

SpiderFoot first checks targets registered directly through `registerSpiderFootNetworkTarget(...)`.  
  
A direct registered-target match can immediately surface:  
  
- the registered IP when `surfaceInfrastructure` and `surfaceIps` are enabled  
- the registered domain when `surfaceInfrastructure` and `surfaceDomains` are enabled  
- a network association reference when `surfaceReferences` is enabled  
  
SpiderFoot then checks loaded HackHub subnets through `Network.getAllSubnets()` for additional subnet information.

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
