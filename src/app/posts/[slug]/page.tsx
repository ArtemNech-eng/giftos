import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!hasSupabaseEnvironment()) return { robots: { index: false, follow: false } };
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("creator_posts")
    .select("title, body, visibility")
    .eq("slug", slug)
    .maybeSingle();
  if (!post || post.visibility !== "public")
    return { robots: { index: false, follow: false } };
  const description = post.body.slice(0, 160);
  return {
    title: `${post.title} — «Хочу также»`,
    description,
    alternates: { canonical: `/posts/${slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      images: [
        {
          url: `/og?type=post&title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(description.slice(0, 160))}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function CreatorPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("creator_posts")
    .select("id, title, body, visibility, published_at, author_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!post || post.visibility !== "public") notFound();
  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", post.author_id)
    .maybeSingle();
  const published = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(post.published_at));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.published_at,
    author: { "@type": "Person", name: author?.display_name ?? "Автор" },
  };

  return (
    <main className="min-h-screen bg-[#0c0e14] px-4 py-8 text-white">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <article className="mx-auto max-w-2xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#e5a3d5]"
          href={author?.username ? `/u/${author.username}` : "/feed"}
        >
          <ArrowLeft className="size-4" /> К автору
        </Link>
        <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#281633] px-3 py-1.5 text-xs font-semibold text-[#e3b7ff]">
          <Sparkles className="size-3.5" /> Публикация автора
        </p>
        <h1 className="mt-5 text-balance text-4xl font-bold leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-[#aaa3b5]">
          {author?.display_name ?? "Автор"} · {published}
        </p>
        <div className="mt-8 whitespace-pre-wrap text-[17px] leading-8 text-[#ded6e6]">
          {post.body}
        </div>
      </article>
    </main>
  );
}
