export interface Breadcrumb {
  label: string
  href: string | null
}

const SECTION_LABELS: Record<string, string> = {
  spaces: 'Spaces',
  'asset-types': 'Asset Types',
  systems: 'Systems',
  assets: 'Assets',
  'test-procedure-templates': 'Test Procedure Templates',
  members: 'Members',
}

export function buildBreadcrumbs(
  pathname: string,
  projectName: string,
  entityLabel?: string,
): Breadcrumb[] {
  const projectMatch = pathname.match(/^\/project\/([^/]+)(\/(.*))?$/)
  if (!projectMatch) {
    return [{ label: projectName, href: null }]
  }

  const projectId = projectMatch[1]
  const rest = projectMatch[3] ?? ''
  const projectHref = `/project/${projectId}`

  if (!rest) {
    return [{ label: projectName, href: null }]
  }

  const parts = rest.split('/').filter(Boolean)
  const section = parts[0]
  const sectionLabel = SECTION_LABELS[section] ?? section
  const sectionHref = `${projectHref}/${section}`

  if (parts.length === 1) {
    return [
      { label: projectName, href: projectHref },
      { label: sectionLabel, href: null },
    ]
  }

  const label = entityLabel ?? parts[1]
  return [
    { label: projectName, href: projectHref },
    { label: sectionLabel, href: sectionHref },
    { label, href: null },
  ]
}
