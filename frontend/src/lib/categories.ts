import type { ArtworkCategory } from "@/types";

export const CATEGORY_LABELS: Record<ArtworkCategory, string> = {
  PAINTING: "회화",
  DRAWING: "드로잉",
  PRINT: "판화",
  PHOTOGRAPHY: "사진",
  SCULPTURE: "조각",
  CRAFT: "공예",
  MIXED_MEDIA: "회화",
  DIGITAL: "디지털",
  OTHER: "기타",
};

export const AUCTION_CATEGORIES: ArtworkCategory[] = ["PAINTING", "PHOTOGRAPHY", "SCULPTURE", "CRAFT"];
