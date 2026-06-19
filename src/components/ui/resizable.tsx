"use client";

/**
 * NOTE: This component is a placeholder — the actual `react-resizable-panels`
 * API has changed (PanelGroup → Group, etc.). It is currently unused across the
 * app. To re-enable, install a pinned older version or refactor to the new API.
 */

import * as React from "react";

export function ResizablePanelGroup(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="resizable-panel-group" {...props} />;
}

export function ResizablePanel(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="resizable-panel" {...props} />;
}

export function ResizableHandle(props: React.HTMLAttributes<HTMLDivElement> & { withHandle?: boolean }) {
  const { withHandle, ...rest } = props;
  return <div data-slot="resizable-handle" {...rest} />;
}
