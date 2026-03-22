import { NextResponse } from "next/server";

import { previewArtifactEntry } from "@/lib/artifacts";

export async function GET(request, context) {
  try {
    const artifactId = context.params.artifactId;
    const entryName = request.nextUrl.searchParams.get("entry");

    if (!entryName) {
      return NextResponse.json(
        { error: "Missing required artifact entry name." },
        { status: 400 },
      );
    }

    const preview = await previewArtifactEntry(artifactId, entryName);
    return NextResponse.json(preview, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to preview artifact entry." },
      { status: 500 },
    );
  }
}
