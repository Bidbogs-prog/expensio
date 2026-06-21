import Image from "next/image";
import { cn } from "@/lib/utils";
import { memberColor, initialOf } from "@/lib/member-ui";

interface MemberAvatarProps {
  id: string;
  label: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function MemberAvatar({ id, label, avatarUrl, size = 32, className }: MemberAvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const color = memberColor(id);
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `${color}22`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}55`,
      }}
    >
      {initialOf(label)}
    </span>
  );
}
