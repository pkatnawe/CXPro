import { describe, it, expect } from 'vitest'
import { buildBreadcrumbs, type Breadcrumb } from './breadcrumbs'

const PROJECT_NAME = 'Test Project'
const PROJECT_ID = 'proj-123'
const BASE = `/project/${PROJECT_ID}`

describe('buildBreadcrumbs', () => {
  it('project root returns single terminal crumb', () => {
    const crumbs = buildBreadcrumbs(`${BASE}`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: null },
    ])
  })

  it('spaces list page', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/spaces`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Spaces', href: null },
    ])
  })

  it('asset-types list page', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/asset-types`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Asset Types', href: null },
    ])
  })

  it('systems list page', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/systems`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Systems', href: null },
    ])
  })

  it('assets list page', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/assets`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Assets', href: null },
    ])
  })

  it('test-procedure-templates list page', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/test-procedure-templates`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Test Procedure Templates', href: null },
    ])
  })

  it('members list page', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/members`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Members', href: null },
    ])
  })

  it('spaces detail without entity label uses id as label', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/spaces/space-abc`, PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Spaces', href: `${BASE}/spaces` },
      { label: 'space-abc', href: null },
    ])
  })

  it('spaces detail with entity label', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/spaces/space-abc`, PROJECT_NAME, 'Floor 1')
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Spaces', href: `${BASE}/spaces` },
      { label: 'Floor 1', href: null },
    ])
  })

  it('asset-types detail with entity label', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/asset-types/at-1`, PROJECT_NAME, 'AHU')
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Asset Types', href: `${BASE}/asset-types` },
      { label: 'AHU', href: null },
    ])
  })

  it('systems detail with entity label', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/systems/sys-1`, PROJECT_NAME, 'HVAC')
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Systems', href: `${BASE}/systems` },
      { label: 'HVAC', href: null },
    ])
  })

  it('assets detail with entity label', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/assets/asset-1`, PROJECT_NAME, 'AHU-01')
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Assets', href: `${BASE}/assets` },
      { label: 'AHU-01', href: null },
    ])
  })

  it('test-procedure-templates detail with entity label', () => {
    const crumbs = buildBreadcrumbs(
      `${BASE}/test-procedure-templates/tpt-1`,
      PROJECT_NAME,
      'Startup Procedure',
    )
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: BASE },
      { label: 'Test Procedure Templates', href: `${BASE}/test-procedure-templates` },
      { label: 'Startup Procedure', href: null },
    ])
  })

  it('detail route without entity label falls back to entity id', () => {
    const crumbs = buildBreadcrumbs(`${BASE}/assets/asset-999`, PROJECT_NAME)
    expect(crumbs[2]).toEqual<Breadcrumb>({ label: 'asset-999', href: null })
  })

  it('last crumb always has href null', () => {
    const cases = [
      `${BASE}`,
      `${BASE}/assets`,
      `${BASE}/assets/asset-1`,
    ]
    for (const pathname of cases) {
      const crumbs = buildBreadcrumbs(pathname, PROJECT_NAME)
      expect(crumbs[crumbs.length - 1].href).toBeNull()
    }
  })

  it('non-project pathname returns single crumb with projectName', () => {
    const crumbs = buildBreadcrumbs('/inbox', PROJECT_NAME)
    expect(crumbs).toEqual<Breadcrumb[]>([
      { label: PROJECT_NAME, href: null },
    ])
  })
})
