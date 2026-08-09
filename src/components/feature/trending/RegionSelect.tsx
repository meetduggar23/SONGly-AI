import { Check, ChevronDown } from "lucide-react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import {
  TRENDING_REGIONS,
  type TrendingRegion,
} from "@/services/music/itunesService";
import { cn } from "@/utils/cn";

const REGION_FLAGS: Record<TrendingRegion, string> = {
  IN: "🇮🇳",
  US: "🇺🇸",
  GB: "🇬🇧",
  CA: "🇨🇦",
  AU: "🇦🇺",
  GLOBAL: "🌍",
};

interface RegionSelectProps {
  value: TrendingRegion;
  onChange: (region: TrendingRegion) => void;
}

/** Compact premium country/region selector for the Trending chart. */
export function RegionSelect({ value, onChange }: RegionSelectProps) {
  const current =
    TRENDING_REGIONS.find((r) => r.code === value) ?? TRENDING_REGIONS[0];

  return (
    <Dropdown
      align="left"
      menuClassName="min-w-[13rem]"
      trigger={
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-full border border-border bg-card/60 pl-3.5 pr-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label={`Trending region: ${current.label}`}
        >
          <span className="text-base leading-none" aria-hidden="true">
            {REGION_FLAGS[current.code]}
          </span>
          <span>{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>
      }
    >
      {TRENDING_REGIONS.map((region) => (
        <DropdownItem
          key={region.code}
          onClick={() => onChange(region.code)}
          className={cn(
            "justify-between",
            region.code === value && "bg-primary/10 font-semibold text-primary",
          )}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-base leading-none" aria-hidden="true">
              {REGION_FLAGS[region.code]}
            </span>
            {region.label}
          </span>
          {region.code === value && <Check className="h-4 w-4" />}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
