type StatCardProps = {
  title: string
  value: number
}

export function StatCard({ title, value }: StatCardProps) {
  return (
    <article
      className="flex flex-col justify-between rounded-xl p-7 transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        minHeight: "9rem",
      }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-text-faint)" }}
      >
        {title}
      </span>

      <span
        className="tabular text-5xl font-bold tracking-tight"
        style={{ color: "var(--color-text)" }}
      >
        {value.toLocaleString("es-ES")}
      </span>
    </article>
  )
}