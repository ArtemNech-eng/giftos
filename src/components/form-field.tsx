import { cn } from "@/lib/utils";

export function FieldLabel({
  children,
  htmlFor,
  optional,
}: {
  children: React.ReactNode;
  htmlFor: string;
  optional?: boolean;
}) {
  return (
    <label
      className="mb-1.5 flex text-sm font-semibold text-[#5c464d]"
      htmlFor={htmlFor}
    >
      {children}
      {optional && (
        <span className="ml-auto font-normal text-[#9b858c]">Необязательно</span>
      )}
    </label>
  );
}

export const inputClassName =
  "h-11 w-full rounded-xl border border-[#e7d8dc] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#b3a0a6] focus:border-[#df4f7d] focus:ring-4 focus:ring-[#df4f7d]/10";

export const textAreaClassName = cn(inputClassName, "h-auto min-h-28 py-3");
