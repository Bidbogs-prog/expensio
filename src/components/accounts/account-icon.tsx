"use client";

import { Banknote, CreditCard, Landmark, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES } from "@/lib/accounts";
import type { AccountType } from "@/types";

export const ACCOUNT_ICONS: Record<AccountType, LucideIcon> = {
  checking: Landmark,
  card: CreditCard,
  cash: Banknote,
  other: Wallet,
};

/** The colored type chip used on account cards and pickers. */
export function AccountIcon({
  type,
  className,
}: {
  type: AccountType;
  className?: string;
}) {
  const Icon = ACCOUNT_ICONS[type];
  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg",
        ACCOUNT_TYPES[type].chipClass,
        className
      )}
    >
      <Icon className="h-[1.05rem] w-[1.05rem]" />
    </span>
  );
}
