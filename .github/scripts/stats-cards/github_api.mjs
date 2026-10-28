// Thin GitHub API client and the data collectors for the cards.
//
// Only public data is requested. Reading user data (contributions, pull requests
// and issues) is not allowed for the default GITHUB_TOKEN of a workflow, so the
// reads use STATS_TOKEN (a personal access token) when it is set. Publishing
// the cards always uses GH_TOKEN. Uses the built-in fetch; no dependencies.

import { sumStars } from "./calculations.mjs";

const API_URL = "https://api.github.com";
const MAX_ATTEMPTS = 3;

function getToken(write) {
  const workflowToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const token = write ? workflowToken : process.env.STATS_TOKEN || workflowToken;

  if (!token) {
    throw new Error("No token found. Set GH_TOKEN (or GITHUB_TOKEN) in the environment.");
  }

  return token;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Low-level request with a small retry for transient errors.
export async function request(method, path, body, { write = false } = {}) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${getToken(write)}`,
        "Content-Type": "application/json",
        "User-Agent": "homelab-alpha-stats-cards",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const transient = response.status >= 500 || response.status === 429;

    if (transient && attempt < MAX_ATTEMPTS) {
      await sleep(attempt * 2000);
      continue;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = data?.message ?? response.statusText;
      const error = new Error(`${method} ${path} failed with ${response.status}: ${message}`);
      error.status = response.status;
      throw error;
    }

    return data;
  }

  throw new Error(`${method} ${path} failed after ${MAX_ATTEMPTS} attempts.`);
}

export async function graphql(query, variables = {}, options = {}) {
  const data = await request("POST", "/graphql", { query, variables }, options);

  if (data.errors?.length) {
    const messages = data.errors.map((error) => error.message).join("; ");
    const hint = messages.includes("Resource not accessible by integration")
      ? " The workflow token cannot read this data; add a STATS_TOKEN secret with a personal access token."
      : "";

    throw new Error(`GraphQL error: ${messages}.${hint}`);
  }

  return data.data;
}

// All public, non-fork repositories owned by the user, with language sizes.
async function fetchOwnedRepositories(username) {
  const query = `
    query ($login: String!, $after: String) {
      user(login: $login) {
        repositories(
          first: 100
          after: $after
          ownerAffiliations: OWNER
          isFork: false
          privacy: PUBLIC
          orderBy: { field: PUSHED_AT, direction: DESC }
        ) {
          pageInfo { hasNextPage endCursor }
          nodes {
            name
            stargazerCount
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name color } }
            }
          }
        }
      }
    }`;

  const repositories = [];
  let after = null;

  do {
    const data = await graphql(query, { login: username, after });
    const page = data.user.repositories;

    repositories.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  return repositories;
}

export async function fetchStats(username, now = new Date()) {
  const year = now.getUTCFullYear();
  const query = `
    query ($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) { totalCommitContributions }
        pullRequests(first: 1) { totalCount }
        issues(first: 1) { totalCount }
        repositoriesContributedTo(
          first: 1
          contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
        ) { totalCount }
      }
    }`;

  const data = await graphql(query, {
    login: username,
    from: `${year}-01-01T00:00:00Z`,
    to: now.toISOString(),
  });

  const repositories = await fetchOwnedRepositories(username);

  return {
    year,
    stars: sumStars(repositories),
    commits: data.user.contributionsCollection.totalCommitContributions,
    pullRequests: data.user.pullRequests.totalCount,
    issues: data.user.issues.totalCount,
    contributedTo: data.user.repositoriesContributedTo.totalCount,
    repositories,
  };
}

const REPOSITORY_FIELDS = `
  name
  description
  stargazerCount
  forkCount
  isArchived
  isTemplate
  primaryLanguage { name color }`;

export async function fetchRepositories(owner, names) {
  if (names.length === 0) {
    return [];
  }

  const variables = { owner };
  const declarations = ["$owner: String!"];
  const selections = [];

  names.forEach((name, index) => {
    variables[`name${index}`] = name;
    declarations.push(`$name${index}: String!`);
    selections.push(`repository${index}: repository(owner: $owner, name: $name${index}) { ${REPOSITORY_FIELDS} }`);
  });

  const data = await graphql(`query (${declarations.join(", ")}) { ${selections.join("\n")} }`, variables);

  return names.map((name, index) => {
    const repository = data[`repository${index}`];

    if (!repository) {
      throw new Error(`Repository ${owner}/${name} was not found or is not public.`);
    }

    return repository;
  });
}

export async function fetchGists(username, gists) {
  if (gists.length === 0) {
    return [];
  }

  const variables = { login: username };
  const declarations = ["$login: String!"];
  const selections = [];

  gists.forEach((gist, index) => {
    variables[`gist${index}`] = gist.id;
    declarations.push(`$gist${index}: String!`);
    selections.push(`gist${index}: gist(name: $gist${index}) {
      name
      description
      isPublic
      stargazerCount
      forks(first: 1) { totalCount }
      files { name language { name color } }
    }`);
  });

  const data = await graphql(
    `query (${declarations.join(", ")}) { user(login: $login) { ${selections.join("\n")} } }`,
    variables,
  );

  return gists.map((gist, index) => {
    const result = data.user[`gist${index}`];

    if (!result) {
      throw new Error(`Gist ${gist.id} of ${username} was not found or is not public.`);
    }

    return { ...result, key: gist.key };
  });
}

// Daily contribution counts for every year the account was active.
export async function fetchContributionDays(username, now = new Date()) {
  const yearsData = await graphql(
    `
      query ($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionYears
          }
        }
      }
    `,
    { login: username },
  );

  const years = [...yearsData.user.contributionsCollection.contributionYears].sort();
  const days = new Map();

  const query = `
    query ($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`;

  for (const year of years) {
    const end = year === now.getUTCFullYear() ? now.toISOString() : `${year}-12-31T23:59:59Z`;
    const data = await graphql(query, { login: username, from: `${year}-01-01T00:00:00Z`, to: end });

    for (const week of data.user.contributionsCollection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        // A day can appear in two yearly calendars at a year boundary; keep the highest count.
        days.set(day.date, Math.max(days.get(day.date) ?? 0, day.contributionCount));
      }
    }
  }

  return [...days.entries()].map(([date, count]) => ({ date, count }));
}
