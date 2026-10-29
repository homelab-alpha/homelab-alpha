// Unit tests for the stats cards. Run with:
//   node --test .github/scripts/stats-cards/cards.test.mjs
// No network access is needed; the GitHub API is replaced by a fake fetch.

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { buildCards } from "./build_cards.mjs";
import { config } from "./config.mjs";
import { addDays, aggregateLanguages, computeWeeklyStreaks, formatNumber, startOfWeek } from "./calculations.mjs";
import { fetchContributionDays, fetchGists, fetchRepositories, graphql, request } from "./github_api.mjs";
import { gitBlobSha, publishCards } from "./publish_branch.mjs";
import { sampleData } from "./sample_data.mjs";
import { escapeXml } from "./svg_helpers.mjs";

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

  it("formats numbers", () => {
    assert.equal(formatNumber(1280), "1,280");
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

describe("escapeXml", () => {
  it("escapes XML", () => {
    assert.equal(
      escapeXml(`<a href="x">Tom & 'Jerry'</a>`),
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;",
    );
  });
});

describe("buildCards", () => {
  const cards = buildCards(sampleData);
  const sessionOf = (compact) =>
    cards.filter((card) => card.name.startsWith("session_") && card.name.includes("_compact_") === compact);
  const svgOf = (name) => cards.find((card) => card.name === name).svg;
  const sizeOf = (card) => {
    const [, width, height] = card.svg.match(/<svg [^>]*width="(\d+)" height="(\d+)"/);

    return { width: Number(width), height: Number(height) };
  };

  it("only creates the pieces of the terminal session, in both layouts and color schemes", () => {
    assert.ok(cards.length > 0);
    assert.ok(cards.every((card) => card.name.startsWith("session_")));

    for (const suffix of ["dark", "light", "compact_dark", "compact_light"]) {
      assert.ok(
        cards.some((card) => card.name.endsWith(`_${suffix}.svg`)),
        suffix,
      );
    }
  });

  it("builds the terminal session with identical bands in both layouts", () => {
    const pieces = (compact) =>
      sessionOf(compact)
        .map((card) => card.name.replace("_compact", ""))
        .sort();

    assert.ok(pieces(false).length > 0);
    assert.deepEqual(pieces(true), pieces(false));

    for (const card of cards) {
      assert.ok(sizeOf(card).height >= 40, card.name);
    }
  });

  it("keeps a transparent margin of 8 pixels around the full width pieces", () => {
    const first = (compact) =>
      sizeOf(cards.find((card) => card.name === `session_1${compact ? "_compact" : ""}_dark.svg`));

    assert.equal(first(false).width, 800 + 16);
    assert.equal(first(true).width, 392 + 16);
    assert.match(svgOf("session_1_dark.svg"), /viewBox="-8 -8 816 \d+"/);
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

  it("uses the color scheme of the theme", () => {
    assert.match(svgOf("session_1_dark.svg"), /#151b23/);
    assert.match(svgOf("session_1_light.svg"), /#eaeef2/);
  });

  it("draws the terminal prompt from the config and underlines the links", () => {
    const session = svgOf("session_1_dark.svg");

    assert.match(session, /┌──\(/);
    assert.match(session, new RegExp(`>${config.terminal.user}<`));
    assert.match(session, new RegExp(config.terminal.blocks[0].command));
    assert.ok(cards.some((card) => /text-decoration="underline"/.test(card.svg)));
  });

  it("escapes descriptions from the API", () => {
    const session = cards
      .filter((card) => card.name.endsWith("_dark.svg") && !card.name.includes("_compact_"))
      .map((card) => card.svg)
      .join("\n");

    assert.match(session, /&amp;/);
    assert.doesNotMatch(session, /<off>/);
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

      calls.push({ method: init.method, path: pathname, search, body, authorization: init.headers.Authorization });

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
    delete process.env.STATS_TOKEN;
  });

  it("reads with STATS_TOKEN but publishes with the workflow token", async () => {
    process.env.STATS_TOKEN = "read-token";
    routes["POST /graphql"] = () => ({ body: { data: {} } });
    routes["GET /repos/o/r/git/ref/heads/stats"] = () => ({ status: 404, body: { message: "Not Found" } });

    await graphql("query { viewer { login } }");
    await request("GET", "/repos/o/r/git/ref/heads/stats", undefined, { write: true }).catch(() => {});

    assert.equal(calls[0].authorization, "Bearer read-token");
    assert.equal(calls[1].authorization, "Bearer test-token");
  });

  it("falls back to the workflow token and explains missing access", async () => {
    routes["POST /graphql"] = () => ({
      body: { errors: [{ message: "Resource not accessible by integration" }] },
    });

    await assert.rejects(() => graphql("query { viewer { login } }"), /STATS_TOKEN/);
    assert.equal(calls[0].authorization, "Bearer test-token");
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
