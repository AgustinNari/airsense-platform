import { useEffect, useState } from "react";

type Run = { signature: string; year: number; status: "idle" | "running" | "paused" | "complete" };
export function useProjectionPlayback(signature: string, horizon: number, active: boolean) {
  const [run, setRun] = useState<Run>({ signature, year: 0, status: "idle" });
  const [speed, setSpeed] = useState(600);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const changed = run.signature !== signature;
  const year = changed ? 0 : Math.min(run.year, horizon);
  const status = changed ? "idle" : run.status;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!active || reduced) setRun(current => current.status === "running" ? { ...current, status: "paused" } : current);
  }, [active, reduced]);
  useEffect(() => {
    if (!active || reduced || status !== "running") return;
    const timer = window.setInterval(() => setRun(current => {
      if (current.signature !== signature || current.status !== "running") return current;
      const next = Math.min(current.year + 1, horizon);
      return { ...current, year: next, status: next === horizon ? "complete" : "running" };
    }), speed);
    return () => window.clearInterval(timer);
  }, [active, reduced, status, signature, horizon, speed]);
  return {
    year, status, changed, reduced, speed, setSpeed,
    start: () => { if (status !== "running") setRun({ signature, year: 0, status: reduced ? "paused" : "running" }); },
    pause: () => setRun(current => ({ ...current, status: "paused" })),
    resume: () => { if (active && !reduced && status === "paused" && year < horizon) setRun({ signature, year, status: "running" }); },
    reset: () => setRun({ signature, year: 0, status: "idle" }),
    seek: (next: number) => {
      const target = Math.max(0, Math.min(horizon, Math.round(next)));
      setRun({ signature, year: target, status: target === horizon ? "complete" : "paused" });
    },
  };
}
