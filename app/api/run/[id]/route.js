import JSZip from "jszip";
import { NextResponse } from "next/server";

import {
  downloadArtifactZip,
  getWorkflowRun,
  listRunArtifacts,
} from "@/lib/github";

async function extractSummary(artifacts) {
  if (!artifacts.length) {
    return null;
  }

  const zipBuffer = await downloadArtifactZip(artifacts[0].id);
  const zip = await JSZip.loadAsync(Buffer.from(zipBuffer));
  const summaryEntry = Object.values(zip.files).find(
    (entry) => !entry.dir && entry.name.endsWith("summary.md"),
  );

  if (!summaryEntry) {
    return null;
  }

  return summaryEntry.async("string");
}

export async function GET(_request, context) {
  try {
    const runId = context.params.id;
    const run = await getWorkflowRun(runId);
    const artifactResponse = await listRunArtifacts(runId);
    const artifacts = artifactResponse.artifacts || [];

    let summaryMarkdown = null;
    if (run.status === "completed" && artifacts.length > 0) {
      try {
        summaryMarkdown = await extractSummary(artifacts);
      } catch (_error) {
        summaryMarkdown = null;
      }
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
