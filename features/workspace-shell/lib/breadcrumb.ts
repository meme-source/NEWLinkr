// Stub introduced 2026-05-07 to satisfy bundle's project-bar import.
// The bundle's MANIFEST omits this file, so we ship a minimal placeholder
// that returns no breadcrumb segments — the discovery route doesn't render
// the project-bar (isDiscovery toggle in workspace layout), so this stub is
// only ever exercised on routes that don't yet rely on a breadcrumb tree.
//
// When breadcrumb behaviour is required (library / outreach surfaces), replace
// this with a real path-resolver. See features/project/components/project-bar.tsx
// for the consumer.

export interface WorkspaceBreadcrumbSegment {
  label: string;
  href?: string;
}

export function resolveWorkspaceBreadcrumb(
  _pathname: string,
  _searchParams: URLSearchParams,
): WorkspaceBreadcrumbSegment[] {
  return [];
}
