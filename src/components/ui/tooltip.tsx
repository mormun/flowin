"use client"

export function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode
  text: string
}) {
  return (
    <div className="group relative flex items-center">
      {children}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md text-xs text-white opacity-0 transition group-hover:opacity-100"
        style={{
          bottom: "calc(100% + 8px)",
          backgroundColor: "#111",
          padding: "0.375rem 0.75rem",
          fontSize: "0.75rem",
          lineHeight: "1.4",
          borderRadius: "6px",
        }}
      >
        {text}
      </div>
    </div>
  )
}