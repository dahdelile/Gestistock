import { cn } from "@/lib/utils"

interface GestistockLogoProps {
  size?: number
  className?: string
}

export function GestistockLogo({ size = 40, className }: GestistockLogoProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-700",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm" />
      <div className="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-br from-white/20 to-transparent" />

      <div className="relative flex flex-col items-center justify-center">
        <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
          GS
        </span>
        <div className="absolute bottom-1 w-3/5 h-0.5 bg-white/50 rounded-full" />
      </div>
    </div>
  )
}
