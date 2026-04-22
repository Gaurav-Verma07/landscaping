export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome. Use the sidebar to open Customers or Communications. More modules will be added as you build from the PRD.
        </p>
      </div>
    </div>
  )
}
