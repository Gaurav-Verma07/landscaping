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

  const addSupervisorReport = useCallback(
    (report: Omit<SupervisorReport, "id" | "submittedAt">) => {
      const now = new Date().toISOString()
      const newReport: SupervisorReport = {
        ...report,
        id: createId(),
        submittedAt: now,
      }
      saveReports([...reports, newReport])
    },
    [reports, saveReports],
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
