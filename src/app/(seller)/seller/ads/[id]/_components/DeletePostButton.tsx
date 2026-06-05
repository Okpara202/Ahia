"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { deleteDiscoverPost } from "@/lib/services/discover";
import { toast } from "@/store/toastStore";

interface DeletePostButtonProps {
  postId: string;
  /** Lifecycle of the post — controls the confirmation copy so a seller
   *  knows their campaign will be cancelled on a boosted delete. */
  status: "organic" | "boosted" | "expired";
}

export function DeletePostButton({ postId, status }: DeletePostButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteDiscoverPost(postId);
      toast.success(
        "Post removed",
        status === "boosted"
          ? "Campaign cancelled. The post is no longer in Discover."
          : "It's no longer in Discover."
      );
      router.replace("/seller/ads");
      router.refresh();
    } catch (err) {
      toast.fromApiError("Couldn't delete", err);
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <Typography variant="label-lg" className="text-destructive">
          Danger zone
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          {status === "boosted"
            ? "Remove this post and cancel its campaign. Already-charged plan fees aren't refunded."
            : status === "expired"
              ? "Remove this expired post from your history."
              : "Remove this post from Discover."}
        </Typography>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={deleting}
            className="w-fit border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {deleting ? "Removing…" : "Remove post"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this Discover post?</AlertDialogTitle>
            <AlertDialogDescription>
              {status === "boosted"
                ? "The post stops appearing in Discover and the campaign is cancelled. Plan fees already charged are not refunded."
                : "The post stops appearing in Discover. You can re-upload a new one any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
