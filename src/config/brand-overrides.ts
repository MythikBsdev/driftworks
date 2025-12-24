import { brand } from "@/config/brands";

const isLscustoms = brand.slug === "lscustoms";
const isSynlineauto = brand.slug === "synlineauto";

export const apprenticeLabel = isLscustoms ? "Jr. Mech" : "Apprentice";

export const roleOptions = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "shop_foreman", label: "Shop Foreman" },
  { value: "master_tech", label: "Master Tech" },
  { value: "mechanic", label: "Mechanic" },
  { value: "apprentice", label: apprenticeLabel },
];

const toTitleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const brandCurrency = isLscustoms || isSynlineauto ? "USD" : "GBP";

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
  return roleLabelsMap[role] ?? toTitleCase(role);
};

export type InventoryCategoryOption = { value: string; label: string };

export const inventoryCategories: InventoryCategoryOption[] = isLscustoms
  ? [{ value: "Normal", label: "Normal" }]
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

const activeColorVar = isLscustoms
  ? "--color-brand-accent"
  : "--color-brand-primary";

export const tabHighlight = {
  borderColor: `rgb(var(${activeColorVar}) / 0.6)`,
  shadow: `0 0 22px rgb(var(${activeColorVar}) / 0.28)`,
};

export const filterHighlightShadow = `0 14px 35px -18px rgb(var(${activeColorVar}) / 0.6)`;
