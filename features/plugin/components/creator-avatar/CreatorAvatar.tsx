import { cn } from "@/lib/utils";

import type { CreatorProfile } from "@/features/plugin/types";

interface CreatorAvatarProps {
  creator: CreatorProfile;
  className?: string;
  labelClassName?: string;
}

export function CreatorAvatar({ creator, className, labelClassName }: CreatorAvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{
        backgroundImage: "linear-gradient(135deg, #eceae3 0%, #c5c0b1 100%)",
      }}
    >
      <span
        className={cn("relative font-bold text-[#fffefb]", labelClassName)}
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        {creator.name[0]}
      </span>
    </div>
  );
}
