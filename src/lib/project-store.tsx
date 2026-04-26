'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type {
  Project,
  CreateProjectData,
  TimelineMilestone,
  SupervisorReport,
} from '@/lib/project-types'
import {
  getProjects,
  getProject as getProjectAction,
  getProjectsByCustomerId as getProjectsByCustomerIdAction,
  createProject as createProjectAction,
  updateProject as updateProjectAction,
  updateProjectStatus as updateProjectStatusAction,
  deleteProject as deleteProjectAction,
  addTimelineMilestone as addTimelineMilestoneAction,
  updateTimelineMilestone as updateTimelineMilestoneAction,
  reorderTimeline as reorderTimelineAction,
  getSupervisorReports as getSupervisorReportsAction,
  addSupervisorReport as addSupervisorReportAction,
} from '@/lib/actions/projects'

type ProjectStoreValue = {
  projects: Project[]
  loading: boolean
  getProject: (id: string) => Project | undefined
  getProjectsByCustomerId: (customerId: string) => Project[]
  createProject: (data: CreateProjectData) => Promise<Project | undefined>
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  updateProjectStatus: (id: string, status: Project['status']) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addTimelineMilestone: (projectId: string, milestone: Omit<TimelineMilestone, 'id' | 'order'>) => Promise<void>
  updateTimelineMilestone: (projectId: string, milestoneId: string, patch: Partial<TimelineMilestone>) => Promise<void>
  reorderTimeline: (projectId: string, milestoneIds: string[]) => Promise<void>
  getSupervisorReports: (projectId: string) => Promise<SupervisorReport[]>
  addSupervisorReport: (report: Omit<SupervisorReport, 'id' | 'submittedAt'>) => Promise<void>
  refresh: () => Promise<void>
}

const ProjectStoreContext = createContext<ProjectStoreValue | null>(null)

export function ProjectStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getProjects()
    setProjects(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  )

  const getProjectsByCustomerId = useCallback(
    (customerId: string) => projects.filter((p) => p.customerId === customerId),
    [projects]
  )

  const createProject = useCallback(async (data: CreateProjectData) => {
    const result = await createProjectAction(data)
    if ('error' in result) return undefined
    await refresh()
    return projects.find((p) => p.id === result.data?.id)
  }, [projects, refresh])

  const updateProject = useCallback(async (
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    await updateProjectAction(id, data)
    await refresh()
  }, [refresh])

  const updateProjectStatus = useCallback(async (id: string, status: Project['status']) => {
    await updateProjectStatusAction(id, status)
    setProjects((prev) =>
      prev.map((p) => p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p)
    )
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    await deleteProjectAction(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addTimelineMilestone = useCallback(async (
    projectId: string,
    milestone: Omit<TimelineMilestone, 'id' | 'order'>
  ) => {
    await addTimelineMilestoneAction(projectId, milestone)
    await refresh()
  }, [refresh])

  const updateTimelineMilestone = useCallback(async (
    projectId: string,
    milestoneId: string,
    patch: Partial<TimelineMilestone>
  ) => {
    await updateTimelineMilestoneAction(projectId, milestoneId, patch)
    await refresh()
  }, [refresh])

  const reorderTimeline = useCallback(async (projectId: string, milestoneIds: string[]) => {
    await reorderTimelineAction(projectId, milestoneIds)
    await refresh()
  }, [refresh])

  const getSupervisorReports = useCallback(async (projectId: string) => {
    return getSupervisorReportsAction(projectId)
  }, [])

  const addSupervisorReport = useCallback(async (
    report: Omit<SupervisorReport, 'id' | 'submittedAt'>
  ) => {
    await addSupervisorReportAction(report)
    await refresh()
  }, [refresh])

  const value: ProjectStoreValue = {
    projects,
    loading,
    getProject,
    getProjectsByCustomerId,
    createProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
    addTimelineMilestone,
    updateTimelineMilestone,
    reorderTimeline,
    getSupervisorReports,
    addSupervisorReport,
    refresh,
  }

  return (
    <ProjectStoreContext.Provider value={value}>
      {children}
    </ProjectStoreContext.Provider>
  )
}

export function useProjectStore() {
  const ctx = useContext(ProjectStoreContext)
  if (!ctx) throw new Error('useProjectStore must be used within ProjectStoreProvider')
  return ctx
}