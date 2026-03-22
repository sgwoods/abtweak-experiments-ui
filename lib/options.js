export const SINGLE_OPTIONS = {
  status: ["-"],
  run: [
    "blocks-sussman-abtweak",
    "blocks-sussman-tweak",
    "hanoi2-abtweak",
    "hanoi3-abtweak",
    "hanoi4-5peg-isbm-weak-pos-lw",
    "robot2-abtweak",
    "stylistics-abtweak",
  ],
  report: [
    "benchmark-status",
    "hanoi2-historical",
    "hanoi3-historical",
    "hanoi4-historical",
    "hanoi4-solve-candidates",
    "hanoi4-score-sensitivity",
    "wide-domain-sweep",
  ],
  trace: [
    "hanoi3",
    "hanoi4",
    "hanoi4-isbm-weak-pos-lw",
    "hanoi4-legacy-1991",
  ],
};

export const SET_OPTIONS = [
  {
    id: "status-snapshot",
    title: "Status snapshot",
    description: "Benchmark-family status plus the short benchmark-status report.",
  },
  {
    id: "hanoi4-focused",
    title: "Hanoi-4 focused",
    description:
      "Runs the narrow hanoi-4 solve-candidate and diagnosis reports.",
  },
  {
    id: "publication-surface",
    title: "Publication surface",
    description:
      "Runs the lower-Hanoi publication-facing reports and benchmark-status.",
  },
];

export function isValidSingle(kind, name) {
  return Object.hasOwn(SINGLE_OPTIONS, kind) && SINGLE_OPTIONS[kind].includes(name);
}

export function isValidPreset(preset) {
  return SET_OPTIONS.some((item) => item.id === preset);
}
