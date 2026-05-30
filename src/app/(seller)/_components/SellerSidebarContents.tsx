"use client";

import Link from "next/link";
import { Store } from "lucide-react";

import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Typography } from "@/components/Typography";
import { SellerNavList } from "./SellerNavList";

interface SellerSidebarContentsProps {
  shopName: string;
  shopHandle: string;
  onNavigate?: () => void;
}

export function SellerSidebarContents({
  shopName,
  shopHandle,
  onNavigate,
}: SellerSidebarContentsProps) {
  return (
    <>
      <Link
        href="/seller"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-5 pb-4 pt-5"
      >
        <LogoMark className="size-9" />
        <div className="flex min-w-0 flex-col">
          <Typography variant="heading-h4" className="truncate">
            {shopName}
          </Typography>
          <Typography variant="caption" className="truncate text-muted-foreground">
            {shopHandle}
          </Typography>
        </div>
      </Link>

      <SellerNavList onNavigate={onNavigate} />

      <div className="mt-auto flex flex-col gap-2 border-t border-border px-3 py-3">
        <Link
          href="/feed"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Store className="size-4" />
          <Typography variant="label-sm">Browse as buyer</Typography>
        </Link>
        <div className="flex items-center justify-between gap-2 px-2">
          <Typography variant="caption" className="text-muted-foreground">
            Ahia for sellers
          </Typography>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
