import { Star } from "lucide-react";

/** Compact star rating for service listings (no emoji, brand style). */
export function ServiceRating({
  value,
  count,
  size = "size-3",
}: {
  value: number | null;
  count?: number;
  size?: string;
}) {
  if (!value) return null;
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            className={`${size} ${
              star <= rounded
                ? "fill-[#ffb020] text-[#ffb020]"
                : "fill-[#e8e0d6] text-[#e8e0d6]"
            }`}
            key={star}
          />
        ))}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[9px] font-black text-[#8a7d91]">
          {value.toFixed(1)} · {count}
        </span>
      )}
    </span>
  );
}
