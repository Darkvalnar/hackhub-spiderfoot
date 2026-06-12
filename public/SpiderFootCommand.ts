import {
    Command,
    type CommandAutoComplete,
    Events,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import {
    searchSpiderFoot,
    type SpiderFootCategory,
    type SpiderFootResult,
} from "../world/SpiderFootIntel";

function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function stage(tools: any, text: string): Promise<void> {
    tools.println({ text, color: "cyan" });
    await tools.sleep(random(700, 1600));
}

function valuesFor(
    results: SpiderFootResult[],
    category: SpiderFootCategory,
): string[] {
    const seen = new Set<string>();
    const values: string[] = [];

    for (const result of results) {
        if (result.category !== category) {
            continue;
        }

        const clean = result.value.trim();
        const key = clean.toLowerCase();

        if (!clean || seen.has(key)) {
            continue;
        }

        seen.add(key);
        values.push(clean);
    }

    return values;
}

function printSection(
    tools: any,
    title: string,
    values: string[],
): void {
    tools.newLine();
    tools.println({ text: title, color: "cyan" });

    if (!values.length) {
        tools.println("No data found.");
        return;
    }

    for (const value of values) {
        tools.println(`  ${value}`);
    }
}

@RegisterCommand
export class SpiderFootCommand extends Command {
    CommandName = "spiderfoot";
    Description = "Open source intelligence gathering";

    Autocomplete: CommandAutoComplete[] = [
        { label: "spiderfoot", type: "STRING" },
        { label: "<target>", type: "STRING" },
    ];

    async Run(tools: any): Promise<void> {
        const query = tools.getArgs().join(" ").trim();

        if (!query || query === "-h" || query === "--help") {
            tools.println("Usage: spiderfoot <target>");
            tools.println("Examples:");
            tools.println("  spiderfoot victor hale");
            tools.println("  spiderfoot @victor_hale");
            tools.println("  spiderfoot example bank");
            tools.println("  spiderfoot security@example-bank.com");
            tools.println("  spiderfoot 198.51.100.42");
            return;
        }

        tools.println({ text: "======================================================", color: "red" });
        tools.println([
            { text: "=================", color: "red", dim: true },
            { text: "S P I D E R F O O T", color: "red", bold: true },
            { text: "==================", color: "red", dim: true },
        ]);
        tools.println([
            { text: "===============", color: "red", dim: true },
            { text: "Open Source Intelligence", color: "cyan" },
            { text: "===============", color: "red", dim: true },
        ]);
        tools.println({ text: "======================================================", color: "red" });
        tools.newLine();

        tools.printInfo(`Target: ${query}`);
        tools.println(`Investigation ID: sf-${Date.now().toString(36)}`);
        tools.newLine();

        await stage(tools, "[+] Initializing passive collection modules...");
        await stage(tools, "[+] Searching approved public website content...");
        await stage(tools, "[+] Correlating social records...");
        await stage(tools, "[+] Mapping contact and location references...");
        await stage(tools, "[+] Building intelligence report...");

        const results = searchSpiderFoot(query);

        tools.newLine();

        if (!results.length) {
            tools.printWarning("No intelligence records found.");
            Events.emit("SpiderFoot.Search", {
                query,
                results: [],
            });
            return;
        }

        tools.printSuccess("[OK] Intelligence report complete.");

        printSection(tools, "Social", valuesFor(results, "social"));
        printSection(tools, "Contacts", valuesFor(results, "contacts"));
        printSection(tools, "Infrastructure", valuesFor(results, "infrastructure"));
        printSection(tools, "Locations", valuesFor(results, "locations"));
        printSection(tools, "Web References", valuesFor(results, "references"));

        Events.emit("SpiderFoot.Search", {
            query,
            results,
        });
    }
}
