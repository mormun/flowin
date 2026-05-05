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

      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
        {text}
      </div>

    </div>
  )
}