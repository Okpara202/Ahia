"use client";

import { Check } from "lucide-react";

import { Typography } from "@/components/Typography";
import { BOOST_PLANS } from "@/lib/mocks/boosts";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BoostPlanId } from "@/types";

interface BoostPlanListProps {
  planId: BoostPlanId;
  onSelect: (id: BoostPlanId) => void;
}

export function BoostPlanList({ planId, onSelect }: BoostPlanListProps) {
  return (
    <div className="flex flex-col gap-2">
      {BOOST_PLANS.map((plan) => {
        const active = plan.id === planId;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.id)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
              active
                ? "border-primary bg-primary/[0.04]"
                : "border-border hover:bg-muted/50"
            )}
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                active ? "border-primary bg-primary" : "border-border"
              )}
            >
              {active && (
                <Check
                  className="size-3 text-primary-foreground"
                  strokeWidth={3}
                />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-baseline gap-2">
                <Typography variant="label-lg">{plan.label}</Typography>
                {plan.tag && (
                  <Typography variant="label-sm" className="text-primary">
                    {plan.tag}
                  </Typography>
                )}
              </div>
              <Typography variant="caption" className="text-muted-foreground">
                {formatNaira(plan.perMonthNaira)}/month
              </Typography>
            </div>
            <Typography
              variant="price-md"
              className="whitespace-nowrap text-foreground"
            >
              {formatNaira(plan.priceNaira)}
            </Typography>
          </button>
        );
      })}
    </div>
  );
}
