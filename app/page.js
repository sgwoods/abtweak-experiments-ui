"use client";

import { useEffect, useMemo, useState } from "react";

import { SET_OPTIONS, SINGLE_OPTIONS } from "@/lib/options";

const singleKinds = Object.keys(SINGLE_OPTIONS);

function pickDefaultName(kind) {
  const options = SINGLE_OPTIONS[kind] || [];
  return options[0] || "";
}

function renderSummary(markdown) {
  return markdown
    .split("\n")
    .filter(Boolean)
    .map((line, index) => <div key={`${index}-${line}`}>{line}</div>);
}

export default function HomePage() {
  const [mode, setMode] = useState("single");
  const [kind, setKind] = useState("status");
  const [name, setName] = useState("-");
  const [preset, setPreset] = useState(SET_OPTIONS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState(null);

  const singleNames = useMemo(() => SINGLE_OPTIONS[kind] || [], [kind]);

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

    const payload =
      mode === "single"
        ? { mode, kind, name }
        : { mode, preset };

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

  return (
    <main style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>AbTweak Remote Experiments</div>
        <h1 style={styles.title}>Run Curated AbTweak Experiments</h1>
        <p style={styles.lead}>
          This UI hides the GitHub Actions execution backend and exposes only
          the curated AbTweak experiment choices. Start a single experiment or a
          preset experiment set, then watch the result return here.
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

        <form onSubmit={onSubmit} style={styles.form}>
          {mode === "single" ? (
            <>
              <label style={styles.label}>
                Surface
                <select value={kind} onChange={(event) => setKind(event.target.value)} style={styles.select}>
                  {singleKinds.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.label}>
                Curated name
                <select value={name} onChange={(event) => setName(event.target.value)} style={styles.select}>
                  {singleNames.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label style={styles.label}>
              Preset set
              <select value={preset} onChange={(event) => setPreset(event.target.value)} style={styles.select}>
                {SET_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button type="submit" disabled={submitting} style={styles.submit}>
            {submitting ? "Starting..." : "Run experiment"}
          </button>
        </form>

        {mode === "set" ? (
          <div style={styles.note}>
            {
              SET_OPTIONS.find((item) => item.id === preset)?.description
            }
          </div>
        ) : (
          <div style={styles.note}>
            Curated choices only. No arbitrary shell or Lisp input is exposed in
            this UI.
          </div>
        )}

        {error ? <div style={styles.error}>{error}</div> : null}
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>Run status</h2>
        {!run ? (
          <p style={styles.muted}>
            No run started yet. Submit a curated experiment above to begin.
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
                <ul style={styles.list}>
                  {run.artifacts.map((artifact) => (
                    <li key={artifact.id}>
                      <strong>{artifact.name}</strong> ({artifact.sizeInBytes} bytes)
                    </li>
                  ))}
                </ul>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    alignItems: "end",
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
  submit: {
    padding: "12px 18px",
    borderRadius: 999,
    border: "1px solid rgba(121, 184, 255, 0.28)",
    background: "rgba(121, 184, 255, 0.18)",
    color: "var(--text)",
    cursor: "pointer",
  },
  note: {
    marginTop: 16,
    color: "var(--muted)",
    lineHeight: 1.6,
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
  summaryText: {
    color: "var(--muted)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    color: "var(--muted)",
    lineHeight: 1.7,
  },
};
