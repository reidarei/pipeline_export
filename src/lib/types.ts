export type ConsultantLevel = 'Junior' | 'Medior' | 'Senior' | 'Principal'

export type ProjectStatus = 'active' | 'closed' | 'planlagt'

export interface ConsultantLeave {
  startDate: string
  endDate: string
}

export interface Consultant {
  id: string
  name: string
  level: ConsultantLevel
  avatarUrl?: string
  leave?: ConsultantLeave
}

export interface ProjectAssignment {
  consultantId: string
  percentage: number
}

export interface SoftTagAssignment {
  consultantId: string
}

export interface Oppdragsgiver {
  id: string
  name: string
  contactPerson?: string
  email?: string
}

export interface Project {
  id: string
  name: string
  oppdragsgiver: string
  startDate: string
  endDate: string
  assignments: ProjectAssignment[]
  softTags?: SoftTagAssignment[]
  status: ProjectStatus
}

export type ViewMode = 'gantt' | 'projects' | 'consultants' | 'oppdragsgivere' | 'rapporter'
