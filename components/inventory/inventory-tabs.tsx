"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const TABS = [
  { label: "Ingredients", href: "/inventory", exact: true, description: "Stock on hand" },
  { label: "Suppliers", href: "/inventory/suppliers", description: "Vendor contacts" },
  { label: "Purchase orders", href: "/inventory/purchase-orders", description: "Ordering stock" },
  { label: "Procurement", href: "/inventory/procurement", description: "Buying workflow" },
  { label: "Transfers", href: "/inventory/transfers", description: "Move between branches" },
  { label: "Waste", href: "/inventory/waste", description: "Spoilage and write-offs" },
  { label: "Counts", href: "/inventory/counts", description: "Physical stock takes" },
  { label: "Yield", href: "/inventory/yield", description: "Prep yield tracking" },
  { label: "Prep", href: "/inventory/prep", description: "Prep lists" },
  { label: "Price variance", href: "/inventory/price-variance", description: "Cost swings" },
  { label: "Forecast", href: "/inventory/forecast", description: "Demand forecast" },
  { label: "Food cost", href: "/inventory/cost", description: "Recipe costing" },
  { label: "Units", href: "/inventory/units", description: "Unit conversions" },
  { label: "Recipes", href: "/inventory/recipes", description: "Dish recipes" },
  { label: "Engineering", href: "/inventory/engineering", description: "Menu engineering" },
  { label: "Anomalies", href: "/inventory/anomalies", description: "Stock outliers" },
  { label: "Alerts", href: "/inventory/alerts", description: "Low-stock alerts" },
];

export function InventoryTabs() {
  return <ModuleSectionNav title="Inventory" items={TABS} />;
}
