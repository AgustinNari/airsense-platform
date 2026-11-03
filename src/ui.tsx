import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
export function Badge({
  kind = "observed",
  children,
}: {
  kind?: "observed" | "calculated" | "simulated" | "assumed";
  children: ReactNode;
}) {
  return <span className={`badge ${kind}`}>{children}</span>;
}
export function MethodLink() {
  return (
    <a className="method-link" href="#metodologia">
      Ver metodología <ArrowUpRight size={13} />
    </a>
  );
}
export function SourceLink() {
  return (
    <a
      href="https://data.buenosaires.gob.ar/dataset/calidad-aire"
      target="_blank"
      rel="noopener noreferrer"
    >
      Buenos Aires Data · APrA <ArrowUpRight size={13} />
    </a>
  );
}
