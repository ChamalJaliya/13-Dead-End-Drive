#!/usr/bin/env node
/**
 * Import docs/jira/*.csv into GitHub Issues and org Project v2.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/import-backlog-to-github-project.mjs
 *   GITHUB_TOKEN=ghp_xxx node scripts/import-backlog-to-github-project.mjs --dry-run
 *
 * Token scopes: repo, read:org, project (read + write for board status).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ORG = 'SCITAIGROUP1';
const REPO = '13-Dead-End-Drive';
const PROJECT_NUMBER = 2;

const HISTORICAL_CSV = join(ROOT, 'docs/jira/ded-jira-backlog-historical.csv');
const MVP_CSV = join(ROOT, 'docs/jira/ded-jira-backlog-mvp.csv');
const MAP_FILE = join(ROOT, 'docs/jira/.github-import-map.json');

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_EXISTING = !process.argv.includes('--force');

const STATUS_MAP = {
  Backlog: ['Backlog', 'Todo', 'To do'],
  Ready: ['Ready'],
  'To Do': ['Ready', 'Backlog', 'Todo'],
  'In Progress': ['In Progress', 'In progress'],
  'In Review': ['In Review', 'In review'],
  'QA / UAT': ['In Review', 'QA', 'QA / UAT'],
  Done: ['Done'],
};

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Set GITHUB_TOKEN (needs repo + project scopes).');
  process.exit(1);
}

/** @param {string} csv */
function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    /** @type {Record<string, string>} */
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

/** @param {string} line */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!res.ok) {
    throw new Error(`${opts.method ?? 'GET'} ${path} → ${res.status}: ${body.message ?? text}`);
  }
  return body;
}

async function graphql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

function mergeRows() {
  const byId = new Map();
  for (const file of [HISTORICAL_CSV, MVP_CSV]) {
    const rows = parseCsv(readFileSync(file, 'utf8'));
    for (const row of rows) {
      const id = row['External ID']?.trim();
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, row);
    }
  }
  const epics = [...byId.values()].filter((r) => r['Issue Type'] === 'Epic');
  const stories = [...byId.values()].filter((r) => r['Issue Type'] !== 'Epic');
  return [...epics, ...stories];
}

function issueBody(row) {
  const lines = [
    `| Field | Value |`,
    `|-------|-------|`,
    `| **External ID** | \`${row['External ID']}\` |`,
    `| **Epic Link** | ${row['Epic Link'] || '—'} |`,
    `| **Priority** | ${row.Priority} |`,
    `| **Status (CSV)** | ${row.Status} |`,
    `| **Component** | ${row.Components} |`,
    `| **Fix version** | ${row['Fix Version']} |`,
    `| **Story points** | ${row['Story Points'] || '—'} |`,
    '',
    row.Description || '',
    '',
    '---',
    '_Imported from `docs/jira/` backlog CSV._',
  ];
  return lines.join('\n');
}

function parseLabels(row) {
  const raw = row.Labels?.replace(/^"|"$/g, '') ?? '';
  const labels = raw
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  const type = row['Issue Type'] === 'Epic' ? 'epic' : 'story';
  const component = row.Components?.trim();
  const out = [...labels, type];
  if (component) out.push(`component:${component}`);
  return [...new Set(out)];
}

async function ensureLabels(labelNames) {
  const existing = await gh(`/repos/${ORG}/${REPO}/labels?per_page=100`);
  const have = new Set(existing.map((l) => l.name));
  for (const name of labelNames) {
    if (have.has(name)) continue;
    if (DRY_RUN) {
      console.log(`[dry-run] create label ${name}`);
      continue;
    }
    await gh(`/repos/${ORG}/${REPO}/labels`, {
      method: 'POST',
      body: JSON.stringify({ name, color: name.startsWith('role:') ? '1d76db' : 'ededed' }),
    });
    have.add(name);
    await sleep(200);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadExistingIssues() {
  const map = new Map();
  let page = 1;
  for (;;) {
    const issues = await gh(
      `/repos/${ORG}/${REPO}/issues?state=all&per_page=100&page=${page}`,
    );
    if (!issues.length) break;
    for (const issue of issues) {
      const m = issue.body?.match(/\*\*External ID\*\* \| `([^`]+)`/);
      if (m) map.set(m[1], issue);
    }
    if (issues.length < 100) break;
    page++;
  }
  return map;
}

async function createIssue(row) {
  const labels = parseLabels(row);
  const payload = {
    title: row.Summary.trim(),
    body: issueBody(row),
    labels,
  };
  if (row.Status === 'Done') payload.state = 'closed';
  else payload.state = 'open';

  if (DRY_RUN) {
    console.log(`[dry-run] issue ${row['External ID']}: ${payload.title}`);
    return { node_id: `DRY_${row['External ID']}`, number: 0, ...payload };
  }

  return gh(`/repos/${ORG}/${REPO}/issues`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function linkSubIssue(parentNodeId, childNodeId) {
  if (DRY_RUN || parentNodeId.startsWith('DRY_')) return;
  try {
    await graphql(
      `mutation($issueId: ID!, $subIssueId: ID!) {
        addSubIssue(input: { issueId: $issueId, subIssueId: $subIssueId }) {
          issue { number }
        }
      }`,
      { issueId: parentNodeId, subIssueId: childNodeId },
    );
  } catch (e) {
    console.warn(`  sub-issue link skipped: ${e.message}`);
  }
}

async function getProjectMeta() {
  const data = await graphql(
    `query($org: String!, $num: Int!) {
      organization(login: $org) {
        projectV2(number: $num) {
          id
          title
          fields(first: 40) {
            nodes {
              __typename
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }`,
    { org: ORG, num: PROJECT_NUMBER },
  );
  const project = data.organization.projectV2;
  const statusField = project.fields.nodes.find(
    (n) => n.__typename === 'ProjectV2SingleSelectField' && n.name === 'Status',
  );
  return { projectId: project.id, statusField };
}

function resolveStatusOption(statusField, csvStatus) {
  const candidates = STATUS_MAP[csvStatus] ?? [csvStatus];
  for (const name of candidates) {
    const opt = statusField.options.find(
      (o) => o.name.toLowerCase() === name.toLowerCase(),
    );
    if (opt) return opt;
  }
  return statusField.options.find((o) => o.name === 'Backlog') ?? statusField.options[0];
}

async function addToProject(projectId, statusField, contentNodeId, csvStatus) {
  const addData = await graphql(
    `mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }`,
    { projectId, contentId: contentNodeId },
  );
  const itemId = addData.addProjectV2ItemById.item.id;
  const option = resolveStatusOption(statusField, csvStatus);
  await graphql(
    `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }
      ) { projectV2Item { id } }
    }`,
    {
      projectId,
      itemId,
      fieldId: statusField.id,
      optionId: option.id,
    },
  );
  return { itemId, status: option.name };
}

async function main() {
  const rows = mergeRows();
  console.log(`Merged backlog: ${rows.length} unique items (epics + stories).`);

  const allLabels = new Set();
  for (const row of rows) parseLabels(row).forEach((l) => allLabels.add(l));
  await ensureLabels([...allLabels]);

  /** @type {Map<string, { node_id: string, number: number }>} */
  const idToIssue = new Map();

  let existingByExternal = new Map();
  if (SKIP_EXISTING && !DRY_RUN) {
    existingByExternal = await loadExistingIssues();
    if (existingByExternal.size) {
      console.log(`Found ${existingByExternal.size} existing imported issues (use --force to recreate).`);
    }
  }

  for (const row of rows) {
    const extId = row['External ID'];
    if (existingByExternal.has(extId)) {
      const ex = existingByExternal.get(extId);
      idToIssue.set(extId, { node_id: ex.node_id, number: ex.number });
      console.log(`skip ${extId} → #${ex.number}`);
      continue;
    }
    const issue = await createIssue(row);
    idToIssue.set(extId, { node_id: issue.node_id, number: issue.number });
    console.log(`created ${extId} → #${issue.number} (${row.Status})`);
    await sleep(350);
  }

  for (const row of rows) {
    if (row['Issue Type'] === 'Epic') continue;
    const epicId = row['Epic Link']?.trim();
    if (!epicId) continue;
    const parent = idToIssue.get(epicId);
    const child = idToIssue.get(row['External ID']);
    if (!parent || !child) continue;
    await linkSubIssue(parent.node_id, child.node_id);
    await sleep(200);
  }

  let projectMeta;
  try {
    projectMeta = await getProjectMeta();
  } catch (e) {
    console.warn(
      `\nProject board skipped: ${e.message}\n` +
        'Regenerate a PAT with **project** scope and re-run to add items to project #2.\n',
    );
    writeMap(idToIssue);
    return;
  }

  console.log(`\nAdding ${idToIssue.size} items to project #${PROJECT_NUMBER}…`);
  for (const row of rows) {
    const issue = idToIssue.get(row['External ID']);
    if (!issue?.node_id || issue.node_id.startsWith('DRY_')) continue;
    const { status } = await addToProject(
      projectMeta.projectId,
      projectMeta.statusField,
      issue.node_id,
      row.Status,
    );
    console.log(`  ${row['External ID']} → board column "${status}"`);
    await sleep(300);
  }

  writeMap(idToIssue);
  console.log('\nDone.');
}

function writeMap(idToIssue) {
  if (DRY_RUN) return;
  const obj = Object.fromEntries(
    [...idToIssue.entries()].map(([k, v]) => [
      k,
      {
        number: v.number,
        url: `https://github.com/${ORG}/${REPO}/issues/${v.number}`,
      },
    ]),
  );
  writeFileSync(MAP_FILE, JSON.stringify(obj, null, 2));
  console.log(`Wrote ${MAP_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
