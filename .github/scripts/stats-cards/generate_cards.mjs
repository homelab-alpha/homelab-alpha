#!/usr/bin/env node
// Generates the profile cards (SVG) from the GitHub API.
//
// Usage:
//   node generate_cards.mjs [--out <directory>] [--sample] [--publish]
//
//   --out      Directory the SVG files are written to (default: cards).
//   --sample   Use made-up data instead of the GitHub API (offline preview).
//   --publish  Commit the cards to the stats branch (needs GH_TOKEN and
//              GITHUB_REPOSITORY, see config.mjs for the branch name).

import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { buildCards } from "./build_cards.mjs";
import { config } from "./config.mjs";
import { loadIcons, loadLogos } from "./icons.mjs";
import { fetchContributionDays, fetchGists, fetchRepositories, fetchStats } from "./github_api.mjs";
import { publishCards } from "./publish_branch.mjs";
import { sampleData } from "./sample_data.mjs";

async function collectData() {
  const [stats, pins, gists, days] = await Promise.all([
    fetchStats(config.username),
    fetchRepositories(config.username, config.pinnedRepositories),
    fetchGists(config.username, config.gists),
    fetchContributionDays(config.username),
  ]);

  const { repositories, ...totals } = stats;

  return { stats: totals, repositories, pins, gists, days };
}

async function writeSummary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      out: { type: "string", default: "cards" },
      sample: { type: "boolean", default: false },
      publish: { type: "boolean", default: false },
    },
  });

  if (values.publish && values.sample) {
    throw new Error("Refusing to publish sample data. Use either --sample or --publish.");
  }

  const icons = await loadIcons(process.cwd(), config);
  const logos = await loadLogos(process.cwd(), config);
  const data = { ...(values.sample ? sampleData : await collectData()), icons, logos };
  const cards = buildCards(data, config);

  await mkdir(values.out, { recursive: true });

  for (const card of cards) {
    await writeFile(path.join(values.out, card.name), card.svg);
  }

  console.log(`Generated ${cards.length} cards in ${values.out}.`);

  const summary = ["## Stats Cards", "", `Generated **${cards.length}** cards for \`${config.username}\`.`];

  if (values.publish) {
    const repository = process.env.GITHUB_REPOSITORY;

    if (!repository) {
      throw new Error("GITHUB_REPOSITORY is not set; cannot publish.");
    }

    const result = await publishCards({
      repository,
      branch: config.branch,
      directory: config.outputDirectory,
      cards,
    });

    if (result.createdBranch) {
      console.log(`Created branch ${config.branch}.`);
      summary.push("", `Created the \`${config.branch}\` branch.`);
    }

    if (result.committed) {
      console.log(`Committed ${result.added} added/changed and ${result.removed} removed file(s): ${result.url}`);
      summary.push(
        "",
        `Committed ${result.added} added or changed and ${result.removed} removed file(s): ${result.url}`,
      );
    } else {
      console.log("All cards are already up to date; nothing to commit.");
      summary.push("", "All cards are already up to date; nothing was committed.");
    }
  }

  await writeSummary(summary);
}

main().catch((error) => {
  console.error(`::error title=Stats cards failed::${error.message}`);
  process.exitCode = 1;
});
