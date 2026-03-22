"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getPresetOption,
  getSingleOption,
  getSingleOptionsForKind,
  SET_OPTIONS,
  SINGLE_OPTIONS,
  SURFACE_INFO,
  WEIGHT_INFO,
} from "@/lib/options";

const singleKinds = Object.keys(SINGLE_OPTIONS);

function pickDefaultName(kind) {
  const options = getSingleOptionsForKind(kind);
  return options[0]?.name || "";
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    const key = item.category || "Other";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

function renderInline(text) {
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${part}-${index}`} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderSummary(markdown) {
  const lines = markdown.split("\n");
  const nodes = [];
  let listItems = [];

  function flushList(keyBase) {
    if (!listItems.length) {
      return;
    }
    nodes.push(
      <ul key={`list-${keyBase}`} style={styles.summaryList}>
        {listItems.map((item, index) => (
          <li key={`${keyBase}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(index);
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList(index);

    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h3 key={`h1-${index}`} style={styles.summaryHeading}>
          {renderInline(trimmed.slice(2))}
        </h3>,
      );
      return;
    }

    if (trimmed.endsWith(":")) {
      nodes.push(
        <div key={`label-${index}`} style={styles.summaryLabel}>
          {renderInline(trimmed.slice(0, -1))}
        </div>,
      );
      return;
    }

    nodes.push(
      <p key={`p-${index}`} style={styles.summaryParagraph}>
        {renderInline(trimmed)}
      </p>,
    );
  });

  flushList("tail");
  return nodes;
}

function WeightBadge({ weight }) {
  const info = WEIGHT_INFO[weight];
  return <span style={styles.badge}>{info?.label || weight}</span>;
}

export default function HomePage() {
  const [mode, setMode] = useState("single");
  const [kind, setKind] = useState("status");
  const [name, setName] = useState("-");
  const [preset, setPreset] = useState(SET_OPTIONS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const singleOptions = useMemo(() => getSingleOptionsForKind(kind), [kind]);
  const groupedSingleOptions = useMemo(() => groupByCategory(singleOptions), [singleOptions]);
  const selectedSingle = useMemo(() => getSingleOption(kind, name), [kind, name]);
  const selectedPreset = useMemo(() => getPresetOption(preset), [preset]);
  const recommendedSingles = useMemo(
    () => singleOptions.filter((item) => item.recommended).slice(0, 3),
    [singleOptions],
  );

  useEffect(() => {
    setName(pickDefaultName(kind));
  }, [kind]);

  useEffect(() => {
    if (!run?.runId) {
      return undefined;
    }

    if (run.status === "completed") {
      return undefined;
    }

    const interval = setInterval(async () => {
      const response = await fetch(`/api/run/${run.runId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to refresh run status.");
        clearInterval(interval);
        return;
      }
      setRun((current) => ({ ...current, ...data }));
      if (data.status === "completed") {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [run?.runId, run?.status]);

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setRun(null);
    setPreview(null);

    const payload = mode === "single" ? { mode, kind, name } : { mode, preset };

    const response = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Failed to start remote experiment.");
      return;
    }

    setRun(data);
  }

  async function onPreviewArtifact(artifactId, entryName) {
    setPreviewLoading(true);
    setError("");

    const response = await fetch(
      `/api/run/${run.runId || run.id}/artifact/${artifactId}/preview?entry=${encodeURIComponent(entryName)}`,
      { cache: "no-store" },
    );
    const data = await response.json();
    setPreviewLoading(false);

    if (!response.ok) {
      setError(data.error || "Failed to preview artifact entry.");
      return;
    }

    setPreview({
      artifactId,
      ...data,
    });
  }

  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>AbTweak Remote Experiments</div>
        <h1 style={styles.title}>Run Curated AbTweak Experiments</h1>
        <p style={styles.lead}>
          This UI hides the GitHub Actions execution backend and exposes only
          the curated AbTweak experiment choices. Pick a surface, review what it
          does, then launch a remote run and read the returned summary here.
        </p>
        <div style={styles.heroMeta}>
          <div style={styles.metaCard}>
            <div style={styles.metaLabel}>Project backend</div>
            <div style={styles.metaValue}>mmath-renovation</div>
          </div>
          <div style={styles.metaCard}>
            <div style={styles.metaLabel}>Execution model</div>
            <div style={styles.metaValue}>GitHub Actions</div>
          </div>
          <div style={styles.metaCard}>
            <div style={styles.metaLabel}>Current benchmark focus</div>
            <div style={styles.metaValue}>Hanoi-4</div>
          </div>
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>Choose experiment type</h2>
        <div style={styles.modeRow}>
          <button
            type="button"
            onClick={() => setMode("single")}
            style={{ ...styles.modeButton, ...(mode === "single" ? styles.modeButtonActive : null) }}
          >
            Single experiment
          </button>
          <button
            type="button"
            onClick={() => setMode("set")}
            style={{ ...styles.modeButton, ...(mode === "set" ? styles.modeButtonActive : null) }}
          >
            Experiment set
          </button>
        </div>

        <p style={styles.muted}>
          Curated choices only. No arbitrary shell or Lisp input is exposed in
          this UI.
        </p>

        {mode === "single" ? (
          <>
            <div style={styles.form}>
              <label style={styles.label}>
                Surface
                <select value={kind} onChange={(event) => setKind(event.target.value)} style={styles.select}>
                  {singleKinds.map((item) => (
                    <option key={item} value={item}>
                      {SURFACE_INFO[item]?.title || item}
                    </option>
                  ))}
                </select>
              </label>
              <div style={styles.surfaceSummary}>
                <div style={styles.metaLabel}>What this surface is for</div>
                <div style={styles.surfaceTitle}>{SURFACE_INFO[kind]?.title}</div>
                <p style={styles.surfaceText}>{SURFACE_INFO[kind]?.description}</p>
                <p style={styles.surfaceHint}>{SURFACE_INFO[kind]?.audience}</p>
              </div>
            </div>

            {recommendedSingles.length ? (
              <div style={styles.catalogBlock}>
                <div style={styles.catalogHeader}>
                  <h3 style={styles.catalogTitle}>Recommended starting points</h3>
                  <p style={styles.catalogLead}>
                    These are the easiest ways to learn the surface without guessing.
                  </p>
                </div>
                <div style={styles.optionGrid}>
                  {recommendedSingles.map((item) => {
                    const selected = item.name === name;
                    return (
                      <button
                        key={`recommended-${item.name}`}
                        type="button"
                        onClick={() => setName(item.name)}
                        style={{
                          ...styles.optionCard,
                          ...(selected ? styles.optionCardSelected : null),
                        }}
                      >
                        <div style={styles.optionHeader}>
                          <span style={styles.optionTitle}>{item.title}</span>
                          <WeightBadge weight={item.weight} />
                        </div>
                        <div style={styles.optionMeta}>{item.category}</div>
                        <p style={styles.optionText}>{item.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {Object.entries(groupedSingleOptions).map(([category, items]) => (
              <div key={category} style={styles.catalogBlock}>
                <div style={styles.catalogHeader}>
                  <h3 style={styles.catalogTitle}>{category}</h3>
                </div>
                <div style={styles.optionGrid}>
                  {items.map((item) => {
                    const selected = item.name === name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setName(item.name)}
                        style={{
                          ...styles.optionCard,
                          ...(selected ? styles.optionCardSelected : null),
                        }}
                      >
                        <div style={styles.optionHeader}>
                          <span style={styles.optionTitle}>{item.title}</span>
                          <WeightBadge weight={item.weight} />
                        </div>
                        <p style={styles.optionText}>{item.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {selectedSingle ? (
              <div style={styles.selectionSummary}>
                <div style={styles.metaLabel}>Selected experiment</div>
                <div style={styles.selectionTitle}>{selectedSingle.title}</div>
                <p style={styles.selectionText}>{selectedSingle.description}</p>
                <div style={styles.selectionMetaRow}>
                  <span style={styles.selectionMetaChip}>{selectedSingle.category}</span>
                  <span style={styles.selectionMetaChip}>
                    {WEIGHT_INFO[selectedSingle.weight]?.label}
                  </span>
                  <span style={styles.selectionMetaChip}>Surface: {SURFACE_INFO[kind]?.title}</span>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p style={styles.muted}>
              Preset sets run a small, maintained bundle of related commands so you can get a focused picture with one click.
            </p>
            <div style={styles.optionGrid}>
              {SET_OPTIONS.map((item) => {
                const selected = item.id === preset;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id)}
                    style={{
                      ...styles.optionCard,
                      ...(selected ? styles.optionCardSelected : null),
                    }}
                  >
                    <div style={styles.optionHeader}>
                      <span style={styles.optionTitle}>{item.title}</span>
                      <WeightBadge weight={item.weight} />
                    </div>
                    <div style={styles.optionMeta}>{item.category}</div>
                    <p style={styles.optionText}>{item.description}</p>
                  </button>
                );
              })}
            </div>

            {selectedPreset ? (
              <div style={styles.selectionSummary}>
                <div style={styles.metaLabel}>Selected preset</div>
                <div style={styles.selectionTitle}>{selectedPreset.title}</div>
                <p style={styles.selectionText}>{selectedPreset.description}</p>
                <div style={styles.selectionMetaRow}>
                  <span style={styles.selectionMetaChip}>{selectedPreset.category}</span>
                  <span style={styles.selectionMetaChip}>
                    {WEIGHT_INFO[selectedPreset.weight]?.label}
                  </span>
                </div>
              </div>
            ) : null}
          </>
        )}

        <form onSubmit={onSubmit} style={styles.submitRow}>
          <button type="submit" disabled={submitting} style={styles.submit}>
            {submitting ? "Starting..." : "Run experiment"}
          </button>
        </form>

        {error ? <div style={styles.error}>{error}</div> : null}
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>Run status</h2>
        {!run ? (
          <p style={styles.muted}>
            No run started yet. Choose a curated experiment above to begin.
          </p>
        ) : (
          <div style={styles.results}>
            <div style={styles.resultGrid}>
              <div style={styles.resultCard}>
                <div style={styles.metaLabel}>Run ID</div>
                <div style={styles.metaValue}>{run.runId || run.id}</div>
              </div>
              <div style={styles.resultCard}>
                <div style={styles.metaLabel}>Status</div>
                <div style={styles.metaValue}>{run.status}</div>
              </div>
              <div style={styles.resultCard}>
                <div style={styles.metaLabel}>Conclusion</div>
                <div style={styles.metaValue}>{run.conclusion || "pending"}</div>
              </div>
            </div>

            {run.summaryMarkdown ? (
              <div style={styles.summaryBox}>
                <div style={styles.metaLabel}>Returned summary</div>
                <div style={styles.summaryText}>{renderSummary(run.summaryMarkdown)}</div>
              </div>
            ) : (
              <p style={styles.muted}>
                {run.status === "completed"
                  ? "The run completed, but no artifact summary was extracted yet."
                  : "Polling for status and summary..."}
              </p>
            )}

            {run.artifacts?.length ? (
              <div style={styles.summaryBox}>
                <div style={styles.metaLabel}>Artifacts prepared</div>
                <div style={styles.artifactStack}>
                  {run.artifacts.map((artifact) => (
                    <div key={artifact.id} style={styles.artifactCard}>
                      <div style={styles.artifactCardHeader}>
                        <div>
                          <a
                            href={`/api/run/${run.runId || run.id}/artifact/${artifact.id}`}
                            style={styles.artifactLink}
                          >
                            {artifact.name}
                          </a>{" "}
                          <span style={styles.artifactSize}>({artifact.sizeInBytes} bytes)</span>
                        </div>
                        <span style={styles.badge}>
                          {artifact.entries?.filter((entry) => entry.previewable).length || 0} previewable
                        </span>
                      </div>
                      {artifact.entries?.length ? (
                        <ul style={styles.artifactEntryList}>
                          {artifact.entries.map((entry) => (
                            <li key={`${artifact.id}-${entry.name}`} style={styles.artifactEntry}>
                              <span style={styles.artifactEntryName}>{entry.name}</span>
                              <div style={styles.artifactEntryActions}>
                                {entry.previewable ? (
                                  <button
                                    type="button"
                                    onClick={() => onPreviewArtifact(artifact.id, entry.name)}
                                    style={styles.previewButton}
                                  >
                                    Preview
                                  </button>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={styles.muted}>No readable entry listing extracted for this artifact yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {preview || previewLoading ? (
              <div style={styles.summaryBox}>
                <div style={styles.metaLabel}>Artifact preview</div>
                {previewLoading ? (
                  <p style={styles.muted}>Loading preview...</p>
                ) : preview ? (
                  <>
                    <div style={styles.previewHeader}>
                      <div style={styles.previewTitle}>{preview.name}</div>
                      <span style={styles.badge}>{preview.format}</span>
                    </div>
                    {preview.format === "markdown" ? (
                      <div style={styles.summaryText}>{renderSummary(preview.content)}</div>
                    ) : (
                      <pre style={styles.previewBlock}>{preview.content}</pre>
                    )}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  shell: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 20px 64px",
  },
  hero: {
    border: "1px solid rgba(177, 222, 255, 0.18)",
    borderRadius: 28,
    padding: "36px 34px 32px",
    background:
      "linear-gradient(160deg, rgba(12, 34, 54, 0.88), rgba(7, 19, 31, 0.72)), radial-gradient(circle at 20% 0%, rgba(103, 230, 168, 0.14), transparent 32%)",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(255, 255, 255, 0.08)",
    color: "#d7ecff",
    fontSize: 12,
    letterSpacing: ".14em",
    textTransform: "uppercase",
  },
  title: {
    margin: "18px 0 10px",
    fontSize: "clamp(34px, 5vw, 58px)",
    lineHeight: 0.95,
    letterSpacing: "-0.04em",
  },
  lead: {
    maxWidth: 780,
    fontSize: 18,
    lineHeight: 1.6,
    color: "var(--muted)",
  },
  heroMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginTop: 28,
  },
  metaCard: {
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  metaLabel: {
    display: "block",
    color: "#8fb3cc",
    fontSize: 12,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: 600,
  },
  panel: {
    marginTop: 22,
    padding: 28,
    border: "1px solid rgba(177, 222, 255, 0.18)",
    borderRadius: 28,
    background: "rgba(7, 19, 31, 0.68)",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: 24,
    letterSpacing: "-0.02em",
  },
  modeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  modeButton: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid rgba(121, 184, 255, 0.28)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "var(--text)",
    cursor: "pointer",
  },
  modeButtonActive: {
    background: "rgba(121, 184, 255, 0.18)",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)",
    gap: 16,
    alignItems: "stretch",
    marginTop: 16,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    color: "var(--text)",
    fontWeight: 500,
  },
  select: {
    borderRadius: 14,
    border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(5, 12, 18, 0.8)",
    color: "var(--text)",
    padding: "12px 14px",
  },
  surfaceSummary: {
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  surfaceTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
  },
  surfaceText: {
    margin: "0 0 10px",
    color: "var(--text)",
    lineHeight: 1.6,
  },
  surfaceHint: {
    margin: 0,
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  catalogBlock: {
    marginTop: 22,
  },
  catalogHeader: {
    marginBottom: 12,
  },
  catalogTitle: {
    margin: "0 0 6px",
    fontSize: 18,
    letterSpacing: "-0.02em",
  },
  catalogLead: {
    margin: 0,
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  optionCard: {
    padding: "16px 18px",
    borderRadius: 18,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "var(--text)",
    textAlign: "left",
    cursor: "pointer",
  },
  optionCardSelected: {
    border: "1px solid rgba(121, 184, 255, 0.42)",
    background: "rgba(121, 184, 255, 0.12)",
    boxShadow: "0 0 0 1px rgba(121, 184, 255, 0.18) inset",
  },
  optionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  optionMeta: {
    marginBottom: 8,
    color: "#8fb3cc",
    fontSize: 12,
    letterSpacing: ".1em",
    textTransform: "uppercase",
  },
  optionText: {
    margin: 0,
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255, 255, 255, 0.08)",
    color: "#d7ecff",
    fontSize: 11,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },
  selectionSummary: {
    marginTop: 22,
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
  },
  selectionText: {
    margin: "0 0 14px",
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  selectionMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  selectionMetaChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255, 255, 255, 0.08)",
    color: "#d7ecff",
    fontSize: 12,
  },
  submitRow: {
    marginTop: 22,
  },
  submit: {
    padding: "12px 18px",
    borderRadius: 999,
    border: "1px solid rgba(121, 184, 255, 0.28)",
    background: "rgba(121, 184, 255, 0.18)",
    color: "var(--text)",
    cursor: "pointer",
    minWidth: 200,
  },
  error: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(180, 60, 60, 0.16)",
    border: "1px solid rgba(255, 120, 120, 0.22)",
    color: "#ffd7d7",
  },
  muted: {
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  results: {
    display: "grid",
    gap: 18,
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  resultCard: {
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  summaryBox: {
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  artifactStack: {
    display: "grid",
    gap: 14,
  },
  artifactCard: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  artifactCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  artifactSize: {
    color: "var(--muted)",
  },
  artifactEntryList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 8,
  },
  artifactEntry: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255, 255, 255, 0.04)",
  },
  artifactEntryName: {
    color: "var(--text)",
    fontFamily: '"SFMono-Regular", "Menlo", monospace',
    fontSize: 13,
    wordBreak: "break-all",
  },
  artifactEntryActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  previewButton: {
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(121, 184, 255, 0.28)",
    background: "rgba(121, 184, 255, 0.12)",
    color: "var(--text)",
    cursor: "pointer",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 600,
    wordBreak: "break-all",
  },
  previewBlock: {
    margin: 0,
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(5, 12, 18, 0.8)",
    color: "#dff6ff",
    overflowX: "auto",
    fontFamily: '"SFMono-Regular", "Menlo", monospace',
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  summaryText: {
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  summaryHeading: {
    margin: "0 0 12px",
    fontSize: 20,
    color: "var(--text)",
    letterSpacing: "-0.02em",
  },
  summaryLabel: {
    margin: "12px 0 6px",
    color: "var(--text)",
    fontWeight: 600,
    letterSpacing: ".04em",
    textTransform: "uppercase",
    fontSize: 12,
  },
  summaryParagraph: {
    margin: "0 0 10px",
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  summaryList: {
    margin: "0 0 10px",
    paddingLeft: 20,
    color: "var(--muted)",
    lineHeight: 1.7,
  },
  inlineCode: {
    fontFamily: '"SFMono-Regular", "Menlo", monospace',
    fontSize: "0.92em",
    padding: "2px 6px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.08)",
    color: "#e7f6ff",
  },
  artifactLink: {
    color: "#dff6ff",
    fontWeight: 600,
    textDecoration: "none",
  },
};
