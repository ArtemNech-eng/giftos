export type FundraiserVisibility = "public" | "unlisted" | "private";
export type WishVisibility = "public" | "private";
export type SupportVisibility = "exact" | "activity_only" | "anonymous";
export type SupportStatus =
  "created" | "pending" | "succeeded" | "cancelled" | "refunded" | "failed";

export type ProfilePreview = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
};

export type FundraiserPreview = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  targetAmountMinor: number;
  currentAmountMinor: number;
  currency: string;
  participantsCount: number;
  visibility: FundraiserVisibility;
  owner: ProfilePreview;
};
