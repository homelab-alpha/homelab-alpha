// Unit tests for the stats cards. Run with:
//   node --test .github/scripts/stats-cards/cards.test.mjs
// No network access is needed; the GitHub API is replaced by a fake fetch.

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { buildCards, slug } from "./build_cards.mjs";
import { config } from "./config.mjs";
import { pickIcon } from "./icons.mjs";
import {
  addDays,
  aggregateLanguages,
  computeWeeklyStreaks,
  formatDateRange,
  formatNumber,
  startOfWeek,
} from "./calculations.mjs";
import { fetchContributionDays, fetchGists, fetchRepositories } from "./github_api.mjs";
import { gitBlobSha, publishCards } from "./publish_branch.mjs";
import { sampleData } from "./sample_data.mjs";
import { escapeXml, truncate, wrapText } from "./svg_cards.mjs";

// Builds a week of days (Sunday to Saturday) with one contribution on Tuesday
// when the week is active.
function weekDays(sunday, active) {
  return Array.from({ length: 7 }, (_, offset) => ({
    date: addDays(sunday, offset),
    count: active && offset === 2 ? 1 : 0,
  }));
}

// Weeks start on 2026-09-13 (a Sunday); pattern is a list of 1 (active) and 0.
function daysFromPattern(pattern) {
  return pattern.flatMap((active, index) => weekDays(addDays("2026-09-13", index * 7), active === 1));
}

describe("dates and numbers", () => {
  it("finds the Sunday that starts a week", () => {
    assert.equal(startOfWeek("2026-10-28"), "2026-10-25");
    assert.equal(startOfWeek("2026-10-25"), "2026-10-25");
    assert.equal(startOfWeek("2026-10-31"), "2026-10-25");
  });

  it("formats numbers and date ranges", () => {
    assert.equal(formatNumber(1280), "1,280");
    assert.equal(formatDateRange("2026-03-03", "2026-10-24"), "Mar 3 – Oct 24, 2026");
    assert.equal(formatDateRange("2025-12-30", "2026-01-06"), "Dec 30, 2025 – Jan 6, 2026");
    assert.equal(formatDateRange(null, null), "No streak yet");
  });
});

describe("computeWeeklyStreaks", () => {
  it("counts the current streak and the longest streak", () => {
    const { current, longest } = computeWeeklyStreaks(daysFromPattern([1, 1, 0, 1, 1, 1]));

    assert.equal(current.length, 3);
    assert.equal(current.start, "2026-10-06");
    assert.equal(current.end, "2026-10-20");
    assert.equal(longest.length, 3);
  });

  it("keeps the streak alive while the current week is still empty", () => {
    const { current } = computeWeeklyStreaks(daysFromPattern([1, 1, 1, 0]));

    assert.equal(current.length, 3);
  });

  it("ends the current streak after a full empty week", () => {
    const { current, longest } = computeWeeklyStreaks(daysFromPattern([1, 1, 0, 0]));

    assert.equal(current.length, 0);
    assert.equal(longest.length, 2);
  });

  it("does not bridge weeks that are missing from the data", () => {
    const days = [...weekDays("2026-09-13", true), ...weekDays("2026-09-27", true)];

    assert.equal(computeWeeklyStreaks(days).longest.length, 1);
  });

  it("prefers the most recent streak on a tie", () => {
    const { longest } = computeWeeklyStreaks(daysFromPattern([1, 1, 0, 1, 1]));

    assert.equal(longest.length, 2);
    assert.equal(longest.start, "2026-10-06");
  });

  it("handles an empty calendar", () => {
    const { current, longest } = computeWeeklyStreaks([]);

    assert.equal(current.length, 0);
    assert.equal(longest.length, 0);
  });
});

describe("aggregateLanguages", () => {
  const repositories = [
    {
      name: "a",
      languages: {
        edges: [
          { size: 600, node: { name: "Shell", color: "#89e051" } },
          { size: 100, node: { name: "Python", color: null } },
        ],
      },
    },
    { name: "b", languages: { edges: [{ size: 300, node: { name: "Shell", color: "#89e051" } }] } },
    { name: "c", languages: { edges: [{ size: 5000, node: { name: "Go", color: "#00ADD8" } }] } },
  ];

  it("combines sizes and orders by size", () => {
    const result = aggregateLanguages(repositories, { limit: 6 });

    assert.deepEqual(
      result.map((language) => language.name),
      ["Go", "Shell", "Python"],
    );
    assert.equal(result[1].size, 900);
    assert.equal(Math.round(result.reduce((sum, language) => sum + language.percent, 0)), 100);
  });

  it("supports exclusions, a limit and a fallback color", () => {
    const result = aggregateLanguages(repositories, {
      excludedRepositories: ["C"],
      excludedLanguages: ["shell"],
      limit: 1,
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].name, "Python");
    assert.equal(result[0].percent, 100);
    assert.match(result[0].color, /^#[0-9A-F]{6}$/i);
  });
});

describe("text helpers", () => {
  it("escapes XML", () => {
    assert.equal(
      escapeXml(`<a href="x">Tom & 'Jerry'</a>`),
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;",
    );
  });

  it("wraps text and ends the last line with an ellipsis", () => {
    const lines = wrapText("one two three four five six seven eight nine ten eleven twelve", 120, 13, 2);

    assert.equal(lines.length, 2);
    assert.ok(lines[1].endsWith("…"));
  });

  it("keeps short text on one line and truncates long words", () => {
    assert.deepEqual(wrapText("short text", 300, 13, 3), ["short text"]);
    assert.ok(truncate("a".repeat(200), 100, 13).endsWith("…"));
  });

  it("creates file name slugs", () => {
    assert.equal(slug("shell-script"), "shell_script");
    assert.equal(slug("Notifications"), "notifications");
  });
});

describe("buildCards", () => {
  const icons = { "bash_dark.svg": "data:image/svg+xml;base64,AAAA", "docker.svg": "data:image/svg+xml;base64,BBBB" };
  const cards = buildCards({ ...sampleData, icons });
  const svgOf = (name) => cards.find((card) => card.name === name).svg;

  it("creates a dark and a light version of every card", () => {
    const names = [
      "activity_side",
      "gist_notifications",
      "notes",
      "pin_docker",
      "pin_kairos",
      "pin_openssl",
      "pin_shell_script",
      "stats",
      "terminal",
      "tiles",
      ...config.sections.map((section) => `section_${slug(section)}`),
      ...config.skillGroups.map((group) => `skills_${slug(group.name)}`),
      ...config.skillGroups.flatMap((group) => group.skills.map((skill) => `skill_${slug(skill.name)}`)),
      ...config.connect.map((item) => `connect_${slug(item.key)}`),
      ...config.community.map((item) => `community_${slug(item.key)}`),
    ];

    assert.deepEqual(
      cards.map((card) => card.name).sort(),
      names.flatMap((name) => [`${name}_dark.svg`, `${name}_light.svg`]).sort(),
    );
  });

  it("keeps a transparent margin of 8 pixels around every card", () => {
    const widths = new Map();

    for (const card of cards) {
      const [, width, height] = card.svg.match(/<svg [^>]*width="(\d+)" height="(\d+)"/);

      widths.set(card.name.replace(/_(dark|light)\.svg$/, ""), Number(width));
      assert.ok(Number(height) > 16, card.name);
    }

    // Two half cards or three third cards fill one 816 pixel row.
    assert.equal(widths.get("pin_docker") * 2, 816);
    assert.equal(widths.get("stats") + widths.get("activity_side"), 816);
    assert.equal(widths.get("connect_github") * 3, 816);
    assert.equal(widths.get("community_dozzle") * 3, 816);
    assert.equal(widths.get("terminal"), 816);
    assert.equal(widths.get("tiles"), 816);
  });

  it("uses only lowercase file names with underscores", () => {
    for (const card of cards) {
      assert.match(card.name, /^[a-z0-9_]+\.svg$/);
    }
  });

  it("produces standalone SVG without broken values", () => {
    for (const card of cards) {
      assert.ok(card.svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), card.name);
      assert.ok(card.svg.trimEnd().endsWith("</svg>"), card.name);
      assert.doesNotMatch(card.svg, /NaN|undefined|null/, card.name);
      assert.doesNotMatch(card.svg, /https?:\/\/(?!www\.w3\.org)/, `${card.name} must not load external resources`);
    }
  });

  it("escapes descriptions from the API", () => {
    const kairos = svgOf("pin_kairos_dark.svg");

    assert.match(kairos, /&amp;/);
    assert.doesNotMatch(kairos, /<off>/);
  });

  it("uses the color scheme of the theme", () => {
    assert.match(svgOf("stats_dark.svg"), /#DFE2E6/);
    assert.match(svgOf("stats_light.svg"), /#3D4255/);
    assert.match(svgOf("terminal_dark.svg"), /#151b23/);
    assert.match(svgOf("terminal_light.svg"), /#f6f8fa/);
  });

  it("draws the terminal prompt and underlined links from the config", () => {
    const terminal = svgOf("terminal_dark.svg");

    assert.match(terminal, /┌──\(/);
    assert.match(terminal, /github-server/);
    assert.match(terminal, /whoami/);
    assert.equal((terminal.match(/text-decoration="underline"/g) ?? []).length, 4);
  });

  it("embeds the icon for the color scheme and falls back to the shared icon", () => {
    assert.match(svgOf("skill_bash_dark.svg"), /base64,AAAA/);
    assert.doesNotMatch(svgOf("skill_bash_light.svg"), /<image/);
    assert.match(svgOf("skill_docker_light.svg"), /base64,BBBB/);
    assert.equal(pickIcon(icons, "docker", "dark"), icons["docker.svg"]);
  });
});

describe("GitHub API", () => {
  const originalFetch = globalThis.fetch;
  let calls;
  let routes;

  beforeEach(() => {
    process.env.GH_TOKEN = "test-token";
    calls = [];
    routes = {};

    globalThis.fetch = async (url, init) => {
      const { pathname, search } = new URL(url);
      const body = init.body ? JSON.parse(init.body) : undefined;

      calls.push({ method: init.method, path: pathname, search, body });

      const handler = routes[`${init.method} ${pathname}`];

      if (!handler) {
        return new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
      }

      const result = await handler(body);

      return new Response(JSON.stringify(result.body), { status: result.status ?? 200 });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("matches the git blob hash", () => {
    // Same value as `printf 'hello\n' | git hash-object --stdin`.
    assert.equal(gitBlobSha("hello\n"), "ce013625030ba8dba906f756967f9e9ca394464a");
  });

  it("merges yearly contribution calendars and keeps the highest count per day", async () => {
    const calendar = (days) => ({
      body: {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: { weeks: [{ contributionDays: days }] },
            },
          },
        },
      },
    });

    routes["POST /graphql"] = (body) => {
      if (body.query.includes("contributionYears")) {
        return { body: { data: { user: { contributionsCollection: { contributionYears: [2026, 2025] } } } } };
      }

      return body.variables.from.startsWith("2025")
        ? calendar([
            { date: "2025-12-31", contributionCount: 4 },
            { date: "2025-12-30", contributionCount: 1 },
          ])
        : calendar([
            { date: "2025-12-31", contributionCount: 0 },
            { date: "2026-01-01", contributionCount: 2 },
          ]);
    };

    const days = await fetchContributionDays("someone", new Date("2026-01-02T00:00:00Z"));
    const byDate = Object.fromEntries(days.map((day) => [day.date, day.count]));

    assert.deepEqual(byDate, { "2025-12-30": 1, "2025-12-31": 4, "2026-01-01": 2 });
  });

  it("fails loudly when a pinned repository does not exist", async () => {
    routes["POST /graphql"] = () => ({ body: { data: { repository0: null } } });

    await assert.rejects(() => fetchRepositories("someone", ["missing"]), /someone\/missing was not found/);
  });

  it("fails loudly when a gist does not exist", async () => {
    routes["POST /graphql"] = () => ({ body: { data: { user: { gist0: null } } } });

    await assert.rejects(() => fetchGists("someone", [{ key: "x", id: "abc" }]), /Gist abc of someone was not found/);
  });

  it("surfaces GraphQL errors", async () => {
    routes["POST /graphql"] = () => ({ body: { errors: [{ message: "Bad credentials" }] } });

    await assert.rejects(() => fetchRepositories("someone", ["docker"]), /Bad credentials/);
  });

  describe("publishCards", () => {
    const repository = "owner/repo";
    const cards = [
      { name: "stats_dark.svg", svg: "<svg>dark</svg>" },
      { name: "stats_light.svg", svg: "<svg>light</svg>" },
    ];
    const options = { repository, branch: "stats", directory: "cards", cards };
    const mutations = () => calls.filter((call) => call.body?.query?.includes("createCommitOnBranch"));

    it("creates the branch and commits all cards when the branch is missing", async () => {
      routes["POST /repos/owner/repo/git/trees"] = () => ({ body: { sha: "tree-sha" } });
      routes["POST /repos/owner/repo/git/commits"] = (body) => {
        assert.deepEqual(body.parents, []);
        return { body: { sha: "root-sha" } };
      };
      routes["POST /repos/owner/repo/git/refs"] = (body) => {
        assert.equal(body.ref, "refs/heads/stats");
        return { body: {} };
      };
      routes["POST /graphql"] = () => ({
        body: { data: { createCommitOnBranch: { commit: { oid: "1", url: "u" } } } },
      });

      const result = await publishCards(options);
      const [{ body }] = mutations();

      assert.equal(result.createdBranch, true);
      assert.equal(result.committed, true);
      assert.equal(body.variables.input.expectedHeadOid, "root-sha");
      assert.equal(body.variables.input.fileChanges.additions.length, 2);
      assert.equal(
        Buffer.from(body.variables.input.fileChanges.additions[0].contents, "base64").toString(),
        "<svg>dark</svg>",
      );
    });

    it("removes cards that are no longer generated and skips unchanged ones", async () => {
      routes["GET /repos/owner/repo/git/ref/heads/stats"] = () => ({ body: { object: { sha: "head-sha" } } });
      routes["GET /repos/owner/repo/contents/cards"] = () => ({
        body: [
          { type: "file", name: "stats_dark.svg", sha: gitBlobSha("<svg>dark</svg>") },
          { type: "file", name: "stats_light.svg", sha: "outdated" },
          { type: "file", name: "old_card.svg", sha: "whatever" },
        ],
      });
      routes["POST /graphql"] = () => ({
        body: { data: { createCommitOnBranch: { commit: { oid: "1", url: "u" } } } },
      });

      const result = await publishCards(options);
      const { fileChanges, expectedHeadOid } = mutations()[0].body.variables.input;

      assert.equal(result.createdBranch, false);
      assert.equal(expectedHeadOid, "head-sha");
      assert.deepEqual(
        fileChanges.additions.map((file) => file.path),
        ["cards/stats_light.svg"],
      );
      assert.deepEqual(fileChanges.deletions, [{ path: "cards/old_card.svg" }]);
    });

    it("does not commit when everything is up to date", async () => {
      routes["GET /repos/owner/repo/git/ref/heads/stats"] = () => ({ body: { object: { sha: "head-sha" } } });
      routes["GET /repos/owner/repo/contents/cards"] = () => ({
        body: cards.map((card) => ({ type: "file", name: card.name, sha: gitBlobSha(card.svg) })),
      });

      const result = await publishCards(options);

      assert.equal(result.committed, false);
      assert.equal(mutations().length, 0);
    });
  });
});
