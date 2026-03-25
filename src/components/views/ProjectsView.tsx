import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, Trash, Check, X, UserPlus, PencilSimple, CaretUp, CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Project, Consultant, ProjectStatus } from '@/lib/types'
import { ProjectDialog } from '../dialogs/ProjectDialog'
import { AssignmentDialog } from '../dialogs/AssignmentDialog'
import { formatDateForInput, validateAllocation } from '@/lib/timeline-utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { WarningCircle } from '@phosphor-icons/react'

type SortField = 'name' | 'oppdragsgiver' | 'startDate' | 'endDate' | 'status' | 'totalAllocation'
type SortDirection = 'asc' | 'desc' | null

interface ProjectsViewProps {
  projects: Project[]
  consultants: Consultant[]
  onAddProject: (project: Omit<Project, 'id'>) => void
  onUpdateProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
}

interface EditingCell {
  projectId: string
  field: 'name' | 'oppdragsgiver' | 'startDate' | 'endDate'
  value: string
}

export function ProjectsView({
  projects,
  consultants,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectsViewProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [showClosedProjects, setShowClosedProjects] = useState(false)
  const [assignmentDialog, setAssignmentDialog] = useState<{
    projectId: string
    consultantId?: string
    currentPercentage?: number
    isSoftTag?: boolean
  } | null>(null)
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

  const filteredProjects = useMemo(() => {
    let filtered = showClosedProjects 
      ? projects 
      : projects.filter(p => p.status === 'active' || p.status === 'planlagt')
    
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        if (sortField === 'startDate' || sortField === 'endDate') {
          aValue = new Date(a[sortField]).getTime()
          bValue = new Date(b[sortField]).getTime()
        } else if (sortField === 'totalAllocation') {
          aValue = a.assignments.reduce((sum, assignment) => sum + assignment.percentage, 0)
          bValue = b.assignments.reduce((sum, assignment) => sum + assignment.percentage, 0)
        } else {
          aValue = a[sortField].toLowerCase()
          bValue = b[sortField].toLowerCase()
        }
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }
    
    return filtered
  }, [projects, showClosedProjects, sortField, sortDirection])

  const startEdit = (projectId: string, field: 'name' | 'oppdragsgiver' | 'startDate' | 'endDate', currentValue: string) => {
    const value = field === 'startDate' || field === 'endDate' 
      ? formatDateForInput(currentValue)
      : currentValue
    setEditingCell({ projectId, field, value })
  }

  const saveEdit = () => {
    if (editingCell) {
      const project = projects.find(p => p.id === editingCell.projectId)
      if (project) {
        const updatedProject = {
          ...project,
          [editingCell.field]: editingCell.value
        }
        
        const startDate = new Date(editingCell.field === 'startDate' ? editingCell.value : updatedProject.startDate)
        const endDate = new Date(editingCell.field === 'endDate' ? editingCell.value : updatedProject.endDate)
        
        if (startDate > endDate) {
          toast.error('Startdato kan ikke være etter sluttdato')
          return
        }
        
        onUpdateProject(updatedProject)
      }
      setEditingCell(null)
    }
  }

  const isEditingDateInvalid = () => {
    if (!editingCell || (editingCell.field !== 'startDate' && editingCell.field !== 'endDate')) {
      return false
    }
    
    const project = projects.find(p => p.id === editingCell.projectId)
    if (!project) return false
    
    const startDate = new Date(editingCell.field === 'startDate' ? editingCell.value : project.startDate)
    const endDate = new Date(editingCell.field === 'endDate' ? editingCell.value : project.endDate)
    
    return startDate > endDate
  }

  const cancelEdit = () => {
    setEditingCell(null)
  }

  const handleRemoveAssignment = (projectId: string, consultantId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      onUpdateProject({
        ...project,
        assignments: project.assignments.filter(a => a.consultantId !== consultantId)
      })
    }
  }

  const handleRemoveSoftTag = (projectId: string, consultantId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      onUpdateProject({
        ...project,
        softTags: (project.softTags || []).filter(st => st.consultantId !== consultantId)
      })
    }
  }

  const handleAddSoftTag = (projectId: string) => {
    setAssignmentDialog({
      projectId,
      consultantId: undefined,
      currentPercentage: undefined,
      isSoftTag: true
    })
  }

  const handleEditAssignment = (projectId: string, consultantId: string, currentPercentage: number) => {
    setAssignmentDialog({
      projectId,
      consultantId,
      currentPercentage
    })
  }

  const handleAddAssignment = (projectId: string) => {
    setAssignmentDialog({
      projectId,
      consultantId: undefined,
      currentPercentage: 50
    })
  }

  const handleAssignmentConfirm = (consultantId: string, percentage: number) => {
    if (assignmentDialog) {
      const project = filteredProjects.find(p => p.id === assignmentDialog.projectId)
      if (project) {
        if (assignmentDialog.isSoftTag) {
          const updatedSoftTags = [...(project.softTags || [])]
          if (!updatedSoftTags.some(st => st.consultantId === consultantId)) {
            updatedSoftTags.push({ consultantId })
          }
          
          onUpdateProject({
            ...project,
            softTags: updatedSoftTags
          })
        } else {
          const existingAssignmentIndex = project.assignments.findIndex(a => a.consultantId === consultantId)
          const updatedAssignments = [...project.assignments]
          
          if (existingAssignmentIndex >= 0) {
            updatedAssignments[existingAssignmentIndex] = { consultantId, percentage }
          } else {
            updatedAssignments.push({ consultantId, percentage })
          }
          
          onUpdateProject({
            ...project,
            assignments: updatedAssignments
          })
        }
      }
      setAssignmentDialog(null)
    }
  }

  const handleStatusChange = (project: Project, newStatus: ProjectStatus) => {
    onUpdateProject({
      ...project,
      status: newStatus
    })
  }

  const renderEditableCell = (project: Project, field: 'name' | 'oppdragsgiver' | 'startDate' | 'endDate', displayValue: string) => {
    const isEditing = editingCell?.projectId === project.id && editingCell?.field === field

    if (isEditing) {
      const isInvalid = isEditingDateInvalid()
      
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            type={field === 'startDate' || field === 'endDate' ? 'date' : 'text'}
            className={`h-8 ${isInvalid ? 'border-destructive' : ''}`}
            autoFocus
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8" 
            onClick={saveEdit}
            disabled={isInvalid}
          >
            <Check className={isInvalid ? 'text-muted-foreground' : 'text-green-600'} />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
            <X className="text-destructive" />
          </Button>
        </div>
      )
    }

    return (
      <div
        className="group cursor-pointer hover:bg-accent/50 px-2 py-1 rounded transition-colors flex items-center gap-2"
        onClick={() => startEdit(project.id, field, field === 'startDate' || field === 'endDate' ? project[field] : project[field])}
      >
        <span className="flex-1">{displayValue}</span>
        <PencilSimple className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-bold">Prosjekter</h2>
          <div className="flex items-center gap-2">
            <Switch 
              id="show-closed" 
              checked={showClosedProjects} 
              onCheckedChange={setShowClosedProjects}
            />
            <Label htmlFor="show-closed" className="text-sm cursor-pointer">
              Vis lukkede prosjekter
            </Label>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2" />
          Legg til prosjekt
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
                  Prosjektnavn
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 select-none"
                onClick={() => handleSort('oppdragsgiver')}
              >
                <div className="flex items-center gap-2">
                  Oppdragsgiver
                  {sortField === 'oppdragsgiver' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 select-none"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center gap-2">
                  Startdato
                  {sortField === 'startDate' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 select-none"
                onClick={() => handleSort('endDate')}
              >
                <div className="flex items-center gap-2">
                  Sluttdato
                  {sortField === 'endDate' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent/50 select-none"
                onClick={() => handleSort('totalAllocation')}
              >
                <div className="flex items-center gap-2">
                  Tildelte konsulenter
                  {sortField === 'totalAllocation' && (
                    sortDirection === 'asc' ? <CaretUp weight="fill" className="w-4 h-4" /> : <CaretDown weight="fill" className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[100px]">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {showClosedProjects ? 'Ingen prosjekter ennå.' : 'Ingen aktive prosjekter. Slå på "Vis lukkede prosjekter" for å se alle.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    {renderEditableCell(project, 'name', project.name)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(project, 'oppdragsgiver', project.oppdragsgiver)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {renderEditableCell(
                      project,
                      'startDate',
                      format(new Date(project.startDate), 'MMM dd, yyyy')
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {renderEditableCell(
                      project,
                      'endDate',
                      format(new Date(project.endDate), 'MMM dd, yyyy')
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={project.status} 
                      onValueChange={(value) => handleStatusChange(project, value as ProjectStatus)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <Badge variant="default" className="bg-green-600">Aktiv</Badge>
                        </SelectItem>
                        <SelectItem value="planlagt">
                          <Badge variant="default" className="bg-blue-600">Planlagt</Badge>
                        </SelectItem>
                        <SelectItem value="closed">
                          <Badge variant="secondary">Lukket</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {project.assignments.map((assignment) => {
                        const consultant = consultants.find((c) => c.id === assignment.consultantId)
                        if (!consultant) return null
                        return (
                          <div 
                            key={`assigned-${consultant.id}`} 
                            className="relative group cursor-pointer"
                            onClick={() => handleEditAssignment(project.id, consultant.id, assignment.percentage)}
                          >
                            <Avatar className="h-8 w-8 border-2 border-background hover:border-primary transition-colors">
                              <AvatarImage src={consultant.avatarUrl} />
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {consultant.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-[10px] font-mono font-bold rounded-full h-4 w-4 flex items-center justify-center">
                              {assignment.percentage}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveAssignment(project.id, consultant.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                      {project.status === 'planlagt' && (project.softTags || []).map((softTag) => {
                        const consultant = consultants.find((c) => c.id === softTag.consultantId)
                        if (!consultant) return null
                        return (
                          <div 
                            key={`soft-${consultant.id}`} 
                            className="relative group"
                          >
                            <Avatar className="h-8 w-8 border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors">
                              <AvatarImage src={consultant.avatarUrl} />
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
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
                              className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveSoftTag(project.id, consultant.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                      {project.status !== 'planlagt' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleAddAssignment(project.id)}
                        >
                          <UserPlus />
                        </Button>
                      )}
                      {project.status === 'planlagt' && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleAddAssignment(project.id)}
                            title="Legg til tildelt konsulent"
                          >
                            <UserPlus />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 border border-dashed border-muted-foreground/50"
                            onClick={() => handleAddSoftTag(project.id)}
                            title="Legg til soft-tagget konsulent"
                          >
                            <UserPlus className="opacity-60" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteProject(project.id)}
                    >
                      <Trash className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ProjectDialog
        isOpen={isAddDialogOpen}
        onSave={(project) => {
          onAddProject(project as Omit<Project, 'id'>)
          setIsAddDialogOpen(false)
        }}
        onClose={() => setIsAddDialogOpen(false)}
      />

      {assignmentDialog && (
        assignmentDialog.consultantId ? (
          <AssignmentDialog
            isOpen={true}
            consultantId={assignmentDialog.consultantId}
            consultantName={consultants.find(c => c.id === assignmentDialog.consultantId)?.name || ''}
            projectId={assignmentDialog.projectId}
            projectName={projects.find(p => p.id === assignmentDialog.projectId)?.name || ''}
            currentPercentage={assignmentDialog.currentPercentage}
            projects={projects}
            onConfirm={(percentage) => handleAssignmentConfirm(assignmentDialog.consultantId!, percentage)}
            onClose={() => setAssignmentDialog(null)}
          />
        ) : (
          <ConsultantSelector
            isOpen={true}
            consultants={consultants}
            projects={projects}
            projectName={filteredProjects.find(p => p.id === assignmentDialog.projectId)?.name || ''}
            onConfirm={(consultantId, percentage) => handleAssignmentConfirm(consultantId, percentage)}
            onClose={() => setAssignmentDialog(null)}
          />
        )
      )}
    </div>
  )
}

interface ConsultantSelectorProps {
  isOpen: boolean
  consultants: Consultant[]
  projects: Project[]
  projectName: string
  onConfirm: (consultantId: string, percentage: number) => void
  onClose: () => void
}

function ConsultantSelector({ isOpen, consultants, projects, projectName, onConfirm, onClose }: ConsultantSelectorProps) {
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>(consultants[0]?.id || '')
  const [percentage, setPercentage] = useState(50)

  const projectId = projects.find(p => p.name === projectName)?.id || ''
  const validation = selectedConsultantId ? validateAllocation(selectedConsultantId, projects, projectId, percentage) : { isValid: true, totalAllocation: 0, exceeded: 0 }

  const handleConfirm = () => {
    if (selectedConsultantId && percentage > 0 && percentage <= 100 && validation.isValid) {
      onConfirm(selectedConsultantId, percentage)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg rounded-lg">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Legg til konsulent på {projectName}</h2>
          <p className="text-sm text-muted-foreground">Velg en konsulent og sett deres allokerings-prosent</p>
        </div>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Konsulent</label>
            <Select value={selectedConsultantId} onValueChange={setSelectedConsultantId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {consultants.map((consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={consultant.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {consultant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{consultant.name}</span>
                      <span className="text-xs text-muted-foreground">({consultant.level})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Allokeringsprosent</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              className={!validation.isValid ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">Angi en verdi mellom 1 og 100</p>
          </div>
          
          {!validation.isValid && selectedConsultantId && (
            <Alert variant="destructive">
              <WarningCircle className="h-4 w-4" />
              <AlertDescription>
                Denne allokeringen ville overstige {consultants.find(c => c.id === selectedConsultantId)?.name}' totale kapasitet med {validation.exceeded}%. 
                Total allokering ville bli {validation.totalAllocation}% (maks 100%).
              </AlertDescription>
            </Alert>
          )}
          
          {validation.isValid && validation.totalAllocation > 0 && selectedConsultantId && (
            <div className="text-sm text-muted-foreground">
              Total allokering etter denne tildelingen: {validation.totalAllocation}%
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={handleConfirm} disabled={!validation.isValid || percentage <= 0 || percentage > 100 || !selectedConsultantId}>
            Tildel
          </Button>
        </div>
      </div>
    </div>
  )
}
