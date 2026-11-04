import { Component } from "react";
import type { ReactNode } from "react";

export default class ExtensionBoundary extends Component<
  { children: ReactNode }, { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? (
      <div className="note" role="alert">
        No se pudo abrir este panel complementario. Las demás herramientas siguen disponibles.
      </div>
    ) : this.props.children;
  }
}
