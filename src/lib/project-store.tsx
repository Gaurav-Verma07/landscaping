"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type {
  Project,
  CreateProjectData,
  TimelineMilestone,
  TimelineMilestoneType,
  SupervisorReport,
} from "@/lib/project-types"
import { PROJECT_SEED_DATA } from "@/lib/project-seed"

const STORAGE_KEY = "landscaping-v2-projects"
const REPORTS_STORAGE_KEY = "landscaping-v2-supervisor-reports"

function loadProjectsFromStorage(): Project[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "") return [...PROJECT_SEED_DATA]
    const parsed = JSON.parse(raw) as Project[]
    return Array.isArray(parsed) ? parsed : [...PROJECT_SEED_DATA]
  } catch {
    return [...PROJECT_SEED_DATA]
  }
}

function loadReportsFromStorage(): SupervisorReport[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY)
    if (!raw || raw === "") return []
    const parsed = JSON.parse(raw) as SupervisorReport[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveProjectsToStorage(projects: Project[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {}
}

function saveReportsToStorage(reports: SupervisorReport[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports))
  } catch {}
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type ProjectStoreValue = {
  projects: Project[]
  getProject: (id: string) => Project | undefined
  getProjectsByCustomerId: (customerId: string) => Project[]
  createProject: (data: CreateProjectData) => Project
  updateProject: (id: string, data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>) => void
  deleteProject: (id: string) => void
  updateProjectStatus: (id: string, status: Project["status"]) => void
  addTimelineMilestone: (projectId: string, milestone: Omit<TimelineMilestone, "id" | "order">) => void
  updateTimelineMilestone: (projectId: string, milestoneId: string, patch: Partial<TimelineMilestone>) => void
  reorderTimeline: (projectId: string, milestoneIds: string[]) => void
  getSupervisorReports: (projectId: string) => SupervisorReport[]
  addSupervisorReport: (report: Omit<SupervisorReport, "id" | "submittedAt">) => void
}

const ProjectStoreContext = createContext<ProjectStoreValue | null>(null)

export function ProjectStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [reports, setReports] = useState<SupervisorReport[]>([])

  useEffect(() => {
    setProjects(loadProjectsFromStorage())
    setReports(loadReportsFromStorage())
  }, [])

  const saveProjects = useCallback((list: Project[]) => {
    setProjects(list)
    saveProjectsToStorage(list)
  }, [])

  const saveReports = useCallback((list: SupervisorReport[]) => {
    setReports(list)
    saveReportsToStorage(list)
  }, [])

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  )

  const getProjectsByCustomerId = useCallback(
    (customerId: string) =>
      projects.filter((p) => p.customerId === customerId),
    [projects],
  )

  const createProject = useCallback(
    (data: CreateProjectData) => {
      const now = new Date().toISOString()
      const project: Project = {
        ...data,
        id: createId(),
        timeline: data.timeline ?? [],
        createdAt: now,
        updatedAt: now,
      }
      saveProjects([...projects, project])
      return project
    },
    [projects, saveProjects],
  )

  const updateProject = useCallback(
    (id: string, data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      saveProjects(
        projects.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: now } : p,
        ),
      )
    },
    [projects, saveProjects],
  )

  const deleteProject = useCallback(
    (id: string) => {
      saveProjects(projects.filter((p) => p.id !== id))
      saveReports(reports.filter((r) => r.projectId !== id))
    },
    [projects, reports, saveProjects, saveReports],
  )

  const updateProjectStatus = useCallback(
    (id: string, status: Project["status"]) => {
      updateProject(id, { status })
    },
    [updateProject],
  )

  const addTimelineMilestone = useCallback(
    (projectId: string, milestone: Omit<TimelineMilestone, "id" | "order">) => {
      const proj = projects.find((p) => p.id === projectId)
      if (!proj) return
      const order = proj.timeline.length
      const newMilestone: TimelineMilestone = {
        ...milestone,
        id: createId(),
        order,
      }
      updateProject(projectId, {
        timeline: [...proj.timeline, newMilestone].sort((a, b) => a.order - b.order),
      })
    },
    [projects, updateProject],
  )

  const updateTimelineMilestone = useCallback(
    (projectId: string, milestoneId: string, patch: Partial<TimelineMilestone>) => {
      const proj = projects.find((p) => p.id === projectId)
      if (!proj) return
      const timeline = proj.timeline.map((m) =>
        m.id === milestoneId ? { ...m, ...patch } : m,
      )
      updateProject(projectId, { timeline })
    },
    [projects, updateProject],
  )

  const reorderTimeline = useCallback(
    (projectId: string, milestoneIds: string[]) => {
      const proj = projects.find((p) => p.id === projectId)
      if (!proj) return
      const orderMap = new Map(milestoneIds.map((id, i) => [id, i]))
      const timeline = [...proj.timeline].sort(
        (a, b) => (orderMap.get(a.id) ?? a.order) - (orderMap.get(b.id) ?? b.order),
      )
      timeline.forEach((m, i) => {
        m.order = i
      })
      updateProject(projectId, { timeline })
    },
    [projects, updateProject],
  )

  const getSupervisorReports = useCallback(
    (projectId: string) =>
      reports.filter((r) => r.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date)),
    [reports],
  )

  const inferMilestoneTypeFromNotes = (notes: string): TimelineMilestoneType | null => {
    const q = (notes || "").toLowerCase()
    // Simple keyword mapping to timeline milestone types (non-AI heuristic).
    if (q.includes("deposit") || q.includes("down payment") || q.includes("initial payment")) return "deposit_payment"
    if (q.includes("material") || q.includes("plants") || q.includes("mulch") || q.includes("order") && !q.includes("supplier")) return "material_ordering"
    if (q.includes("supplier") || q.includes("vendor") || (q.includes("order") && (q.includes("supplier") || q.includes("vendor")))) return "supplier_scheduling"
    if (q.includes("crew") || q.includes("team") || q.includes("assigned crew") || q.includes("staff")) return "crew_assignment"
    if (q.includes("equipment") || q.includes("truck") || q.includes("excavator") || q.includes("machine")) return "equipment_scheduling"
    if (q.includes("rental") || q.includes("renting") || q.includes("hire")) return "rental_scheduling"
    if (q.includes("walkthrough") || q.includes("final") || q.includes("handover")) return "final_walkthrough"
    if (q.includes("phase") || q.includes("work") || q.includes("install") || q.includes("construction")) return "work_phase"
    return null
  }

  const shiftTimelineDueDatesFromReport = (report: Omit<SupervisorReport, "id" | "submittedAt">) => {
    const proj = projects.find((p) => p.id === report.projectId)
    if (!proj) return
    const milestoneList = [...proj.timeline].sort((a, b) => a.order - b.order)
    const reportDate = new Date(report.date)
    if (Number.isNaN(reportDate.getTime())) return

    const targetType = inferMilestoneTypeFromNotes(report.progressNotes)

    const incomplete = milestoneList.filter((m) => !m.completedAt)
    if (incomplete.length === 0) return

    const targetMilestone =
      (targetType ? incomplete.find((m) => m.type === targetType) : null) ??
      incomplete[0]
    if (!targetMilestone) return

    const dueDateMs = targetMilestone.dueDate ? new Date(targetMilestone.dueDate).getTime() : null
    const reportMs = reportDate.getTime()
    const dayMs = 24 * 60 * 60 * 1000

    // If due date is missing, set it (and only it) to the report date.
    if (!dueDateMs) {
      const updatedTimeline = milestoneList.map((m) =>
        m.id === targetMilestone.id
          ? { ...m, dueDate: report.date.slice(0, 10) }
          : m,
      )
      updateProject(report.projectId, { timeline: updatedTimeline })
      return
    }

    // Only push due dates when the report arrives after the due date (late report).
    if (reportMs <= dueDateMs) return

    const deltaDays = Math.round((reportMs - dueDateMs) / dayMs)
    const targetOrder = targetMilestone.order

    const updatedTimeline = milestoneList.map((m) => {
      if (m.completedAt) return m
      if (m.order < targetOrder) return m
      if (!m.dueDate) return m
      const currentMs = new Date(m.dueDate).getTime()
      if (Number.isNaN(currentMs)) return m
      return { ...m, dueDate: new Date(currentMs + deltaDays * dayMs).toISOString().slice(0, 10) }
    })

    updateProject(report.projectId, { timeline: updatedTimeline })
  }

  const addSupervisorReport = useCallback(
    (report: Omit<SupervisorReport, "id" | "submittedAt">) => {
      const now = new Date().toISOString()
      const newReport: SupervisorReport = {
        ...report,
        id: createId(),
        submittedAt: now,
      }
      saveReports([...reports, newReport])

      // Auto-adjust upcoming timeline milestones when supervisor reports are late.
      shiftTimelineDueDatesFromReport(report)
    },
    [reports, saveReports, projects],
  )

  const value: ProjectStoreValue = {
    projects,
    getProject,
    getProjectsByCustomerId,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    addTimelineMilestone,
    updateTimelineMilestone,
    reorderTimeline,
    getSupervisorReports,
    addSupervisorReport,
  }

  return (
    <ProjectStoreContext.Provider value={value}>
      {children}
    </ProjectStoreContext.Provider>
  )
}

export function useProjectStore() {
  const ctx = useContext(ProjectStoreContext)
  if (!ctx) throw new Error("useProjectStore must be used within ProjectStoreProvider")
  return ctx
}
