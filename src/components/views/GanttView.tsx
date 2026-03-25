import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { addMonths, startOfMonth, addWeeks, startOfWeek, endOfMonth, isBefore, isAfter } from 'date-fns'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Project, Consultant } from '@/lib/types'
import { TimelineRuler } from '../gantt/TimelineRuler'
import { ProjectBar } from '../gantt/ProjectBar'
import { DraggableConsultant } from '../gantt/DraggableConsultant'
import { AssignmentDialog } from '../dialogs/AssignmentDialog'
import { ConsultantSelectorDialog } from '../dialogs/ConsultantSelectorDialog'
import { GanttDisplaySettings, GanttDisplayOptions } from '../dialogs/GanttDisplaySettings'
import { generateTimelineMonths, calculatePosition, calculateWidth, groupConsultantsByAvailability, calculateConsultantAvailability } from '@/lib/timeline-utils'

interface GanttViewProps {
  projects: Project[]
  consultants: Consultant[]
  onUpdateProject: (project: Project) => void
  onReorderProjects?: (reorderedProjects: Project[]) => void
}

export function GanttView({ projects, consultants, onUpdateProject, onReorderProjects }: GanttViewProps) {
  const [timelineStart, setTimelineStart] = useState(() => startOfMonth(addMonths(new Date(), -2)))
  const [monthsToShow] = useState(6)
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null)
  const [softTagDragOverProjectId, setSoftTagDragOverProjectId] = useState<string | null>(null)
  const [consultantSelectorDialog, setConsultantSelectorDialog] = useState<{
    projectId: string
    isSoftTag?: boolean
  } | null>(null)
  const [assignmentDialog, setAssignmentDialog] = useState<{
    projectId: string
    consultantId: string
    isSoftTag?: boolean
  } | null>(null)
  
  const [displayOptions, setDisplayOptions] = useKV<GanttDisplayOptions>('gantt-display-options', {
    showConsultantPercentages: true,
    showConsultantsInBars: true,
    showPlannedProjects: true,
    showClosedProjects: false,
    showSoftTags: true,
  })

  const MONTH_WIDTH = 180
  const PIXELS_PER_DAY = MONTH_WIDTH / 30

  const activeProjects = useMemo(() => {
    return projects.filter(p => {
      if (p.status === 'active') return true
      if (p.status === 'planlagt' && displayOptions?.showPlannedProjects) return true
      if (p.status === 'closed' && displayOptions?.showClosedProjects) return true
      return false
    })
  }, [projects, displayOptions])

  const months = useMemo(
    () => generateTimelineMonths(timelineStart, monthsToShow),
    [timelineStart, monthsToShow]
  )

  const weekPositions = useMemo(() => {
    const weeks: number[] = []
    const timelineEnd = endOfMonth(addMonths(timelineStart, monthsToShow - 1))
    
    let currentWeek = startOfWeek(timelineStart, { weekStartsOn: 1 })
    
    while (isBefore(currentWeek, timelineEnd) || currentWeek.getTime() === timelineEnd.getTime()) {
      const position = calculatePosition(currentWeek, timelineStart, PIXELS_PER_DAY)
      weeks.push(position)
      currentWeek = addWeeks(currentWeek, 1)
    }
    
    return weeks
  }, [timelineStart, monthsToShow])

  const consultantGroups = useMemo(
    () => groupConsultantsByAvailability(consultants, activeProjects),
    [consultants, activeProjects]
  )

  const todayPosition = useMemo(() => {
    const today = new Date()
    const timelineEnd = endOfMonth(addMonths(timelineStart, monthsToShow - 1))
    
    if (isBefore(today, timelineStart) || isAfter(today, timelineEnd)) {
      return null
    }
    
    return calculatePosition(today, timelineStart, PIXELS_PER_DAY)
  }, [timelineStart, monthsToShow, PIXELS_PER_DAY])

  const handlePrevious = () => {
    setTimelineStart((prev) => addMonths(prev, -1))
  }

  const handleNext = () => {
    setTimelineStart((prev) => addMonths(prev, 1))
  }

  const handleConsultantDrop = (projectId: string, consultantId: string, isSoftTag: boolean = false) => {
    if (isSoftTag) {
      const project = activeProjects.find((p) => p.id === projectId)
      if (!project || project.status !== 'planlagt') return

      const updatedSoftTags = [...(project.softTags || [])]
      if (!updatedSoftTags.some(st => st.consultantId === consultantId)) {
        updatedSoftTags.push({ consultantId })
      }

      onUpdateProject({
        ...project,
        softTags: updatedSoftTags,
      })
    } else {
      setAssignmentDialog({
        projectId,
        consultantId,
      })
    }
  }

  const handleAddConsultantClick = (projectId: string, isSoftTag: boolean = false) => {
    setConsultantSelectorDialog({
      projectId,
      isSoftTag,
    })
  }

  const handleConsultantSelected = (consultantId: string) => {
    if (!consultantSelectorDialog) return
    
    if (consultantSelectorDialog.isSoftTag) {
      const project = activeProjects.find((p) => p.id === consultantSelectorDialog.projectId)
      if (!project || project.status !== 'planlagt') return

      const updatedSoftTags = [...(project.softTags || [])]
      if (!updatedSoftTags.some(st => st.consultantId === consultantId)) {
        updatedSoftTags.push({ consultantId })
      }

      onUpdateProject({
        ...project,
        softTags: updatedSoftTags,
      })
      setConsultantSelectorDialog(null)
    } else {
      setAssignmentDialog({
        projectId: consultantSelectorDialog.projectId,
        consultantId,
      })
      setConsultantSelectorDialog(null)
    }
  }

  const handleAssignmentConfirm = (percentage: number) => {
    if (!assignmentDialog) return

    const project = projects.find((p) => p.id === assignmentDialog.projectId)
    if (!project) return

    const existingAssignmentIndex = project.assignments.findIndex(
      (a) => a.consultantId === assignmentDialog.consultantId
    )

    const newAssignments = [...project.assignments]
    if (existingAssignmentIndex >= 0) {
      newAssignments[existingAssignmentIndex] = {
        consultantId: assignmentDialog.consultantId,
        percentage,
      }
    } else {
      newAssignments.push({
        consultantId: assignmentDialog.consultantId,
        percentage,
      })
    }

    onUpdateProject({
      ...project,
      assignments: newAssignments,
    })

    setAssignmentDialog(null)
  }

  const handleProjectReorder = (draggedProjectId: string, targetIndex: number) => {
    if (!onReorderProjects) return
    
    const draggedIndex = activeProjects.findIndex(p => p.id === draggedProjectId)
    if (draggedIndex === -1 || draggedIndex === targetIndex) return

    const reordered = [...activeProjects]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, removed)

    const closedProjects = projects.filter(p => p.status === 'closed')
    onReorderProjects([...reordered, ...closedProjects])
  }

  const assignmentConsultant = assignmentDialog
    ? consultants.find((c) => c.id === assignmentDialog.consultantId)
    : null
  const assignmentProject = assignmentDialog
    ? activeProjects.find((p) => p.id === assignmentDialog.projectId)
    : null
  
  const getDefaultPercentage = (consultant: Consultant | null) => {
    if (!consultant) return 100
    return consultant.level === 'Principal' ? 30 : 100
  }

  const ganttHeight = Math.max(600, activeProjects.length * 68 + 100)

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-6">
        <div className="w-[299px] flex-shrink-0 flex flex-col gap-4">
          <div className="h-10"></div>
          
          <Card className="p-4 flex flex-col" style={{ height: `${ganttHeight}px` }}>
            <h3 className="font-semibold text-base mb-3">Konsulenter</h3>
            <ScrollArea className="flex-1" style={{ height: `${ganttHeight - 60}px` }}>
              <div className="space-y-3 pr-3">
                {consultantGroups.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {group.type === 'free' && groupIndex === 0 && (
                      <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                        Ledig nå
                      </div>
                    )}
                    {group.type === 'busy' && group.label && (
                      <>
                        {groupIndex > 0 && <Separator className="my-3" />}
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                          Ledig i {group.label}
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {group.consultants.map((consultant, consultantIndex) => {
                        const availablePercentage = calculateConsultantAvailability(consultant, projects)
                        const isLastInGroup = consultantIndex === group.consultants.length - 1
                        const isLastGroup = groupIndex === consultantGroups.length - 1
                        const isLastConsultant = isLastInGroup && isLastGroup
                        
                        return (
                          <div key={consultant.id}>
                            <DraggableConsultant
                              consultant={consultant}
                              availablePercentage={availablePercentage}
                              projects={projects}
                            />
                            {isLastConsultant && (
                              <div className="col-span-2 mt-3 pt-2 border-t-2 border-primary/20 text-center">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Slutt på listen
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <CaretLeft />
            </Button>
            <span className="font-medium">Tidslinje visning</span>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <CaretRight />
            </Button>
            <div className="ml-auto">
              <GanttDisplaySettings 
                options={displayOptions || {
                  showConsultantPercentages: true,
                  showConsultantsInBars: true,
                  showPlannedProjects: true,
                  showClosedProjects: false,
                  showSoftTags: true,
                }}
                onOptionsChange={(newOptions) => setDisplayOptions(newOptions)}
              />
            </div>
          </div>

          <Card className="flex-1 overflow-hidden" style={{ height: `${ganttHeight}px` }}>
            <ScrollArea className="h-full">
              <div className="min-w-max">
                <TimelineRuler months={months} monthWidth={MONTH_WIDTH} />
                
                <div className="relative p-4 pt-16" style={{ minHeight: `${ganttHeight - 60}px` }}>
                  {months.map((month, index) => (
                    <div
                      key={month.toISOString()}
                      className="absolute top-0 bottom-0 border-r border-border/10 z-0"
                      style={{
                        left: `${index * MONTH_WIDTH}px`,
                        width: `${MONTH_WIDTH}px`,
                      }}
                    />
                  ))}

                  {weekPositions.map((position, index) => (
                    <div
                      key={`week-${index}`}
                      className="absolute top-0 bottom-0 border-r border-border/30 z-0"
                      style={{
                        left: `${position}px`,
                      }}
                    />
                  ))}

                  {todayPosition !== null && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none z-20"
                      style={{
                        left: `${todayPosition}px`,
                      }}
                    >
                      <div className="relative h-full">
                        <div className="absolute inset-0 border-r-2 border-accent" />
                        <div className="absolute top-1 left-0 transform -translate-x-1/2">
                          <div className="bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap shadow-md">
                            I dag
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeProjects.map((project, index) => {
                    const left = calculatePosition(
                      new Date(project.startDate),
                      timelineStart,
                      PIXELS_PER_DAY
                    )
                    const width = calculateWidth(
                      new Date(project.startDate),
                      new Date(project.endDate),
                      PIXELS_PER_DAY
                    )
                    const top = index * 68 + 16

                    return (
                      <ProjectBar
                        key={project.id}
                        project={project}
                        consultants={consultants}
                        allProjects={projects}
                        left={left}
                        width={width}
                        top={top}
                        rowIndex={index}
                        pixelsPerDay={PIXELS_PER_DAY}
                        timelineStart={timelineStart}
                        onUpdateProject={onUpdateProject}
                        onConsultantDrop={handleConsultantDrop}
                        onAddConsultantClick={handleAddConsultantClick}
                        isDragOver={dragOverProjectId === project.id}
                        onDragEnter={() => setDragOverProjectId(project.id)}
                        onDragLeave={() => setDragOverProjectId(null)}
                        isReorderDragOver={dragOverRowIndex === index}
                        onReorderDragEnter={() => setDragOverRowIndex(index)}
                        onReorderDragLeave={() => setDragOverRowIndex(null)}
                        onReorder={handleProjectReorder}
                        canReorder={!!onReorderProjects}
                        showConsultantPercentages={displayOptions?.showConsultantPercentages ?? true}
                        showConsultantsInBars={displayOptions?.showConsultantsInBars ?? true}
                        showSoftTags={displayOptions?.showSoftTags ?? true}
                      />
                    )
                  })}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      {consultantSelectorDialog && (
        <ConsultantSelectorDialog
          isOpen={true}
          projectId={consultantSelectorDialog.projectId}
          projectName={
            activeProjects.find((p) => p.id === consultantSelectorDialog.projectId)?.name || ''
          }
          consultants={consultants}
          projects={projects}
          onSelectConsultant={handleConsultantSelected}
          onClose={() => setConsultantSelectorDialog(null)}
        />
      )}

      {assignmentDialog && assignmentConsultant && assignmentProject && (
        <AssignmentDialog
          isOpen={true}
          consultantId={assignmentDialog.consultantId}
          consultantName={assignmentConsultant.name}
          projectId={assignmentDialog.projectId}
          projectName={assignmentProject.name}
          currentPercentage={
            assignmentProject.assignments.find(
              (a) => a.consultantId === assignmentDialog.consultantId
            )?.percentage || getDefaultPercentage(assignmentConsultant)
          }
          projects={projects}
          onConfirm={handleAssignmentConfirm}
          onClose={() => setAssignmentDialog(null)}
        />
      )}
    </div>
  )
}
