import type { DayEntry, PlannedItem } from "../types/calendar";
import type { Food } from "../types/food";

interface CsvExportDependencies {
  days: DayEntry[];
  foods: Food[];
}

interface CsvRow {
  date: string;
  foods: string;
  new_intros: string;
  allergens: string;
  combo_flag: "yes" | "no";
  validation_status: "valid" | "warning" | "invalid";
  validation_errors: string;
  validation_warnings: string;
  notes: string;
}

const CSV_HEADERS: Array<keyof CsvRow> = [
  "date",
  "foods",
  "new_intros",
  "allergens",
  "combo_flag",
  "validation_status",
  "validation_errors",
  "validation_warnings",
  "notes",
];

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

const getValidationStatus = (day: DayEntry): CsvRow["validation_status"] => {
  if (day.validation.errors.length > 0) {
    return "invalid";
  }

  if (day.validation.warnings.length > 0) {
    return "warning";
  }

  return "valid";
};

const collectAllergenNames = (
  item: PlannedItem,
  foodsById: Map<string, Food>,
): string[] => {
  if (item.type === "combination") {
    return Array.from(
      new Set(
        (item.ingredientFoodIds ?? [])
          .map((foodId) => foodsById.get(foodId))
          .filter((food): food is Food => Boolean(food?.isAllergen))
          .map((food) => food.name),
      ),
    );
  }

  const food = foodsById.get(item.foodId);
  return food?.isAllergen ? [food.name] : [];
};

const buildCsvRows = ({ days, foods }: CsvExportDependencies): CsvRow[] => {
  const foodsById = new Map(foods.map((food) => [food.id, food]));

  return days.map((day) => {
    const allergenNames = Array.from(
      new Set(day.items.flatMap((item) => collectAllergenNames(item, foodsById))),
    );

    return {
      date: day.date,
      foods: day.items.map((item) => item.label).join(" | "),
      new_intros: day.items
        .filter((item) => item.isFirstIntroduction)
        .map((item) => item.label)
        .join(" | "),
      allergens: allergenNames.join(" | "),
      combo_flag: day.items.some((item) => item.type === "combination") ? "yes" : "no",
      validation_status: getValidationStatus(day),
      validation_errors: day.validation.errors.join(" | "),
      validation_warnings: day.validation.warnings.join(" | "),
      notes: day.notes ?? "",
    };
  });
};

export const buildPlannerCsv = (dependencies: CsvExportDependencies) => {
  const rows = buildCsvRows(dependencies);

  return [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      CSV_HEADERS.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ].join("\n");
};

export const downloadPlannerCsv = (dependencies: CsvExportDependencies) => {
  if (typeof window === "undefined" || dependencies.days.length === 0) {
    return false;
  }

  const csv = buildPlannerCsv(dependencies);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");

  link.href = downloadUrl;
  link.download = `babybite-calendar-${dependencies.days[0].date}-to-${dependencies.days.at(-1)?.date ?? dependencies.days[0].date}.csv`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);

  return true;
};
