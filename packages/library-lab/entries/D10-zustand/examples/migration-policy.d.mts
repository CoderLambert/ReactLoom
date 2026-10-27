export declare function migrateChannelPreferences(
  value: unknown,
  version: number
): {view: 'grid' | 'list'; enabledByTenant: {'team-a': boolean; 'team-b': boolean}};
