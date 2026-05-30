import { BadgeCheck } from "lucide-react";

import { PausedShopBanner } from "@/components/PausedShopBanner";
import { ShareButton } from "@/components/ShareButton";
import { Typography } from "@/components/Typography";
import type { Shop } from "@/types";
import { ChatWithShopButton } from "./ChatWithShopButton";
import { FollowButton } from "./FollowButton";

interface ShopHeaderProps {
  shop: Shop;
  productCount: number;
}

export function ShopHeader({ shop, productCount }: ShopHeaderProps) {
  const memberSince = shop.createdAt
    ? new Date(shop.createdAt).toLocaleDateString("en-NG", {
        month: "long",
        year: "numeric",
      })
    : null;

  const paused = shop.isActive === false;

  return (
    <div className="flex flex-col gap-4">
      {paused && <PausedShopBanner shopName={shop.name} />}
      <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8 lg:flex-row lg:items-start lg:gap-8">
        <span
          aria-hidden
          className="grid size-20 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary sm:size-24"
        >
          <Typography variant="display-md">{shop.name.charAt(0)}</Typography>
        </span>

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="heading-h1">{shop.name}</Typography>
              {shop.verified && <BadgeCheck className="size-5 text-primary" />}
            </div>
            <Typography variant="body-sm" className="text-muted-foreground">
              {shop.handle}
            </Typography>
            {shop.ownerName && (
              <Typography variant="body-sm" className="text-muted-foreground">
                Owned by{" "}
                <span className="font-medium text-foreground">
                  {shop.ownerName}
                </span>
              </Typography>
            )}
          </div>

          {shop.bio && (
            <Typography variant="body-md" className="max-w-2xl text-muted-foreground">
              {shop.bio}
            </Typography>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Stat label="listings" value={productCount.toString()} />
            {shop.followerCount !== undefined && (
              <Stat
                label={shop.followerCount === 1 ? "follower" : "followers"}
                value={shop.followerCount.toLocaleString("en-NG")}
              />
            )}
            {shop.totalSales !== undefined && (
              <Stat
                label="sales"
                value={shop.totalSales.toLocaleString("en-NG")}
              />
            )}
            {memberSince && (
              <Stat label="Joined" value={memberSince} labelFirst />
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {/* When paused, Follow becomes the primary CTA — re-engagement signal */}
            {paused ? (
              <>
                <FollowButton
                  shopId={shop.id}
                  ownerId={shop.ownerId}
                  initialFollowing={shop.isFollowing ?? false}
                />
                <ChatWithShopButton
                  shopId={shop.id}
                  ownerId={shop.ownerId}
                  paused
                />
              </>
            ) : (
              <>
                <ChatWithShopButton shopId={shop.id} ownerId={shop.ownerId} />
                <FollowButton
                  shopId={shop.id}
                  ownerId={shop.ownerId}
                  initialFollowing={shop.isFollowing ?? false}
                />
              </>
            )}
            <ShareButton
              url={`/shops/${shop.id}`}
              title={shop.name}
              text={`Check out ${shop.name} on Ahia`}
              label="Share"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  labelFirst = false,
}: {
  label: string;
  value: string;
  /** Render the label before the value — natural for "Joined May 2026"
   *  but awkward for "0 listings". Defaults to value-first. */
  labelFirst?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      {labelFirst && (
        <Typography variant="caption" className="text-muted-foreground">
          {label}
        </Typography>
      )}
      <Typography variant="heading-h4">{value}</Typography>
      {!labelFirst && (
        <Typography variant="caption" className="text-muted-foreground">
          {label}
        </Typography>
      )}
    </div>
  );
}
