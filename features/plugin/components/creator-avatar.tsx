import { cn } from "@/lib/utils";
import type { CreatorProfile } from "@/features/plugin/types";

export function CreatorAvatar({
  creator,
  className,
  labelClassName,
}: {
  creator: CreatorProfile;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-4 border-white bg-[radial-gradient(circle_at_30%_30%,#f6ddd1_0%,#d3b4a2_45%,#9c7c70_100%)] shadow-[0_10px_28px_-18px_rgba(77,76,72,0.35)]",
        className
      )}
    >
      <span className={cn("text-lg font-semibold leading-none tracking-tight text-white", labelClassName)}>
        {creator.name[0]}
      </span>
    </div>
  );
}
