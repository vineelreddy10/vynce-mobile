export function VynceLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes: Record<string, string> = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="text-2xl">⚡</span>
      <h1 className={`${sizes[size]} font-headline text-on-surface tracking-tight`}>
        Vynce
      </h1>
    </div>
  );
}
