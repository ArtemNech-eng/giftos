import { notFound } from "next/navigation";

import { ArtifactUnboxing } from "@/components/artifact-unboxing";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Распаковка артефакта",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ArtifactInstance = {
  id: string;
  series_id: string;
  serial_number: number;
  recipient_id: string;
  unboxed_at: string | null;
};
type ArtifactSeries = {
  title: string;
  artwork_path: string;
  rarity: "limited" | "rare" | "iconic";
  total_edition: number;
};

export default async function ArtifactUnboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: rawInstance } = await supabase
    .from("collectible_artifact_instances")
    .select("id, series_id, serial_number, recipient_id, unboxed_at")
    .eq("id", id)
    .maybeSingle();
  const instance = rawInstance as ArtifactInstance | null;
  // The recipient owns the reveal. Senders can see delivery confirmation on
  // the profile but cannot trigger another person's presentation moment.
  if (!instance || instance.recipient_id !== user.id) notFound();

  const [{ data: rawSeries }, { data: recipient }] = await Promise.all([
    supabase
      .from("collectible_artifact_series")
      .select("title, artwork_path, rarity, total_edition")
      .eq("id", instance.series_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const series = rawSeries as ArtifactSeries | null;
  if (!series || !recipient?.username) notFound();

  return (
    <ArtifactUnboxing
      artifact={{
        artworkPath: series.artwork_path,
        rarity: series.rarity,
        serial: instance.serial_number,
        title: series.title,
        totalEdition: series.total_edition,
      }}
      initiallyUnboxed={Boolean(instance.unboxed_at)}
      instanceId={instance.id}
      profileHref={`/u/${recipient.username}`}
    />
  );
}
