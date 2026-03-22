import JSZip from "jszip";

import { downloadArtifactZip } from "@/lib/github";

const PREVIEWABLE_EXTENSIONS = [".md", ".txt", ".json", ".log", ".out"];

function isPreviewableName(name) {
  const lower = name.toLowerCase();
  return PREVIEWABLE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export async function loadArtifactZip(artifactId) {
  const zipBuffer = await downloadArtifactZip(artifactId);
  return JSZip.loadAsync(Buffer.from(zipBuffer));
}

export async function extractArtifactSummary(artifactId) {
  const zip = await loadArtifactZip(artifactId);
  const summaryEntry = Object.values(zip.files).find(
    (entry) => !entry.dir && entry.name.endsWith("summary.md"),
  );

  if (!summaryEntry) {
    return null;
  }

  return summaryEntry.async("string");
}

export async function listArtifactEntries(artifactId) {
  const zip = await loadArtifactZip(artifactId);
  return Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => ({
      name: entry.name,
      previewable: isPreviewableName(entry.name),
    }));
}

export async function previewArtifactEntry(artifactId, entryName) {
  const zip = await loadArtifactZip(artifactId);
  const entry = zip.file(entryName);

  if (!entry) {
    throw new Error(`Artifact entry not found: ${entryName}`);
  }

  const content = await entry.async("string");
  const lower = entryName.toLowerCase();
  let format = "text";

  if (lower.endsWith(".md")) {
    format = "markdown";
  } else if (lower.endsWith(".json")) {
    format = "json";
  }

  return {
    name: entryName,
    format,
    content,
  };
}
