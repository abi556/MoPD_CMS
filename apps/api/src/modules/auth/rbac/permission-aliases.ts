/**
 * SDS permission codes mapped to legacy runtime codes (additive, non-breaking).
 * A user holding the canonical SDS code OR any listed legacy code satisfies checks
 * for that canonical code and for each legacy code in the list.
 */
export const PERMISSION_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'complaint:read': [
    'complaints:list',
    'complaints:detail',
    'complaints:history',
    'complaint:read:own',
  ],
  'complaint:read:own': ['complaint:read:own'],
  'workflow:transition': ['complaints:transition', 'complaints:assign'],
  'complaint:escalate': ['complaint:escalate'],
  'template:manage': ['config:manage'],
  'notification:manage': ['config:manage'],
  'sla:configure': ['config:manage'],
  'complaint:update': ['complaint:update'],
};
