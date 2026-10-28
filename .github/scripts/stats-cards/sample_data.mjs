// Made-up data for previewing the cards offline (`generate_cards.mjs --sample`)
// and for the unit tests. None of these numbers come from the GitHub API.

import { addDays } from "./calculations.mjs";

// Roughly three years of daily counts: one active day per week, with an empty
// week every 17th week so the streak calculation has something to break on.
function sampleDays(lastDate = "2026-10-28") {
  const days = [];
  let date = "2024-01-01";
  let weekIndex = 0;

  while (date <= lastDate) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

    if (weekday === 0 && date !== "2024-01-01") {
      weekIndex += 1;
    }

    const active = weekday === 2 && weekIndex % 17 !== 5;

    days.push({ date, count: active ? 3 : 0 });
    date = addDays(date, 1);
  }

  return days;
}

function languageEdges(entries) {
  return { edges: entries.map(([name, color, size]) => ({ size, node: { name, color } })) };
}

export const sampleData = {
  stats: { year: 2026, stars: 1280, commits: 864, pullRequests: 412, issues: 97, contributedTo: 23 },
  repositories: [
    {
      name: "docker",
      stargazerCount: 40,
      languages: languageEdges([
        ["Shell", "#89e051", 52000],
        ["Dockerfile", "#384d54", 18000],
      ]),
    },
    {
      name: "shell-script",
      stargazerCount: 12,
      languages: languageEdges([
        ["Shell", "#89e051", 91000],
        ["Python", "#3572A5", 14000],
      ]),
    },
    {
      name: "kairos",
      stargazerCount: 31,
      languages: languageEdges([
        ["JavaScript", "#f1e05a", 64000],
        ["HTML", "#e34c26", 6000],
        ["CSS", "#563d7c", 4000],
      ]),
    },
    {
      name: "openssl",
      stargazerCount: 9,
      languages: languageEdges([
        ["Shell", "#89e051", 22000],
        ["Makefile", "#427819", 3000],
        ["TypeScript", "#3178c6", 1500],
      ]),
    },
  ],
  pins: [
    {
      name: "docker",
      description: "Dockerized applications and container configurations for a self-hosted homelab.",
      stargazerCount: 40,
      forkCount: 6,
      isArchived: false,
      isTemplate: false,
      primaryLanguage: { name: "Shell", color: "#89e051" },
    },
    {
      name: "openssl",
      description: "OpenSSL configurations and helper scripts for certificates and secure networking.",
      stargazerCount: 9,
      forkCount: 2,
      isArchived: false,
      isTemplate: false,
      primaryLanguage: { name: "Shell", color: "#89e051" },
    },
    {
      name: "shell-script",
      description: "A collection of shell scripts for system automation and optimization.",
      stargazerCount: 12,
      forkCount: 3,
      isArchived: false,
      isTemplate: false,
      primaryLanguage: { name: "Shell", color: "#89e051" },
    },
    {
      name: "kairos",
      description:
        "A Home Assistant card for day-ahead energy prices, with a long enough description to wrap & be cut <off> after three lines of text.",
      stargazerCount: 31,
      forkCount: 4,
      isArchived: false,
      isTemplate: false,
      primaryLanguage: { name: "JavaScript", color: "#f1e05a" },
    },
  ],
  gists: [
    {
      key: "notifications",
      name: "e0f265a9c9b20ca786bce2327ce87060",
      description: "Guide to clear hidden or stuck GitHub notifications.",
      isPublic: true,
      stargazerCount: 5,
      forks: { totalCount: 1 },
      files: [{ name: "clear_github_notifications.md", language: { name: "Markdown", color: "#083fa1" } }],
    },
  ],
  days: sampleDays(),
};
