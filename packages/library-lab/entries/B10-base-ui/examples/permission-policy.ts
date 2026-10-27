export type Permission = 'read' | 'comment' | 'manage';
export const PERMISSION_IDS: readonly Permission[] = ['read', 'comment', 'manage'];

export function eligiblePermissions(manageLocked: boolean): Permission[] {
  return PERMISSION_IDS.filter(id => !(manageLocked && id === 'manage'));
}

export function normalizePermissions(values: readonly Permission[], manageLocked: boolean): Permission[] {
  const allowed = eligiblePermissions(manageLocked);
  return allowed.filter(id => values.includes(id));
}

export function permissionSummary(values: readonly Permission[], manageLocked: boolean) {
  const eligible = eligiblePermissions(manageLocked);
  const selected = normalizePermissions(values, manageLocked);
  return {
    checked: selected.length === eligible.length,
    indeterminate: selected.length > 0 && selected.length < eligible.length,
    selectedCount: selected.length,
    eligibleCount: eligible.length,
  };
}

export function changePermission(values: readonly Permission[], id: Permission, checked: boolean, manageLocked: boolean): Permission[] {
  const selected = normalizePermissions(values, manageLocked);
  if (!eligiblePermissions(manageLocked).includes(id)) return selected;
  return normalizePermissions(checked ? [...selected, id] : selected.filter(value => value !== id), manageLocked);
}

export function changeAllPermissions(checked: boolean, manageLocked: boolean): Permission[] {
  return checked ? eligiblePermissions(manageLocked) : [];
}
