export const SURFACE_INFO = {
  status: {
    title: "Status",
    description:
      "Quick project-level snapshots. Best for checking the current restoration state before running deeper experiments.",
    audience: "Start here if you want a fast high-level picture.",
  },
  run: {
    title: "Run",
    description:
      "Single benchmark executions. These return one concrete planner run so you can see an actual solved case or retained smoke path.",
    audience: "Best for direct example runs and sanity checks.",
  },
  report: {
    title: "Report",
    description:
      "Multi-case summaries generated from the maintained harness. These are the most readable way to understand current benchmark families.",
    audience: "Best for validation and progress review.",
  },
  trace: {
    title: "Trace",
    description:
      "Deeper diagnostic outputs for frontier behavior, hierarchy effects, and search-path analysis.",
    audience: "Best for hanoi-focused diagnosis and deeper technical work.",
  },
};

export const WEIGHT_INFO = {
  fast: {
    label: "Fast",
    description: "Usually finishes quickly and is a good first click.",
  },
  medium: {
    label: "Medium",
    description: "A more substantial run or report, but still a normal interactive choice.",
  },
  heavy: {
    label: "Heavy",
    description: "Trace-heavy or more diagnostic. Expect longer waits and larger artifacts.",
  },
};

export const SINGLE_CATALOG = [
  {
    kind: "status",
    name: "-",
    title: "Project status snapshot",
    description:
      "Returns the current benchmark-family status summary for the restored AbTweak environment.",
    category: "Quick health checks",
    weight: "fast",
    recommended: true,
  },
  {
    kind: "run",
    name: "blocks-sussman-abtweak",
    title: "Blocks world: AbTweak Sussman run",
    description:
      "A classic operator-style benchmark showing the restored AbTweak planner on a familiar blocks-world task.",
    category: "Reference solved runs",
    weight: "fast",
    recommended: true,
  },
  {
    kind: "run",
    name: "blocks-sussman-tweak",
    title: "Blocks world: Tweak Sussman run",
    description:
      "The non-abstraction comparator for the same classic blocks-world problem.",
    category: "Reference solved runs",
    weight: "fast",
  },
  {
    kind: "run",
    name: "hanoi2-abtweak",
    title: "Hanoi-2 exact compatibility run",
    description:
      "A retained exact lower-Hanoi family run used to confirm the historical restoration baseline.",
    category: "Publication validation",
    weight: "fast",
  },
  {
    kind: "run",
    name: "hanoi3-abtweak",
    title: "Hanoi-3 publication-aligned run",
    description:
      "A direct modern run from the historically aligned lower-Hanoi publication family.",
    category: "Publication validation",
    weight: "medium",
    recommended: true,
  },
  {
    kind: "run",
    name: "hanoi4-5peg-isbm-weak-pos-lw",
    title: "Hanoi-4 five-peg sanity check",
    description:
      "A deliberately easier four-disk check that confirms the planner can handle four disks when the geometry is relaxed.",
    category: "Reference solved runs",
    weight: "medium",
  },
  {
    kind: "run",
    name: "robot2-abtweak",
    title: "Robot application run",
    description:
      "A representative application-side operator-style AbTweak run from the restored robot family.",
    category: "Reference solved runs",
    weight: "medium",
  },
  {
    kind: "run",
    name: "stylistics-abtweak",
    title: "Stylistics sample run",
    description:
      "A restored shipped sample domain run that shows the broader manual-era domain surface is alive.",
    category: "Reference solved runs",
    weight: "medium",
  },
  {
    kind: "report",
    name: "benchmark-status",
    title: "Benchmark status report",
    description:
      "The best single readable summary of the restored benchmark surface and current validation coverage.",
    category: "Quick health checks",
    weight: "fast",
    recommended: true,
  },
  {
    kind: "report",
    name: "hanoi2-historical",
    title: "Hanoi-2 historical comparison",
    description:
      "Shows the exact archived-family lower-Hanoi compatibility results.",
    category: "Publication validation",
    weight: "medium",
  },
  {
    kind: "report",
    name: "hanoi3-historical",
    title: "Hanoi-3 historical comparison",
    description:
      "Shows the historically aligned lower-Hanoi results that reproduce the published figure surface.",
    category: "Publication validation",
    weight: "medium",
    recommended: true,
  },
  {
    kind: "report",
    name: "hanoi4-historical",
    title: "Hanoi-4 historical-controls report",
    description:
      "Compares the main four-disk hierarchy and control combinations in the restored line.",
    category: "Hanoi-4 diagnosis",
    weight: "medium",
  },
  {
    kind: "report",
    name: "hanoi4-solve-candidates",
    title: "Hanoi-4 solve candidates",
    description:
      "Compares the strongest current solve-oriented four-disk lines without widening into many weaker variants.",
    category: "Hanoi-4 diagnosis",
    weight: "medium",
    recommended: true,
  },
  {
    kind: "report",
    name: "hanoi4-score-sensitivity",
    title: "Hanoi-4 score sensitivity",
    description:
      "Shows how search ranking changes under the key historical control settings around Left-Wedge and obligation accounting.",
    category: "Hanoi-4 diagnosis",
    weight: "medium",
  },
  {
    kind: "report",
    name: "wide-domain-sweep",
    title: "Wide domain sweep",
    description:
      "A broader cross-domain summary that confirms the operator-style benchmark surface beyond Hanoi.",
    category: "Cross-domain validation",
    weight: "medium",
  },
  {
    kind: "trace",
    name: "hanoi3",
    title: "Hanoi-3 diagnostic trace",
    description:
      "A lower-Hanoi trace for seeing the restored planner’s diagnostic output without jumping straight into the hardest open case.",
    category: "Diagnostic deep dives",
    weight: "heavy",
  },
  {
    kind: "trace",
    name: "hanoi4",
    title: "Hanoi-4 broad trace",
    description:
      "A more general four-disk trace surface for inspecting the open benchmark behavior.",
    category: "Diagnostic deep dives",
    weight: "heavy",
  },
  {
    kind: "trace",
    name: "hanoi4-isbm-weak-pos-lw",
    title: "Hanoi-4 strongest live trace",
    description:
      "The strongest current stack-first historical-control line: ISBM plus weak-POS plus Left-Wedge.",
    category: "Hanoi-4 diagnosis",
    weight: "heavy",
    recommended: true,
  },
  {
    kind: "trace",
    name: "hanoi4-legacy-1991",
    title: "Hanoi-4 grouped-top comparison trace",
    description:
      "A retained grouped-top comparison line anchored in the legacy-1991 family analogue.",
    category: "Hanoi-4 diagnosis",
    weight: "heavy",
  },
];

export const SET_OPTIONS = [
  {
    id: "status-snapshot",
    title: "Status snapshot",
    description:
      "A light readiness check: benchmark-family status plus the short benchmark-status report.",
    category: "Quick health checks",
    weight: "fast",
    recommended: true,
  },
  {
    id: "hanoi4-focused",
    title: "Hanoi-4 focused",
    description:
      "The narrowest current four-disk diagnostic set, centered on solve candidates and active blocker reports.",
    category: "Hanoi-4 diagnosis",
    weight: "medium",
    recommended: true,
  },
  {
    id: "publication-surface",
    title: "Publication surface",
    description:
      "A publication-facing set focused on the lower-Hanoi reproduction surface and current benchmark status.",
    category: "Publication validation",
    weight: "medium",
  },
];

export const SINGLE_OPTIONS = Object.fromEntries(
  Object.keys(SURFACE_INFO).map((kind) => [
    kind,
    SINGLE_CATALOG.filter((item) => item.kind === kind).map((item) => item.name),
  ]),
);

export function getSingleOption(kind, name) {
  return SINGLE_CATALOG.find((item) => item.kind === kind && item.name === name) || null;
}

export function getSingleOptionsForKind(kind) {
  return SINGLE_CATALOG.filter((item) => item.kind === kind);
}

export function getPresetOption(id) {
  return SET_OPTIONS.find((item) => item.id === id) || null;
}

export function isValidSingle(kind, name) {
  return Boolean(getSingleOption(kind, name));
}

export function isValidPreset(preset) {
  return Boolean(getPresetOption(preset));
}
