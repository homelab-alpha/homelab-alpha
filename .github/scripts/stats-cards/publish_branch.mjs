// Publishes the generated cards to a dedicated branch.
//
// Commits are created with the GraphQL createCommitOnBranch mutation. GitHub
// signs those commits itself, so they show up as verified. Only files that
// actually changed are committed, and nothing is committed when all cards are
// already up to date.

import { createHash } from "node:crypto";

import { graphql as apiGraphql, request as apiRequest } from "./github_api.mjs";

// Publishing always uses the workflow token, never the personal access token
// that is only meant for reading.
const request = (method, path, body) => apiRequest(method, path, body, { write: true });
const graphql = (query, variables) => apiGraphql(query, variables, { write: true });

const BRANCH_README = `# Stats branch

This branch only holds the generated profile cards (SVG files) that are shown in the
profile README. It is updated by the "Update Stats Cards" workflow on the main branch.
Do not edit the files by hand; changes are overwritten on the next run.
`;

// Git object id of a file: SHA-1 of "blob <size>\0<content>".
export function gitBlobSha(content) {
  const buffer = Buffer.from(content);

  return createHash("sha1").update(`blob ${buffer.length}\0`).update(buffer).digest("hex");
}

async function getBranchHead(repository, branch) {
  try {
    const reference = await request("GET", `/repos/${repository}/git/ref/heads/${encodeURIComponent(branch)}`);

    return reference.object.sha;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
}

// Creates the branch with a single root commit that does not share history with main.
async function createBranch(repository, branch) {
  const tree = await request("POST", `/repos/${repository}/git/trees`, {
    tree: [{ path: "README.md", mode: "100644", type: "blob", content: BRANCH_README }],
  });
  const commit = await request("POST", `/repos/${repository}/git/commits`, {
    message: "chore(stats): initialize stats branch",
    tree: tree.sha,
    parents: [],
  });

  await request("POST", `/repos/${repository}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha });

  return commit.sha;
}

// Map of file name -> blob sha for the files currently in the directory.
async function listFiles(repository, branch, directory) {
  try {
    const entries = await request(
      "GET",
      `/repos/${repository}/contents/${directory}?ref=${encodeURIComponent(branch)}`,
    );

    return new Map(entries.filter((entry) => entry.type === "file").map((entry) => [entry.name, entry.sha]));
  } catch (error) {
    if (error.status === 404) {
      return new Map();
    }

    throw error;
  }
}

export async function publishCards({ repository, branch, directory, cards }) {
  let head = await getBranchHead(repository, branch);
  const createdBranch = head === null;

  if (createdBranch) {
    head = await createBranch(repository, branch);
  }

  const existing = await listFiles(repository, branch, directory);
  const wanted = new Set(cards.map((card) => card.name));

  const additions = cards
    .filter((card) => existing.get(card.name) !== gitBlobSha(card.svg))
    .map((card) => ({ path: `${directory}/${card.name}`, contents: Buffer.from(card.svg).toString("base64") }));

  // Cards that are no longer generated (for example after a config change).
  const deletions = [...existing.keys()]
    .filter((name) => !wanted.has(name))
    .map((name) => ({ path: `${directory}/${name}` }));

  if (additions.length === 0 && deletions.length === 0) {
    return { createdBranch, committed: false, added: 0, removed: 0, url: null };
  }

  const changedNames = [...additions, ...deletions].map((change) => change.path.slice(directory.length + 1));
  const data = await graphql(
    `
      mutation ($input: CreateCommitOnBranchInput!) {
        createCommitOnBranch(input: $input) {
          commit {
            oid
            url
          }
        }
      }
    `,
    {
      input: {
        branch: { repositoryNameWithOwner: repository, branchName: branch },
        message: {
          headline: "chore(stats): update profile cards",
          body: changedNames.map((name) => `- ${name}`).join("\n"),
        },
        expectedHeadOid: head,
        fileChanges: { additions, deletions },
      },
    },
  );

  return {
    createdBranch,
    committed: true,
    added: additions.length,
    removed: deletions.length,
    url: data.createCommitOnBranch.commit.url,
  };
}
