import type { Tenant } from './fixture-backend'
export const keys = {
  root: ['library-lab', 'query-demo'] as const,
  tenant: (tenant: Tenant) => ['library-lab', 'query-demo', tenant] as const,
  feeds: (tenant: Tenant) => ['library-lab', 'query-demo', tenant, 'feeds'] as const,
  list: (tenant: Tenant, search: string, page: number) =>
    ['library-lab', 'query-demo', tenant, 'feeds', search, page] as const,
  stats: (tenant: Tenant) => ['library-lab', 'query-demo', tenant, 'stats'] as const,
  mutations: (tenant: Tenant) => ['library-lab', 'query-demo', tenant, 'mutations'] as const,
}
