"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { getConversations } from "@/lib/services/conversations";
import {
  computeDashboardStats,
  getSellerTransactions,
} from "@/lib/services/seller";
import { useSellerShopStore } from "@/store/sellerShopStore";
import type { ConversationListItem, Transaction } from "@/types";
import { DashboardStats } from "./DashboardStats";
import { DisputeAlert } from "./DisputeAlert";
import { EarningsMomentum } from "./EarningsMomentum";
import { PostStoryButton } from "./PostStoryButton";
import { RecentConversations } from "./RecentConversations";
import { RecentTransactions } from "./RecentTransactions";

export function SellerDashboard() {
  const shop = useSellerShopStore((s) => s.shop);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Capture "now" once at mount so render stays pure (React 19 flags
  // Date.now() inside render bodies). Recomputed only when transactions or
  // conversations change, against this fixed reference point.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSellerTransactions(), getConversations()])
      .then(([t, c]) => {
        if (cancelled) return;
        setTransactions(t);
        setConversations(c);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stats derive from the same arrays the lists render from, so they
  // never drift. When backend ships an aggregated /seller/stats endpoint
  // we can swap this for a single fetch.
  const stats = useMemo(() => {
    const unread = conversations.filter((c) => c.unreadCount > 0).length;
    return computeDashboardStats(transactions, unread, now);
  }, [transactions, conversations, now]);

  if (!shop || !loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          aria-label="Loading dashboard"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Typography variant="caption" className="text-muted-foreground">
            Welcome back
          </Typography>
          <Typography variant="heading-h1">{shop.name}</Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <PostStoryButton />
          <Button asChild variant="outline" size="lg">
            <Link href="/seller/inbox">
              Open inbox
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="cta" size="lg">
            <Link href="/seller/products/new">
              <Plus className="size-4" />
              Add product
            </Link>
          </Button>
        </div>
      </header>

      {stats.openDisputes > 0 && <DisputeAlert count={stats.openDisputes} />}

      <EarningsMomentum stats={stats} />

      <DashboardStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={transactions.slice(0, 5)} />
        <RecentConversations
          conversations={conversations.filter((c) => c.unreadCount > 0).slice(0, 5)}
        />
      </div>
    </div>
  );
}
