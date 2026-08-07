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
    <main className="min-h-screen bg-[#f7f4fb] px-4 py-8 text-[#251d31]">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <article className="mx-auto max-w-2xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-black text-[#8753e6]"
          href={author?.username ? `/u/${author.username}` : "/feed"}
        >
          <ArrowLeft className="size-4" /> К автору
        </Link>
        <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f0e9ff] px-3 py-1.5 text-xs font-black text-[#7549d0]">
          <Sparkles className="size-3.5" /> Публикация автора
        </p>
        <h1 className="mt-5 text-balance text-4xl font-bold leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-xs text-[#81748a]">
          {author?.display_name ?? "Автор"} · {published}
        </p>
        <div className="mt-8 whitespace-pre-wrap text-[16px] leading-8 text-[#5f5369]">
          {post.body}
        </div>
      </article>
    </main>
  );
}
