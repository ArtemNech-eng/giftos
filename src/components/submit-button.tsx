"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  pendingLabel = "Сохраняем…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className={cn(className)} disabled={pending} type="submit">
      {pending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
