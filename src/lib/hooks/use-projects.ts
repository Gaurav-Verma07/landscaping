'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProjects,
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
import type {
  Project,
  CreateProjectData,
  TimelineMilestone,
  SupervisorReport,
} from '@/types/project-types'

// ============================================
// QUERY KEYS
// ============================================

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
  byCustomer: (customerId: string) => ['projects', 'customer', customerId] as const,
  supervisorReports: (projectId: string) => ['supervisor-reports', projectId] as const,
}

// ============================================
// QUERIES
// ============================================

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  })
}

export function useSupervisorReports(projectId: string) {
  return useQuery({
    queryKey: projectKeys.supervisorReports(projectId),
    queryFn: () => getSupervisorReportsAction(projectId),
    enabled: !!projectId,
  })
}

// ============================================
// MUTATIONS
// ============================================

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectData) => createProjectAction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
    }) => updateProjectAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Project['status'] }) =>
      updateProjectStatusAction(id, status),
    // Optimistic update — status change is visible instantly
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all })
      const previous = queryClient.getQueryData<Project[]>(projectKeys.all)
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) =>
        old?.map((p) =>
          p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
        ) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(projectKeys.all, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProjectAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all })
      const previous = queryClient.getQueryData<Project[]>(projectKeys.all)
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) =>
        old?.filter((p) => p.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(projectKeys.all, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useAddTimelineMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      milestone,
    }: {
      projectId: string
      milestone: Omit<TimelineMilestone, 'id' | 'order'>
    }) => addTimelineMilestoneAction(projectId, milestone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUpdateTimelineMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      milestoneId,
      patch,
    }: {
      projectId: string
      milestoneId: string
      patch: Partial<TimelineMilestone>
    }) => updateTimelineMilestoneAction(projectId, milestoneId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useReorderTimeline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      milestoneIds,
    }: {
      projectId: string
      milestoneIds: string[]
    }) => reorderTimelineAction(projectId, milestoneIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useAddSupervisorReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (report: Omit<SupervisorReport, 'id' | 'submittedAt'>) =>
      addSupervisorReportAction(report),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({
        queryKey: projectKeys.supervisorReports(variables.projectId),
      })
    },
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// Drop-in replacement for useProjectStore()
// Remove once all components import hooks directly
// ============================================

export function useProjectStore() {
  const queryClient = useQueryClient()
  const { data: projects = [], isLoading: loading } = useProjects()

  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const updateStatusMutation = useUpdateProjectStatus()
  const deleteMutation = useDeleteProject()
  const addMilestoneMutation = useAddTimelineMilestone()
  const updateMilestoneMutation = useUpdateTimelineMilestone()
  const reorderMutation = useReorderTimeline()
  const addReportMutation = useAddSupervisorReport()

  return {
    projects,
    loading,

    getProject: (id: string) => projects.find((p) => p.id === id),

    getProjectsByCustomerId: (customerId: string) =>
      projects.filter((p) => p.customerId === customerId),

    createProject: async (data: CreateProjectData) => {
      const result = await createMutation.mutateAsync(data)
      if ('error' in result) return undefined
      const updated = queryClient.getQueryData<Project[]>(projectKeys.all)
      return updated?.find((p) => p.id === (result as any).data?.id)
    },

    updateProject: (
      id: string,
      data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
    ) => updateMutation.mutateAsync({ id, data }).then(() => {}),

    updateProjectStatus: (id: string, status: Project['status']) =>
      updateStatusMutation.mutateAsync({ id, status }).then(() => {}),

    deleteProject: (id: string) => deleteMutation.mutateAsync(id).then(() => {}),

    addTimelineMilestone: (
      projectId: string,
      milestone: Omit<TimelineMilestone, 'id' | 'order'>
    ) => addMilestoneMutation.mutateAsync({ projectId, milestone }).then(() => {}),

    updateTimelineMilestone: (
      projectId: string,
      milestoneId: string,
      patch: Partial<TimelineMilestone>
    ) => updateMilestoneMutation.mutateAsync({ projectId, milestoneId, patch }).then(() => {}),

    reorderTimeline: (projectId: string, milestoneIds: string[]) =>
      reorderMutation.mutateAsync({ projectId, milestoneIds }).then(() => {}),

    getSupervisorReports: (projectId: string) => getSupervisorReportsAction(projectId),

    addSupervisorReport: (report: Omit<SupervisorReport, 'id' | 'submittedAt'>) =>
      addReportMutation.mutateAsync(report).then(() => {}),

    refresh: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.all }).then(() => {}),
  }
}