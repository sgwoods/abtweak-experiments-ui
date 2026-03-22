import { getArtifactMetadata, downloadArtifactZip } from "@/lib/github";

export async function GET(_request, context) {
  try {
    const artifactId = context.params.artifactId;
    const metadata = await getArtifactMetadata(artifactId);
    const zipBuffer = await downloadArtifactZip(artifactId);

    return new Response(Buffer.from(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${metadata.name || "artifact"}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(error.message || "Failed to download artifact.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
