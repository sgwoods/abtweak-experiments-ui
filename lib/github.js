const API_BASE = "https://api.github.com";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function headers(extra = {}) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${requiredEnv("GITHUB_TOKEN")}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...extra,
  };
}

export function repoInfo() {
  return {
    owner: requiredEnv("GITHUB_OWNER"),
    repo: requiredEnv("GITHUB_REPO"),
    singleWorkflow: requiredEnv("GITHUB_WORKFLOW_SINGLE"),
    setWorkflow: requiredEnv("GITHUB_WORKFLOW_SET"),
  };
}

async function github(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: headers(options.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.arrayBuffer();
}

export async function dispatchWorkflow(workflowFile, inputs) {
  const { owner, repo } = repoInfo();
  await github(`/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: "main",
      inputs,
    }),
  });
}

export async function listWorkflowRuns(workflowFile) {
  const { owner, repo } = repoInfo();
  return github(
    `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=10`,
  );
}

export async function getWorkflowRun(runId) {
  const { owner, repo } = repoInfo();
  return github(`/repos/${owner}/${repo}/actions/runs/${runId}`);
}

export async function listRunArtifacts(runId) {
  const { owner, repo } = repoInfo();
  return github(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`);
}

export async function downloadArtifactZip(artifactId) {
  const { owner, repo } = repoInfo();
  return github(`/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`);
}
