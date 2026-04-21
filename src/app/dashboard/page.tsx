import { MetricsCards } from "@/components/dashboard/overview/metrics-cards"
import { ProjectPipelineChart } from "@/components/dashboard/overview/project-pipeline-chart"
import { JobsTable } from "@/components/dashboard/overview/jobs-table"
import { ActivityFeed } from "@/components/dashboard/overview/activity-feed"
import data from "./data.json"

export default function Page() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <MetricsCards />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <ProjectPipelineChart />
          </div>
          <div className="col-span-3">
             <ActivityFeed />
          </div>
        </div>
        <JobsTable data={data} />
      </div>
    </>
  )
}
