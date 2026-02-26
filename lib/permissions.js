// ============================================================
// SSST Permission System
// Single source of truth for all RBAC in the application
// ============================================================

export const PERMISSIONS = {
  // Donations
  DONATION_VIEW: 'donation.view',
  DONATION_CREATE: 'donation.create',
  DONATION_EDIT: 'donation.edit',
  DONATION_DELETE: 'donation.delete',

  // Expenses
  EXPENSE_VIEW: 'expense.view',
  EXPENSE_CREATE: 'expense.create',
  EXPENSE_APPROVE: 'expense.approve',
  EXPENSE_EDIT: 'expense.edit',
  EXPENSE_DELETE: 'expense.delete',

  // Reports
  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',

  // User Management
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
};

// Permissions that are considered "dangerous" — shown with ⚠️ warning
export const DANGEROUS_PERMISSIONS = [
  PERMISSIONS.DONATION_EDIT,
  PERMISSIONS.DONATION_DELETE,
  PERMISSIONS.EXPENSE_APPROVE,
  PERMISSIONS.EXPENSE_EDIT,
  PERMISSIONS.EXPENSE_DELETE,
  PERMISSIONS.USER_CREATE,
  PERMISSIONS.USER_EDIT,
  PERMISSIONS.USER_DELETE,
];

// Grouped for Permission Matrix UI display
export const PERMISSION_GROUPS = [
  {
    label: 'Donations',
    labelHi: 'दान',
    key: 'donations',
    permissions: [
      { perm: PERMISSIONS.DONATION_VIEW, label: 'View', labelHi: 'देखें' },
      { perm: PERMISSIONS.DONATION_CREATE, label: 'Create', labelHi: 'बनाएं' },
      { perm: PERMISSIONS.DONATION_EDIT, label: 'Edit', labelHi: 'संपादित करें', dangerous: true },
      { perm: PERMISSIONS.DONATION_DELETE, label: 'Delete', labelHi: 'हटाएं', dangerous: true },
    ],
  },
  {
    label: 'Expenses',
    labelHi: 'व्यय',
    key: 'expenses',
    permissions: [
      { perm: PERMISSIONS.EXPENSE_VIEW, label: 'View', labelHi: 'देखें' },
      { perm: PERMISSIONS.EXPENSE_CREATE, label: 'Create', labelHi: 'बनाएं' },
      { perm: PERMISSIONS.EXPENSE_APPROVE, label: 'Approve', labelHi: 'स्वीकृत करें', dangerous: true },
      { perm: PERMISSIONS.EXPENSE_EDIT, label: 'Edit', labelHi: 'संपादित करें', dangerous: true },
      { perm: PERMISSIONS.EXPENSE_DELETE, label: 'Delete', labelHi: 'हटाएं', dangerous: true },
    ],
  },
  {
    label: 'Reports',
    labelHi: 'रिपोर्ट',
    key: 'reports',
    permissions: [
      { perm: PERMISSIONS.REPORT_VIEW, label: 'View', labelHi: 'देखें' },
      { perm: PERMISSIONS.REPORT_EXPORT, label: 'Export', labelHi: 'निर्यात करें' },
    ],
  },
  {
    label: 'User Management',
    labelHi: 'उपयोगकर्ता प्रबंधन',
    key: 'users',
    permissions: [
      { perm: PERMISSIONS.USER_VIEW, label: 'View', labelHi: 'देखें' },
      { perm: PERMISSIONS.USER_CREATE, label: 'Create', labelHi: 'बनाएं', dangerous: true },
      { perm: PERMISSIONS.USER_EDIT, label: 'Edit', labelHi: 'संपादित करें', dangerous: true },
      { perm: PERMISSIONS.USER_DELETE, label: 'Delete', labelHi: 'हटाएं', dangerous: true },
    ],
  },
];

// Default permissions for each role
export const ROLE_DEFAULTS = {
  super_admin: Object.values(PERMISSIONS), // all permissions
  founder: [
    PERMISSIONS.DONATION_VIEW,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
  ca: [
    PERMISSIONS.DONATION_VIEW,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
  ],
  staff: [
    PERMISSIONS.DONATION_VIEW,
    PERMISSIONS.DONATION_CREATE,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,
  ],
};

// Role display metadata
export const ROLES = {
  super_admin: { label: 'Super Admin', labelHi: 'सुपर एडमिन', color: '#FF6B00' },
  founder: { label: 'Founder Member', labelHi: 'संस्थापक सदस्य', color: '#7C3AED' },
  ca: { label: 'CA / Auditor', labelHi: 'सीए / लेखापरीक्षक', color: '#0EA5E9' },
  staff: { label: 'Staff / Data Entry', labelHi: 'स्टाफ / डेटा एंट्री', color: '#10B981' },
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - user object with permissions array
 * @param {string} permission - permission key from PERMISSIONS
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  // Super Admin always has all permissions regardless of stored array
  if (user.role === 'super_admin') return true;
  // For other roles, use effective permissions (respects useRoleDefaults)
  const effective = getEffectivePermissions(user);
  return effective.includes(permission);
};

/**
 * Get the effective permissions for a user
 * If useRoleDefaults is true, returns ROLE_DEFAULTS[role]
 * Otherwise returns the custom permissions array
 */
export const getEffectivePermissions = (user) => {
  if (!user) return [];
  if (user.useRoleDefaults) return ROLE_DEFAULTS[user.role] || [];
  return user.permissions || [];
};
