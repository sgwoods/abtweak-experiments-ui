import { NextResponse } from "next/server";

import { extractArtifactSummary, listArtifactEntries } from "@/lib/artifacts";
import { getWorkflowRun, listRunArtifacts } from "@/lib/github";

export async function GET(_request, context) {
  try {
    const runId = context.params.id;
    const run = await getWorkflowRun(runId);
    const artifactResponse = await listRunArtifacts(runId);
    const artifacts = artifactResponse.artifacts || [];

    let summaryMarkdown = null;
    let artifactEntries = {};
    if (run.status === "completed" && artifacts.length > 0) {
      try {
        summaryMarkdown = await extractArtifactSummary(artifacts[0].id);
      } catch (_error) {
        summaryMarkdown = null;
      }

      artifactEntries = Object.fromEntries(
        await Promise.all(
          artifacts.map(async (artifact) => {
            try {
              return [artifact.id, await listArtifactEntries(artifact.id)];
            } catch (_error) {
              return [artifact.id, []];
            }
          }),
        ),
      );
    }

    return NextResponse.json({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
      artifacts: artifacts.map((artifact) => ({
        id: artifact.id,
        name: artifact.name,
        sizeInBytes: artifact.size_in_bytes,
        expired: artifact.expired,
        createdAt: artifact.created_at,
        entries: artifactEntries[artifact.id] || [],
      })),
      summaryMarkdown,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch run status." },
      { status: 500 },
    );
  }
}
