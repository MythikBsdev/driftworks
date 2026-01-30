import { brand } from "@/config/brands";

export const isLscustoms = brand.slug === "lscustoms";
export const isBennys = brand.slug === "bennys";
export const isBigtuna = brand.slug === "bigtuna";
const isSynlineauto = brand.slug === "synlineauto";
export const isMosleys = brand.slug === "mosleys";

const roleAliases: Record<string, string> = {
  shopforeman: "shop_foreman",
  shopforemen: "shop_foreman",
  mastertech: "master_tech",
  mechanic: "mechanic",
  apprentice: "apprentice",
  ops_manager: "operations_manager",
  opsmanager: "operations_manager",
  senior_manager: "senior_manager",
  senior_mechanic: "senior_mechanic",
  junior_mechanic: "junior_mechanic",
};

export const normalizeRole = (role?: string | null) => {
  const normalized = (role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return roleAliases[normalized] ?? normalized;
};

export const hasOwnerLikeAccess = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  if (isBennys) {
    return normalizedRole === "owner" || normalizedRole === "operations_manager";
  }
  return normalizedRole === "owner" || (isLscustoms && normalizedRole === "shop_foreman");
};

export const hasManagerLikeAccess = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  if (isBennys) {
    return (
      normalizedRole === "manager" ||
      normalizedRole === "senior_manager" ||
      hasOwnerLikeAccess(normalizedRole)
    );
  }
  return normalizedRole === "manager" || hasOwnerLikeAccess(normalizedRole);
};

export const canManageDiscounts = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  if (isBennys) {
    return hasOwnerLikeAccess(normalizedRole);
  }
  return hasManagerLikeAccess(normalizedRole);
};

export const hasLsManagerOrOwnerAccess = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  if (isBennys) {
    return hasOwnerLikeAccess(normalizedRole);
  }
  return hasOwnerLikeAccess(normalizedRole) || (isLscustoms && normalizedRole === "manager");
};

export const canManageUsers = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  if (isBennys) {
    return (
      normalizedRole === "owner" ||
      normalizedRole === "operations_manager" ||
      normalizedRole === "senior_manager" ||
      normalizedRole === "manager"
    );
  }
  return (
    normalizedRole === "owner" ||
    (isLscustoms && (normalizedRole === "manager" || normalizedRole === "shop_foreman"))
  );
};

export const apprenticeLabel = isLscustoms ? "Jr. Mech" : "Apprentice";

const defaultRoleOptions = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "shop_foreman", label: "Shop Foreman" },
  { value: "master_tech", label: "Master Tech" },
  { value: "mechanic", label: "Mechanic" },
  { value: "apprentice", label: apprenticeLabel },
];

const bennysRoleOptions = [
  { value: "owner", label: "Owner" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "senior_manager", label: "Senior Manager" },
  { value: "manager", label: "Manager" },
  { value: "shop_foreman", label: "Shop Foreman" },
  { value: "senior_mechanic", label: "Senior Mechanic" },
  { value: "mechanic", label: "Mechanic" },
  { value: "junior_mechanic", label: "Junior Mechanic" },
];

export const roleOptions = isBennys ? bennysRoleOptions : defaultRoleOptions;
export const defaultRoleValue =
  roleOptions[roleOptions.length - 1]?.value ?? roleOptions[0]?.value ?? "apprentice";

const toTitleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const usesUsd = isLscustoms || isSynlineauto || isBigtuna || isBennys || isMosleys;
export const brandCurrency = usesUsd ? "USD" : "GBP";
export const commissionUsesProfit = isBigtuna || isBennys;
export const showProfitFields = isBigtuna || isBennys;

export const roleLabelsMap = roleOptions.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {},
);

export const formatRoleLabel = (role?: string | null) => {
  if (!role) {
    return "User";
  }
  const normalizedRole = normalizeRole(role);
  const safeRole = normalizedRole || role;
  return roleLabelsMap[normalizedRole] ?? toTitleCase(safeRole);
};

export type InventoryCategoryOption = { value: string; label: string };

export const inventoryCategories: InventoryCategoryOption[] = isLscustoms
  ? [{ value: "Normal", label: "Normal" }]
  : isMosleys
    ? [
        { value: "Normal", label: "Normal" },
        { value: "Employee", label: "Employee" },
      ]
    : [
        { value: "Normal", label: "Normal" },
        { value: "Employee", label: "Employee" },
        { value: "LEO", label: "LEO" },
      ];

export const inventoryFilters: InventoryCategoryOption[] = isLscustoms
  ? [...inventoryCategories]
  : [...inventoryCategories, { value: "All", label: "All" }];

export const formatCategoryLabel = (category?: string | null) => {
  if (!category) {
    return "Unknown";
  }
  const match = inventoryCategories.find(
    (entry) => entry.value.toLowerCase() === category.toLowerCase(),
  );
  return match?.label ?? category;
};

const activeColorVar = isLscustoms ? "--color-brand-accent" : "--color-brand-primary";

export const tabHighlight = {
  borderColor: `rgb(var(${activeColorVar}) / 0.6)`,
  shadow: `0 0 22px rgb(var(${activeColorVar}) / 0.28)`,
};

export const filterHighlightShadow = `0 14px 35px -18px rgb(var(${activeColorVar}) / 0.6)`;
