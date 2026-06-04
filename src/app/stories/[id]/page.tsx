import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStoryById } from "@/lib/services/stories";
import { StoryPermalinkClient } from "./_components/StoryPermalinkClient";

interface StoryPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server-rendered story permalink. Two reasons this page is SSR:
 *
 *   1. OpenGraph meta tags. When the seller shares this URL on WhatsApp /
 *      Twitter / iMessage, the crawler fetches the raw HTML once. It does
 *      NOT run JS — so the meta tags MUST be present on first response.
 *      generateMetadata() runs server-side and emits og:image/title/
 *      description from the story payload.
 *
 *   2. Guest-viewable. Backend's GET /stories/:id is behind optionalAuth,
 *      so SSR works cross-origin without any session cookie. No auth gate
 *      needed; anyone with the link can land here.
 *
 * Expired or missing story → notFound() (Next.js renders /not-found).
 * Backend returns 404 with code `story_expired` after 24h, which our
 * service maps to null.
 */
export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const story = await getStoryById(id);
  if (!story || !story.media) {
    return { title: "Story expired — Ahia" };
  }

  const title = story.caption?.trim() || `New drop on Ahia`;
  const description =
    story.caption?.trim() ||
    "A short look from a Nigerian seller on Ahia. Tap to visit the shop.";
  const ogImage =
    story.media.type === "image"
      ? story.media.url
      : story.media.poster ?? "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const story = await getStoryById(id);
  if (!story || !story.media) notFound();
  return <StoryPermalinkClient story={story} />;
}
