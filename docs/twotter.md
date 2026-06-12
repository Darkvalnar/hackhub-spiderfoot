# Twotter Integration

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

## Twotter Integration

SpiderFoot searches Twotter usernames directly with:

```ts
Twotter.getUserByUsername(username)
```

A query is converted into username candidates by:

- lowercasing
- removing a leading `@`
- replacing spaces, dots, and hyphens with `_`
- removing spaces, dots, underscores, and hyphens

Example:

```bash
spiderfoot victor hale
```

can try usernames like:

```text
victor hale
victor_hale
victorhale
```

If a Twotter user is found, SpiderFoot can return:

- `@username` under Social
- display name under Contacts
- bio under Web References
- `Verified public profile` under Web References if the account is verified

### Creating a Twotter Profile

```ts
import { Twotter } from "@hotbunny/hackhub-content-sdk";

const user = Twotter.createUser({
    username: "victor_hale",
    firstName: "Victor",
    lastName: "Hale",
    bio: "Executive at Example Bank.",
    verified: true,
});

Twotter.addUser(user);
```

Twotter itself does not require a manifest permission.

---
