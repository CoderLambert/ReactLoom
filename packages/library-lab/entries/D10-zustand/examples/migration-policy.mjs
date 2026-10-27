/** Persisted v1 JSON is untrusted; migrate only allowlisted, validated UI fields. */
export function migrateChannelPreferences(value, version) {
  const defaults = {view: 'list', enabledByTenant: {'team-a': true, 'team-b': false}};
  if (version !== 1 || !value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  return {
    view: value.view === 'grid' ? 'grid' : 'list',
    enabledByTenant: {
      'team-a': typeof value.enabled === 'boolean' ? value.enabled : true,
      'team-b': false,
    },
  };
}
