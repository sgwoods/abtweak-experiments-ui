import { NextResponse } from "next/server";

import { dispatchWorkflow, listWorkflowRuns, repoInfo } from "@/lib/github";
import { isValidPreset, isValidSingle } from "@/lib/options";

async function locateTriggeredRun(workflowFile, startedAt) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const runs = await listWorkflowRuns(workflowFile);
    const candidate = (runs.workflow_runs || []).find((run) => {
      const createdAt = Date.parse(run.created_at || "");
      return Number.isFinite(createdAt) && createdAt >= startedAt - 5000;
    });

    if (candidate) {
      return candidate;
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  throw new Error("Dispatched workflow but could not locate the new run.");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const mode = body.mode;
    const startedAt = Date.now();
    const info = repoInfo();

    let workflowFile;
    let payload;

    if (mode === "single") {
      const kind = body.kind;
      const name = body.name;
      if (!isValidSingle(kind, name)) {
        return NextResponse.json(
          { error: "Invalid curated single experiment selection." },
          { status: 400 },
        );
      }
      workflowFile = info.singleWorkflow;
      payload = { kind, name };
    } else if (mode === "set") {
      const preset = body.preset;
      if (!isValidPreset(preset)) {
        return NextResponse.json(
          { error: "Invalid experiment-set preset." },
          { status: 400 },
        );
      }
      workflowFile = info.setWorkflow;
      payload = { preset };
    } else {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    await dispatchWorkflow(workflowFile, payload);
    const run = await locateTriggeredRun(workflowFile, startedAt);

    return NextResponse.json({
      mode,
      runId: run.id,
      workflowName: run.name,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to start remote experiment." },
      { status: 500 },
    );
  }
}
