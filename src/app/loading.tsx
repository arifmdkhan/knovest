import { ConsensusLogo } from "@/components/ConsensusLogo";


export default function Loading() {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-500">
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          {/* Subtle Glow */}
          <div className="absolute inset-0 scale-150 bg-primary/10 blur-2xl rounded-full" />

          {/* Outer Rotating Ring */}
          <div
            className="absolute inset-0 -m-4 rounded-full border-2 border-t-primary/30 border-r-primary/10 border-b-transparent border-l-transparent animate-spin"
            style={{ animationDuration: '3s' }}
          />

          {/* Inner Counter-Rotating Ring */}
          <div
            className="absolute inset-0 -m-4 rounded-full border-2 border-b-primary/40 border-l-transparent border-t-transparent border-r-transparent animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '2s' }}
          />

          {/* Logo */}
          <ConsensusLogo className="h-10 w-10 text-primary relative z-10 drop-shadow-sm" />
        </div>

        {/* Text */}
        <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/80 uppercase animate-pulse">
          Loading
        </p>
      </div>
    </div>
  );
}
