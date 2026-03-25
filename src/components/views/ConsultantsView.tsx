import { useState, useMemo } from 'react'
import { Plus, Trash, Check, X, PencilSimple, Warning, CaretUp, CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Consultant, Project, ConsultantLevel } from '@/lib/types'
import { ConsultantDialog } from '../dialogs/ConsultantDialog'
import { validateAllocation, calculateConsultantAllocation, isConsultantOnLeave } from '@/lib/timeline-utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type SortField = 'name' | 'level'
type SortDirection = 'asc' | 'desc' | null

interface ConsultantsViewProps {
  consultants: Consultant[]
  projects: Project[]
  onAddConsultant: (consultant: Omit<Consultant, 'id'>) => void
  onUpdateConsultant: (consultant: Consultant) => void
  onDeleteConsultant: (consultantId: string) => void
  onUpdateProject: (project: Project) => void
}

interface EditingCell {
  consultantId: string
  field: 'name' | 'level' | 'avatarUrl' | 'leave'
  value: string
}

interface EditingLeave {
  consultantId: string
  startDate: string
  endDate: string
}

interface EditingAssignment {
  consultantId: string
  projectId: string
  percentage: number
}

export function ConsultantsView({
  consultants,
  projects,
  onAddConsultant,
  onUpdateConsultant,
  onDeleteConsultant,
  onUpdateProject,
}: ConsultantsViewProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<EditingAssignment | null>(null)
  const [editingLeave, setEditingLeave] = useState<EditingLeave | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedConsultants = useMemo(() => {
    if (!sortField || !sortDirection) {
      return consultants
    }
    
    return [...consultants].sort((a, b) => {
      let aValue: string
      let bValue: string
      
      if (sortField === 'level') {
        const levelOrder: Record<ConsultantLevel, number> = {
          'Junior': 1,
          'Medior': 2,
          'Senior': 3,
          'Principal': 4
        }
        const aOrder = levelOrder[a.level]
        const bOrder = levelOrder[b.level]
        
        if (sortDirection === 'asc') {
          return aOrder - bOrder
        } else {
          return bOrder - aOrder
        }
      } else {
        aValue = a[sortField].toLowerCase()
        bValue = b[sortField].toLowerCase()
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      }
    })
  }, [consultants, sortField, sortDirection])

  const getConsultantProjects = (consultantId: string) => {
    return projects.filter((project) =>
      (project.status === 'active' || project.status === 'planlagt') &&
      project.assignments.some((a) => a.consultantId === consultantId)
    )
  }

  const getConsultantSoftTaggedProjects = (consultantId: string) => {
    return projects.filter((project) =>
      project.status === 'planlagt' &&
      (project.softTags || []).some((st) => st.consultantId === consultantId)
    )
  }

  const startEdit = (consultantId: string, field: 'name' | 'level' | 'avatarUrl', currentValue: string) => {
    setEditingCell({ consultantId, field, value: currentValue || '' })
  }

  const saveEdit = () => {
    if (editingCell) {
      const consultant = consultants.find(c => c.id === editingCell.consultantId)
      if (consultant) {
        onUpdateConsultant({
          ...consultant,
          [editingCell.field]: editingCell.field === 'avatarUrl' && !editingCell.value 
            ? undefined 
            : editingCell.value
        })
      }
      setEditingCell(null)
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
  }

  const startEditAssignment = (consultantId: string, projectId: string, currentPercentage: number) => {
    setEditingAssignment({ consultantId, projectId, percentage: currentPercentage })
  }

  const saveEditAssignment = () => {
    if (editingAssignment) {
      const project = projects.find(p => p.id === editingAssignment.projectId)
      if (project) {
        let snappedPercentage = editingAssignment.percentage
        if (snappedPercentage < 10) {
          snappedPercentage = 10
        } else if (snappedPercentage > 100) {
          snappedPercentage = 100
        } else {
          snappedPercentage = Math.round(snappedPercentage / 10) * 10
        }
        
        const validation = validateAllocation(
          editingAssignment.consultantId, 
          projects, 
          editingAssignment.projectId, 
          snappedPercentage
        )
        
        if (!validation.isValid) {
          const consultant = consultants.find(c => c.id === editingAssignment.consultantId)
          toast.error(`Cannot allocate ${snappedPercentage}% to ${consultant?.name}. This would exceed their capacity by ${validation.exceeded}% (total: ${validation.totalAllocation}%).`)
          return
        }
        
        const updatedAssignments = project.assignments.map(a =>
          a.consultantId === editingAssignment.consultantId
            ? { ...a, percentage: snappedPercentage }
            : a
        )
        onUpdateProject({
          ...project,
          assignments: updatedAssignments
        })
        toast.success('Assignment updated successfully')
      }
      setEditingAssignment(null)
    }
  }

  const cancelEditAssignment = () => {
    setEditingAssignment(null)
  }

  const startEditLeave = (consultant: Consultant) => {
    setEditingLeave({
      consultantId: consultant.id,
      startDate: consultant.leave?.startDate || '',
      endDate: consultant.leave?.endDate || ''
    })
  }

  const saveEditLeave = () => {
    if (editingLeave) {
      const consultant = consultants.find(c => c.id === editingLeave.consultantId)
      if (consultant) {
        const leave = editingLeave.startDate && editingLeave.endDate
          ? { startDate: editingLeave.startDate, endDate: editingLeave.endDate }
          : undefined
        
        onUpdateConsultant({
          ...consultant,
          leave
        })
        toast.success('Leave information updated successfully')
      }
      setEditingLeave(null)
    }
  }

  const cancelEditLeave = () => {
    setEditingLeave(null)
  }

  const handleRemoveLeave = (consultantId: string) => {
    const consultant = consultants.find(c => c.id === consultantId)
    if (consultant) {
      onUpdateConsultant({
        ...consultant,
        leave: undefined
      })
      toast.success('Leave removed successfully')
    }
  }

  const handleRemoveAssignment = (consultantId: string, projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      onUpdateProject({
        ...project,
        assignments: project.assignments.filter(a => a.consultantId !== consultantId)
      })
    }
  }

  const renderNameCell = (consultant: Consultant) => {
    const isEditing = editingCell?.consultantId === consultant.id && editingCell?.field === 'name'

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
            <AvatarImage src={consultant.avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {consultant.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            className="h-8 flex-1"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={saveEdit}>
            <Check className="text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={cancelEdit}>
            <X className="text-destructive" />
          </Button>
        </div>
      )
    }

    return (
      <div 
        className="group flex items-center gap-3 cursor-pointer hover:bg-accent/50 px-2 py-1 rounded transition-colors"
        onClick={() => startEdit(consultant.id, 'name', consultant.name)}
      >
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={consultant.avatarUrl} />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {consultant.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{consultant.name}</span>
            <PencilSimple className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span 
            className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              startEdit(consultant.id, 'avatarUrl', consultant.avatarUrl || '')
            }}
          >
            {consultant.avatarUrl ? 'Click to edit avatar URL' : 'Click to add avatar URL'}
          </span>
        </div>
      </div>
    )
  }

  const renderAvatarEditCell = (consultant: Consultant) => {
    const isEditing = editingCell?.consultantId === consultant.id && editingCell?.field === 'avatarUrl'

    if (!isEditing) return null

    return (
      <div className="flex items-center gap-2 mt-2">
        <Input
          value={editingCell.value}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
          placeholder="https://example.com/avatar.jpg"
          className="h-8"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}>
          <Check className="text-green-600" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
          <X className="text-destructive" />
        </Button>
      </div>
    )
  }

  const renderLevelCell = (consultant: Consultant) => {
    const isEditing = editingCell?.consultantId === consultant.id && editingCell?.field === 'level'

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Select 
            value={editingCell.value} 
            onValueChange={(value) => {
              setEditingCell({ ...editingCell, value })
              setTimeout(() => {
                const consultant = consultants.find(c => c.id === editingCell.consultantId)
                if (consultant) {
                  onUpdateConsultant({
                    ...consultant,
                    level: value as ConsultantLevel
                  })
                }
                setEditingCell(null)
              }, 100)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Junior">Junior</SelectItem>
              <SelectItem value="Medior">Medior</SelectItem>
              <SelectItem value="Senior">Senior</SelectItem>
              <SelectItem value="Principal">Principal</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
            <X className="text-destructive" />
          </Button>
        </div>
      )
    }

    return (
      <div
        className="inline-block group cursor-pointer hover:opacity-70 transition-opacity"
        onClick={() => startEdit(consultant.id, 'level', consultant.level)}
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          {consultant.level}
          <PencilSimple className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Badge>
      </div>
    )
  }

  const renderLeaveCell = (consultant: Consultant) => {
    const isEditing = editingLeave?.consultantId === consultant.id

    if (isEditing) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={editingLeave.startDate}
              onChange={(e) => setEditingLeave({ ...editingLeave, startDate: e.target.value })}
              className="h-8 text-xs"
              placeholder="Start date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={editingLeave.endDate}
              onChange={(e) => setEditingLeave({ ...editingLeave, endDate: e.target.value })}
              className="h-8 text-xs"
              placeholder="End date"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={saveEditLeave} className="h-7">
              <Check className="mr-1 h-3 w-3" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEditLeave} className="h-7">
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    if (consultant.leave) {
      return (
        <div className="group relative">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-accent transition-colors bg-accent/10 text-accent border-accent/30 pr-8"
            onClick={() => startEditLeave(consultant)}
          >
            {format(new Date(consultant.leave.startDate), 'MMM d')} - {format(new Date(consultant.leave.endDate), 'MMM d, yyyy')}
            <PencilSimple className="absolute right-7 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveLeave(consultant.id)
              }}
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          </Badge>
        </div>
      )
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => startEditLeave(consultant)}
        className="h-7 text-xs"
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Leave
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Konsulenter</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2" />
          Legg til konsulent
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Konsulent
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 select-none"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center gap-2">
                  Nivå
                  {sortField === 'level' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Permisjon</TableHead>
              <TableHead>Aktive og planlagte prosjekter</TableHead>
              <TableHead className="w-[100px]">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedConsultants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Ingen konsulenter ennå. Klikk "Legg til konsulent" for å komme i gang.
                </TableCell>
              </TableRow>
            ) : (
              sortedConsultants.map((consultant) => {
                const consultantProjects = getConsultantProjects(consultant.id)
                const totalAllocation = calculateConsultantAllocation(consultant, projects)
                const isOverstaffed = totalAllocation > 100
                const onLeave = isConsultantOnLeave(consultant)
                return (
                  <TableRow key={consultant.id} className={cn(
                    isOverstaffed && "bg-destructive/5 border-l-4 border-l-destructive",
                    onLeave && "bg-muted/50 border-l-4 border-l-accent"
                  )}>
                    <TableCell>
                      <div>
                        {renderNameCell(consultant)}
                        {renderAvatarEditCell(consultant)}
                        {isOverstaffed && (
                          <div className="flex items-center gap-2 mt-2 text-destructive text-xs font-medium">
                            <Warning className="w-4 h-4 animate-pulse" weight="fill" />
                            <span>Overstaffed by {totalAllocation - 100}% (Total: {totalAllocation}%)</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderLevelCell(consultant)}
                    </TableCell>
                    <TableCell>
                      {renderLeaveCell(consultant)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {consultantProjects.length === 0 && getConsultantSoftTaggedProjects(consultant.id).length === 0 ? (
                          <span className="text-sm text-muted-foreground">Ingen prosjekter</span>
                        ) : (
                          <>
                            {consultantProjects.map((project) => {
                              const assignment = project.assignments.find(
                                (a) => a.consultantId === consultant.id
                              )
                              const isEditing = editingAssignment?.consultantId === consultant.id && 
                                              editingAssignment?.projectId === project.id
                              
                              if (isEditing) {
                                return (
                                  <div key={project.id} className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-1.5">
                                    <span className="text-sm font-medium">{project.name}</span>
                                    <Input
                                      type="number"
                                      min="10"
                                      max="100"
                                      step="10"
                                      value={editingAssignment.percentage}
                                      onChange={(e) => setEditingAssignment({ 
                                        ...editingAssignment, 
                                        percentage: parseInt(e.target.value) || 10
                                      })}
                                      onBlur={() => {
                                        let snapped = editingAssignment.percentage
                                        if (snapped < 10) snapped = 10
                                        else if (snapped > 100) snapped = 100
                                        else snapped = Math.round(snapped / 10) * 10
                                        setEditingAssignment({ ...editingAssignment, percentage: snapped })
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditAssignment()
                                        if (e.key === 'Escape') cancelEditAssignment()
                                      }}
                                      className="h-7 w-16 text-xs"
                                      autoFocus
                                    />
                                    <span className="text-xs text-muted-foreground">%</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEditAssignment}>
                                      <Check className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditAssignment}>
                                      <X className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                )
                              }

                              return (
                                <div key={project.id} className="group relative">
                                  <Badge 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-accent transition-colors pr-8"
                                    onClick={() => assignment && startEditAssignment(consultant.id, project.id, assignment.percentage)}
                                  >
                                    {project.name}
                                    {assignment && (
                                      <span className="ml-1 font-mono text-[10px]">
                                        ({assignment.percentage}%)
                                      </span>
                                    )}
                                    <PencilSimple className="absolute right-7 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveAssignment(consultant.id, project.id)
                                      }}
                                    >
                                      <X className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </Badge>
                                </div>
                              )
                            })}
                            {getConsultantSoftTaggedProjects(consultant.id).map((project) => (
                              <div key={`soft-${project.id}`} className="group relative">
                                <Badge 
                                  variant="outline" 
                                  className="border-dashed border-muted-foreground/50 text-muted-foreground hover:bg-accent transition-colors pr-6"
                                >
                                  {project.name}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const updatedProject = {
                                        ...project,
                                        softTags: (project.softTags || []).filter(st => st.consultantId !== consultant.id)
                                      }
                                      onUpdateProject(updatedProject)
                                    }}
                                  >
                                    <X className="h-3 w-3 text-destructive" />
                                  </Button>
                                </Badge>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteConsultant(consultant.id)}
                      >
                        <Trash className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <ConsultantDialog
        isOpen={isAddDialogOpen}
        onSave={(consultant) => {
          onAddConsultant(consultant as Omit<Consultant, 'id'>)
          setIsAddDialogOpen(false)
        }}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  )
}
