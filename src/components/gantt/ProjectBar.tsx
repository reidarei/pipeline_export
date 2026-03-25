import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { X, DotsSixVertical, UserPlus, Warning } from '@phosphor-icons/react'
import { addDays, differenceInDays, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { parseDateSafely, calculateConsultantAllocation } from '@/lib/timeline-utils'
import { Project, Consultant } from '@/lib/types'
import { toast } from 'sonner'
import { EditPercentageDialog } from '@/components/dialogs/EditPercentageDialog'

interface ProjectBarProps {
  project: Project
  consultants: Consultant[]
  allProjects: Project[]
  left: number
  width: number
  top: number
  rowIndex: number
  pixelsPerDay: number
  timelineStart: Date
  onUpdateProject: (project: Project, silent?: boolean) => void
  onConsultantDrop: (projectId: string, consultantId: string, isSoftTag?: boolean) => void
  onAddConsultantClick: (projectId: string, isSoftTag?: boolean) => void
  isDragOver: boolean
  onDragEnter: () => void
  onDragLeave: () => void
  isReorderDragOver?: boolean
  onReorderDragEnter?: () => void
  onReorderDragLeave?: () => void
  onReorder?: (projectId: string, targetIndex: number) => void
  canReorder?: boolean
  isSoftTagDragOver?: boolean
  onSoftTagDragEnter?: () => void
  onSoftTagDragLeave?: () => void
  showConsultantPercentages?: boolean
  showConsultantsInBars?: boolean
  showSoftTags?: boolean
}

export function ProjectBar({
  project,
  consultants,
  allProjects,
  left,
  width,
  top,
  rowIndex,
  pixelsPerDay,
  timelineStart,
  onUpdateProject,
  onConsultantDrop,
  onAddConsultantClick,
  isDragOver,
  onDragEnter,
  onDragLeave,
  isReorderDragOver = false,
  onReorderDragEnter,
  onReorderDragLeave,
  onReorder,
  canReorder = false,
  showConsultantPercentages = true,
  showConsultantsInBars = true,
  showSoftTags = true,
}: ProjectBarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [resizeMode, setResizeMode] = useState<'start' | 'end' | null>(null)
  const [isReorderDragging, setIsReorderDragging] = useState(false)
  const [editingConsultant, setEditingConsultant] = useState<{ consultant: Consultant; percentage: number } | null>(null)
  const dragStartX = useRef(0)
  const lastAppliedDays = useRef(0)
  const originalStartDate = useRef<Date>(new Date())
  const originalEndDate = useRef<Date>(new Date())

  const assignedConsultants = consultants.filter((c) =>
    project.assignments.some((a) => a.consultantId === c.id)
  )

  const softTaggedConsultants = consultants.filter((c) =>
    (project.softTags || []).some((st) => st.consultantId === c.id)
  )

  const overstaffedConsultants = assignedConsultants.filter((consultant) => {
    const totalAllocation = calculateConsultantAllocation(consultant, allProjects)
    return totalAllocation > 100
  })

  const hasOverstaffing = overstaffedConsultants.length > 0
  const isPlanned = project.status === 'planlagt'

  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'start' | 'end') => {
    e.preventDefault()
    e.stopPropagation()
    
    dragStartX.current = e.clientX
    lastAppliedDays.current = 0
    originalStartDate.current = parseDateSafely(project.startDate)
    originalEndDate.current = parseDateSafely(project.endDate)

    let pendingUpdate: Partial<Project> | null = null

    if (mode === 'move') {
      setIsDragging(true)
    } else {
      setResizeMode(mode)
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      const deltaX = moveEvent.clientX - dragStartX.current
      const deltaDays = Math.round(deltaX / pixelsPerDay)

      if (deltaDays === lastAppliedDays.current) return
      lastAppliedDays.current = deltaDays

      if (mode === 'move') {
        const newStartDate = addDays(originalStartDate.current, deltaDays)
        const newEndDate = addDays(originalEndDate.current, deltaDays)
        pendingUpdate = {
          startDate: format(newStartDate, 'yyyy-MM-dd'),
          endDate: format(newEndDate, 'yyyy-MM-dd'),
        }
        onUpdateProject({
          ...project,
          ...pendingUpdate,
        }, true)
      } else if (mode === 'start') {
        const newStartDate = addDays(originalStartDate.current, deltaDays)
        const daysBetween = differenceInDays(originalEndDate.current, newStartDate)
        if (daysBetween >= 1) {
          pendingUpdate = {
            startDate: format(newStartDate, 'yyyy-MM-dd'),
          }
          onUpdateProject({
            ...project,
            ...pendingUpdate,
          }, true)
        }
      } else if (mode === 'end') {
        const newEndDate = addDays(originalEndDate.current, deltaDays)
        const daysBetween = differenceInDays(newEndDate, originalStartDate.current)
        if (daysBetween >= 1) {
          pendingUpdate = {
            endDate: format(newEndDate, 'yyyy-MM-dd'),
          }
          onUpdateProject({
            ...project,
            ...pendingUpdate,
          }, true)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setResizeMode(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      if (pendingUpdate) {
        onUpdateProject({
          ...project,
          ...pendingUpdate,
        }, false)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleReorderDragStart = (e: React.DragEvent) => {
    if (!canReorder) return
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('projectid', project.id)
    setIsReorderDragging(true)
  }

  const handleReorderDragEnd = () => {
    setIsReorderDragging(false)
    if (onReorderDragLeave) {
      onReorderDragLeave()
    }
  }

  const handleUnifiedDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const hasConsultant = e.dataTransfer.types.includes('consultantid')
    const hasProject = e.dataTransfer.types.includes('projectid')
    
    if (hasConsultant) {
      onDragEnter()
    } else if (hasProject && onReorderDragEnter) {
      onReorderDragEnter()
    }
  }

  const handleUnifiedDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const hasConsultant = e.dataTransfer.types.includes('consultantid')
    const hasProject = e.dataTransfer.types.includes('projectid')
    
    if (hasConsultant) {
      e.dataTransfer.dropEffect = 'copy'
    } else if (hasProject) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleUnifiedDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (
      x < rect.left ||
      x >= rect.right ||
      y < rect.top ||
      y >= rect.bottom
    ) {
      const hasConsultant = e.dataTransfer.types.includes('consultantid')
      const hasProject = e.dataTransfer.types.includes('projectid')
      
      if (hasConsultant) {
        onDragLeave()
      } else if (hasProject && onReorderDragLeave) {
        onReorderDragLeave()
      }
    }
  }

  const handleUnifiedDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const consultantId = e.dataTransfer.getData('consultantid')
    const sourceProjectId = e.dataTransfer.getData('sourceprojectid')
    const draggedProjectId = e.dataTransfer.getData('projectid')
    const percentageStr = e.dataTransfer.getData('percentage')
    
    if (consultantId && sourceProjectId && sourceProjectId !== project.id) {
      const sourceProject = allProjects.find(p => p.id === sourceProjectId)
      if (sourceProject) {
        onUpdateProject({
          ...sourceProject,
          assignments: sourceProject.assignments.filter(a => a.consultantId !== consultantId)
        }, true)
      }
      
      const percentage = percentageStr ? parseInt(percentageStr, 10) : 100
      const existingAssignment = project.assignments.find(a => a.consultantId === consultantId)
      
      if (existingAssignment) {
        toast.success('Konsulent allerede tildelt dette prosjektet')
      } else {
        onUpdateProject({
          ...project,
          assignments: [...project.assignments, { consultantId, percentage }]
        })
        const consultant = consultants.find(c => c.id === consultantId)
        if (consultant) {
          toast.success(`${consultant.name} flyttet til ${project.name}`)
        }
      }
      onDragLeave()
    } else if (consultantId && !sourceProjectId) {
      onConsultantDrop(project.id, consultantId)
      onDragLeave()
    } else if (draggedProjectId && draggedProjectId !== project.id && onReorder) {
      onReorder(draggedProjectId, rowIndex)
      if (onReorderDragLeave) {
        onReorderDragLeave()
      }
    }
  }

  const handleRemoveConsultant = (e: React.MouseEvent, consultantId: string) => {
    e.stopPropagation()
    const consultant = consultants.find(c => c.id === consultantId)
    onUpdateProject({
      ...project,
      assignments: project.assignments.filter(a => a.consultantId !== consultantId)
    })
    if (consultant) {
      toast.success(`Removed ${consultant.name} from ${project.name}`)
    }
  }

  const handleRemoveSoftTag = (e: React.MouseEvent, consultantId: string) => {
    e.stopPropagation()
    const consultant = consultants.find(c => c.id === consultantId)
    onUpdateProject({
      ...project,
      softTags: (project.softTags || []).filter(st => st.consultantId !== consultantId)
    })
    if (consultant) {
      toast.success(`Fjernet soft-tag for ${consultant.name} fra ${project.name}`)
    }
  }

  const handlePercentageClick = (e: React.MouseEvent, consultant: Consultant, percentage: number) => {
    e.stopPropagation()
    setEditingConsultant({ consultant, percentage })
  }

  const handleSavePercentage = (newPercentage: number) => {
    if (!editingConsultant) return
    
    onUpdateProject({
      ...project,
      assignments: project.assignments.map(a => 
        a.consultantId === editingConsultant.consultant.id 
          ? { ...a, percentage: newPercentage }
          : a
      )
    })
    toast.success(`Updated ${editingConsultant.consultant.name}'s allocation to ${newPercentage}%`)
  }

  return (
    <div
      className={cn(
        'absolute h-12 rounded-lg border-2 bg-background shadow-sm flex items-center gap-2 group transition-all',
        isPlanned && 'border-dashed',
        isDragging && 'cursor-grabbing z-10 border-primary shadow-lg',
        resizeMode && 'z-10 border-primary',
        isReorderDragging && 'opacity-50 z-50',
        !isDragging && !resizeMode && 'hover:border-primary/50',
        isDragOver && 'border-primary bg-primary/10 scale-105',
        isReorderDragOver && canReorder && 'ring-2 ring-primary ring-offset-2'
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
      }}
      draggable={canReorder}
      onDragStart={handleReorderDragStart}
      onDragEnd={handleReorderDragEnd}
      onDragEnter={handleUnifiedDragEnter}
      onDragOver={handleUnifiedDragOver}
      onDragLeave={handleUnifiedDragLeave}
      onDrop={handleUnifiedDrop}
    >
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-lg hover:bg-primary/30 transition-colors z-30',
          resizeMode === 'start' && 'bg-primary/60'
        )}
        data-resize-handle
        onMouseDown={(e) => {
          handleMouseDown(e, 'start')
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div 
        className={cn(
          'absolute left-2 flex items-center h-full px-1.5 transition-colors z-20 cursor-grab active:cursor-grabbing hover:bg-primary/10',
          isDragging && 'bg-primary/20 cursor-grabbing'
        )}
        onMouseDown={(e) => {
          handleMouseDown(e, 'move')
        }}
        onDragStart={(e) => e.stopPropagation()}
        data-move-handle
      >
        <DotsSixVertical 
          size={16} 
          weight="bold"
          className={cn(
            'text-muted-foreground/50 group-hover:text-primary/60 transition-colors',
            isDragging && 'text-primary'
          )}
        />
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2 pr-3 pl-10" data-ignore-drag>
        <span className="font-medium text-sm truncate">{project.name}</span>
        
        {hasOverstaffing && (
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 border border-destructive/30"
            title={`Overstaffed: ${overstaffedConsultants.map(c => c.name).join(', ')}`}
          >
            <Warning className="h-4 w-4 text-destructive" weight="fill" />
            <span className="text-xs font-medium text-destructive">Overstaff</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          {showConsultantsInBars && assignedConsultants.map((consultant) => {
            const assignment = project.assignments.find(a => a.consultantId === consultant.id)
            const isOverstaffed = overstaffedConsultants.some(c => c.id === consultant.id)
            const totalAllocation = calculateConsultantAllocation(consultant, allProjects)
            
            return (
              <div 
                key={consultant.id} 
                className="relative group/consultant cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => {
                  e.stopPropagation()
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('consultantid', consultant.id)
                  e.dataTransfer.setData('sourceprojectid', project.id)
                  e.dataTransfer.setData('percentage', String(assignment?.percentage || 0))
                }}
              >
                <Avatar 
                  className={cn(
                    "h-9 w-9 border-2 transition-all",
                    isOverstaffed 
                      ? "border-destructive/50 hover:border-destructive ring-2 ring-destructive/20 hover:scale-105" 
                      : "border-card hover:border-primary hover:scale-105"
                  )}
                  title={isOverstaffed ? `${consultant.name} is overallocated (${totalAllocation}%)` : consultant.name}
                >
                  <AvatarImage src={consultant.avatarUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {consultant.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {showConsultantPercentages && (
                  <button
                    className={cn(
                      "absolute -bottom-1 -right-1 text-[11px] font-mono font-bold rounded-full h-5 w-5 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all z-20",
                      isOverstaffed 
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/80 ring-2 ring-destructive/30" 
                        : "bg-accent text-accent-foreground hover:bg-accent/80"
                    )}
                    onClick={(e) => handlePercentageClick(e, consultant, assignment?.percentage || 0)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.stopPropagation()}
                    data-ignore-drag
                    title={isOverstaffed ? `Total: ${totalAllocation}% - Click to edit` : "Click to edit allocation percentage"}
                  >
                    {assignment?.percentage}
                  </button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover/consultant:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full z-30"
                  onClick={(e) => handleRemoveConsultant(e, consultant.id)}
                  onDragStart={(e) => e.stopPropagation()}
                  data-ignore-drag
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
          
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-7 w-7 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all shrink-0 border border-primary/30 hover:border-primary text-primary cursor-pointer z-30",
              !showConsultantsInBars && "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onAddConsultantClick(project.id, false)
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            data-ignore-drag
            title="Legg til tildelt konsulent"
          >
            <UserPlus className="h-4 w-4" weight="bold" />
          </Button>
          
          {isPlanned && showSoftTags && (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-7 w-7 rounded-full bg-muted/50 hover:bg-primary/30 hover:scale-110 active:scale-95 transition-all shrink-0 border border-dashed border-muted-foreground/50 hover:border-primary text-muted-foreground hover:text-primary cursor-pointer z-30",
                !showConsultantsInBars && "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onAddConsultantClick(project.id, true)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              data-ignore-drag
              title="Legg til soft-tagget konsulent"
            >
              <UserPlus className="h-4 w-4" weight="bold" />
            </Button>
          )}
        </div>
      </div>

      {isPlanned && showSoftTags && softTaggedConsultants.length > 0 && (
        <div 
          className="absolute flex items-center gap-1 top-1/2 -translate-y-1/2 z-40"
          style={{
            left: `${width + 10}px`,
          }}
          data-ignore-drag
        >
          {softTaggedConsultants.map((consultant) => (
            <div 
              key={consultant.id} 
              className="relative group/softtag"
            >
              <Avatar 
                className="h-9 w-9 border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors"
                title={`Soft-tagget: ${consultant.name}`}
              >
                <AvatarImage src={consultant.avatarUrl} />
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {consultant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover/softtag:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full z-30"
                onClick={(e) => handleRemoveSoftTag(e, consultant.id)}
                data-ignore-drag
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-lg hover:bg-primary/30 transition-colors z-20',
          resizeMode === 'end' && 'bg-primary/60'
        )}
        data-resize-handle
        onMouseDown={(e) => {
          handleMouseDown(e, 'end')
        }}
      >
        <div className="absolute inset-y-0 right-1/2 w-0.5 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <EditPercentageDialog
        isOpen={editingConsultant !== null}
        consultant={editingConsultant?.consultant || null}
        projectName={project.name}
        currentPercentage={editingConsultant?.percentage || 0}
        onSave={handleSavePercentage}
        onClose={() => setEditingConsultant(null)}
      />
    </div>
  )
}
