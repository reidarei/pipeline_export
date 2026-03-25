import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, startOfDay, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import type { Consultant, Project } from './types'

export interface ConsultantGroup {
  type: 'free' | 'busy'
  label?: string
  consultants: Consultant[]
  freeDate?: Date
}

export const MONTH_COLORS = [
  'oklch(0.88 0.10 50)',
  'oklch(0.85 0.12 160)',
  'oklch(0.88 0.10 330)',
  'oklch(0.88 0.08 80)',
  'oklch(0.85 0.12 200)',
  'oklch(0.88 0.10 290)',
]

export function getMonthColor(monthIndex: number): string {
  return MONTH_COLORS[monthIndex % 6]
}

export function generateTimelineMonths(startDate: Date, monthCount: number) {
  const start = startOfMonth(startDate)
  const end = addMonths(start, monthCount - 1)
  return eachMonthOfInterval({ start, end })
}

export function parseDateSafely(dateInput: string | Date): Date {
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      return parseISO(dateInput)
    }
    return parseISO(dateInput + 'T00:00:00')
  }
  return dateInput
}

export function calculatePosition(date: Date | string, timelineStart: Date, pixelsPerDay: number): number {
  const normalizedDate = startOfDay(parseDateSafely(date))
  const normalizedStart = startOfDay(new Date(timelineStart))
  const days = differenceInDays(normalizedDate, normalizedStart)
  return days * pixelsPerDay
}

export function calculateWidth(startDate: Date | string, endDate: Date | string, pixelsPerDay: number): number {
  const normalizedStart = startOfDay(parseDateSafely(startDate))
  const normalizedEnd = startOfDay(parseDateSafely(endDate))
  const days = differenceInDays(normalizedEnd, normalizedStart) + 1
  return Math.max(pixelsPerDay, days * pixelsPerDay)
}

export function formatDateForInput(date: string | Date): string {
  return format(parseDateSafely(date), 'yyyy-MM-dd')
}

export function isConsultantOnLeave(consultant: Consultant, date: Date = new Date()): boolean {
  if (!consultant.leave) return false
  
  const leaveStart = startOfDay(parseDateSafely(consultant.leave.startDate))
  const leaveEnd = startOfDay(parseDateSafely(consultant.leave.endDate))
  const checkDate = startOfDay(date)
  
  return !isBefore(checkDate, leaveStart) && !isAfter(checkDate, leaveEnd)
}

export function calculateConsultantAllocation(consultant: Consultant, projects: Project[], date: Date = new Date()): number {
  if (isConsultantOnLeave(consultant, date)) {
    return 100
  }
  
  const totalAllocation = projects
    .filter(project => project.status === 'active')
    .reduce((sum, project) => {
      const assignment = project.assignments.find(a => a.consultantId === consultant.id)
      return sum + (assignment?.percentage || 0)
    }, 0)
  
  return totalAllocation
}

export function calculateConsultantAvailability(consultant: Consultant, projects: Project[], date: Date = new Date()): number {
  if (isConsultantOnLeave(consultant, date)) {
    return 0
  }
  
  const allocation = calculateConsultantAllocation(consultant, projects, date)
  return Math.max(0, 100 - allocation)
}

export function getConsultantFreeDate(consultant: Consultant, projects: Project[]): Date | null {
  const activeProjects = projects.filter(p => p.status === 'active')
  const consultantProjects = activeProjects.filter(p => 
    p.assignments.some(a => a.consultantId === consultant.id)
  )
  
  if (consultantProjects.length === 0) {
    return null
  }
  
  const latestEndDate = consultantProjects.reduce((latest, project) => {
    const projectEnd = parseDateSafely(project.endDate)
    return isAfter(projectEnd, latest) ? projectEnd : latest
  }, parseDateSafely(consultantProjects[0].endDate))
  
  return latestEndDate
}

export function sortConsultantsByFreeTime(consultants: Consultant[], projects: Project[]): Consultant[] {
  const now = new Date()
  
  return [...consultants].sort((a, b) => {
    const allocationA = calculateConsultantAllocation(a, projects)
    const allocationB = calculateConsultantAllocation(b, projects)
    
    const isFreeA = allocationA < 100
    const isFreeB = allocationB < 100
    
    if (isFreeA && !isFreeB) return -1
    if (!isFreeA && isFreeB) return 1
    
    if (isFreeA && isFreeB) {
      return allocationA - allocationB
    }
    
    const freeDateA = getConsultantFreeDate(a, projects)
    const freeDateB = getConsultantFreeDate(b, projects)
    
    if (!freeDateA && !freeDateB) return 0
    if (!freeDateA) return -1
    if (!freeDateB) return 1
    
    const daysUntilFreeA = differenceInDays(freeDateA, now)
    const daysUntilFreeB = differenceInDays(freeDateB, now)
    
    return daysUntilFreeA - daysUntilFreeB
  })
}

export function calculateNewAllocation(
  consultantId: string,
  projects: Project[],
  targetProjectId: string,
  newPercentage: number
): number {
  return projects
    .filter(project => project.status === 'active')
    .reduce((sum, project) => {
      if (project.id === targetProjectId) {
        return sum + newPercentage
      }
      const assignment = project.assignments.find(a => a.consultantId === consultantId)
      return sum + (assignment?.percentage || 0)
    }, 0)
}

export function validateAllocation(
  consultantId: string,
  projects: Project[],
  targetProjectId: string,
  newPercentage: number
): { isValid: boolean; totalAllocation: number; exceeded: number } {
  const totalAllocation = calculateNewAllocation(consultantId, projects, targetProjectId, newPercentage)
  const exceeded = Math.max(0, totalAllocation - 100)
  
  return {
    isValid: totalAllocation <= 100,
    totalAllocation,
    exceeded
  }
}

export interface MonthlyAvailability {
  month: string
  percentage: number
  date: Date
}

export function calculateMonthlyAvailability(
  consultant: Consultant,
  projects: Project[],
  monthsAhead: number = 6
): MonthlyAvailability[] {
  const now = new Date()
  const monthlyAvailability: MonthlyAvailability[] = []
  
  const activeProjects = projects.filter(p => p.status === 'active')
  const consultantProjects = activeProjects.filter(p => 
    p.assignments.some(a => a.consultantId === consultant.id)
  )
  
  for (let i = 0; i < monthsAhead; i++) {
    const monthDate = addMonths(startOfMonth(now), i)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    
    let totalAllocation = 0
    let isOnLeave = false
    
    if (consultant.leave) {
      const leaveStart = startOfDay(parseDateSafely(consultant.leave.startDate))
      const leaveEnd = startOfDay(parseDateSafely(consultant.leave.endDate))
      const hasLeaveOverlap = isBefore(leaveStart, monthEnd) && isAfter(leaveEnd, monthStart)
      
      if (hasLeaveOverlap) {
        isOnLeave = true
      }
    }
    
    if (isOnLeave) {
      totalAllocation = 100
    } else {
      consultantProjects.forEach(project => {
        const projectStart = parseDateSafely(project.startDate)
        const projectEnd = parseDateSafely(project.endDate)
        const assignment = project.assignments.find(a => a.consultantId === consultant.id)
        
        if (!assignment) return
        
        const hasOverlap = isBefore(projectStart, monthEnd) && isAfter(projectEnd, monthStart)
        
        if (hasOverlap) {
          totalAllocation += assignment.percentage
        }
      })
    }
    
    const availablePercentage = Math.max(0, 100 - totalAllocation)
    
    monthlyAvailability.push({
      month: format(monthDate, 'MMM'),
      percentage: availablePercentage,
      date: monthDate
    })
  }
  
  return monthlyAvailability
}

export function getNextFreeMonthLabel(monthlyAvailability: MonthlyAvailability[]): string | null {
  const firstAvailableMonth = monthlyAvailability.find(ma => ma.percentage > 0)
  if (!firstAvailableMonth) return null
  
  return `${firstAvailableMonth.percentage}% free in ${firstAvailableMonth.month}`
}

export function groupConsultantsByAvailability(consultants: Consultant[], projects: Project[]): ConsultantGroup[] {
  const groups: ConsultantGroup[] = []
  const now = new Date()
  
  const freeConsultants: Consultant[] = []
  const busyConsultantsMap = new Map<string, { consultants: Consultant[], freeDate: Date }>()
  
  consultants.forEach(consultant => {
    const monthlyAvailability = calculateMonthlyAvailability(consultant, projects, 12)
    const currentMonthAvailability = monthlyAvailability[0]?.percentage || 0
    
    if (currentMonthAvailability > 0) {
      freeConsultants.push(consultant)
    } else {
      let lastBusyMonthIndex = -1
      for (let i = 0; i < monthlyAvailability.length; i++) {
        if (monthlyAvailability[i].percentage === 0) {
          lastBusyMonthIndex = i
        } else {
          break
        }
      }
      
      if (lastBusyMonthIndex >= 0) {
        const lastBusyMonth = monthlyAvailability[lastBusyMonthIndex]
        const monthKey = format(lastBusyMonth.date, 'MMMM yyyy')
        
        if (!busyConsultantsMap.has(monthKey)) {
          busyConsultantsMap.set(monthKey, { consultants: [], freeDate: lastBusyMonth.date })
        }
        busyConsultantsMap.get(monthKey)!.consultants.push(consultant)
      }
    }
  })
  
  freeConsultants.sort((a, b) => {
    const allocationA = calculateConsultantAllocation(a, projects)
    const allocationB = calculateConsultantAllocation(b, projects)
    return allocationA - allocationB
  })
  
  if (freeConsultants.length > 0) {
    groups.push({
      type: 'free',
      consultants: freeConsultants
    })
  }
  
  const busyGroups = Array.from(busyConsultantsMap.entries())
    .map(([monthKey, { consultants, freeDate }]) => ({
      type: 'busy' as const,
      label: monthKey,
      consultants,
      freeDate
    }))
    .sort((a, b) => {
      if (!a.freeDate || !b.freeDate) return 0
      return differenceInDays(a.freeDate, now) - differenceInDays(b.freeDate, now)
    })
  
  busyGroups.forEach(group => {
    group.consultants.sort((a, b) => {
      const monthlyAvailabilityA = calculateMonthlyAvailability(a, projects, 12)
      const monthlyAvailabilityB = calculateMonthlyAvailability(b, projects, 12)
      
      let lastBusyMonthIndexA = -1
      for (let i = 0; i < monthlyAvailabilityA.length; i++) {
        if (monthlyAvailabilityA[i].percentage === 0) {
          lastBusyMonthIndexA = i
        } else {
          break
        }
      }
      
      let lastBusyMonthIndexB = -1
      for (let i = 0; i < monthlyAvailabilityB.length; i++) {
        if (monthlyAvailabilityB[i].percentage === 0) {
          lastBusyMonthIndexB = i
        } else {
          break
        }
      }
      
      if (lastBusyMonthIndexA < 0 || lastBusyMonthIndexB < 0) return 0
      
      const lastBusyMonthA = monthlyAvailabilityA[lastBusyMonthIndexA]
      const lastBusyMonthB = monthlyAvailabilityB[lastBusyMonthIndexB]
      
      return differenceInDays(lastBusyMonthA.date, now) - differenceInDays(lastBusyMonthB.date, now)
    })
  })
  
  groups.push(...busyGroups)
  
  return groups
}
