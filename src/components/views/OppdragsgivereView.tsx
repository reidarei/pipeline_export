import { useState, useMemo } from 'react'
import { Oppdragsgiver, Project, Consultant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowUp, ArrowDown, CaretUpDown } from '@phosphor-icons/react'
import { OppdragsgiverDialog } from '@/components/dialogs/OppdragsgiverDialog'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface OppdragsgivereViewProps {
  oppdragsgivere: Oppdragsgiver[]
  projects: Project[]
  consultants: Consultant[]
  onAddOppdragsgiver: (oppdragsgiver: Omit<Oppdragsgiver, 'id'>) => void
  onUpdateOppdragsgiver: (oppdragsgiver: Oppdragsgiver) => void
  onDeleteOppdragsgiver: (oppdragsgiverId: string) => void
}

type SortField = 'name' | 'projects' | 'consultants' | 'allocation'
type SortDirection = 'asc' | 'desc'

export function OppdragsgivereView({
  oppdragsgivere,
  projects,
  consultants,
  onAddOppdragsgiver,
  onUpdateOppdragsgiver,
  onDeleteOppdragsgiver,
}: OppdragsgivereViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOppdragsgiver, setSelectedOppdragsgiver] = useState<Oppdragsgiver | undefined>()
  const [sortField, setSortField] = useState<SortField>('allocation')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showClosedProjects, setShowClosedProjects] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getOppdragsgiverProjects = (oppdragsgiverName: string) => {
    return projects.filter((p) => {
      if (p.oppdragsgiver !== oppdragsgiverName) return false
      if (!showClosedProjects && p.status === 'closed') return false
      return true
    })
  }

  const getOppdragsgiverConsultants = (oppdragsgiverName: string) => {
    const oppdragsgiverProjects = getOppdragsgiverProjects(oppdragsgiverName)
    const consultantMap = new Map<string, { consultant: Consultant; totalPercentage: number }>()

    oppdragsgiverProjects.forEach((project) => {
      project.assignments.forEach((assignment) => {
        const consultant = consultants.find((c) => c.id === assignment.consultantId)
        if (consultant) {
          const existing = consultantMap.get(consultant.id)
          if (existing) {
            existing.totalPercentage += assignment.percentage
          } else {
            consultantMap.set(consultant.id, {
              consultant,
              totalPercentage: assignment.percentage,
            })
          }
        }
      })
    })

    return Array.from(consultantMap.values())
  }

  const getOppdragsgiverTotalAllocation = (oppdragsgiverName: string) => {
    const oppdragsgiverConsultants = getOppdragsgiverConsultants(oppdragsgiverName)
    return oppdragsgiverConsultants.reduce((sum, { totalPercentage }) => sum + totalPercentage, 0)
  }

  const allOppdragsgivere = useMemo(() => {
    const oppdragsgiverMap = new Map<string, Oppdragsgiver>()
    
    oppdragsgivere.forEach(o => {
      oppdragsgiverMap.set(o.name, o)
    })
    
    projects.forEach(p => {
      if (p.oppdragsgiver && p.oppdragsgiver.trim() && !oppdragsgiverMap.has(p.oppdragsgiver)) {
        oppdragsgiverMap.set(p.oppdragsgiver, {
          id: crypto.randomUUID(),
          name: p.oppdragsgiver
        })
      }
    })
    
    return Array.from(oppdragsgiverMap.values())
  }, [oppdragsgivere, projects])

  const sortedOppdragsgivere = useMemo(() => {
    const sorted = [...allOppdragsgivere].sort((a, b) => {
      if (sortField === 'name') {
        return a.name.localeCompare(b.name, 'nb')
      } else if (sortField === 'projects') {
        const aProjects = getOppdragsgiverProjects(a.name).length
        const bProjects = getOppdragsgiverProjects(b.name).length
        return aProjects - bProjects
      } else if (sortField === 'consultants') {
        const aConsultants = getOppdragsgiverConsultants(a.name).length
        const bConsultants = getOppdragsgiverConsultants(b.name).length
        return aConsultants - bConsultants
      } else if (sortField === 'allocation') {
        const aAllocation = getOppdragsgiverTotalAllocation(a.name)
        const bAllocation = getOppdragsgiverTotalAllocation(b.name)
        return aAllocation - bAllocation
      }
      return 0
    })

    if (sortDirection === 'desc') {
      sorted.reverse()
    }

    return sorted
  }, [allOppdragsgivere, projects, consultants, sortField, sortDirection, showClosedProjects])

  const handleAdd = () => {
    setSelectedOppdragsgiver(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (oppdragsgiver: Oppdragsgiver) => {
    setSelectedOppdragsgiver(oppdragsgiver)
    setDialogOpen(true)
  }

  const handleSave = (oppdragsgiverData: Omit<Oppdragsgiver, 'id'>) => {
    if (selectedOppdragsgiver) {
      onUpdateOppdragsgiver({ ...selectedOppdragsgiver, ...oppdragsgiverData })
    } else {
      onAddOppdragsgiver(oppdragsgiverData)
    }
    setDialogOpen(false)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <CaretUpDown className="ml-1 opacity-30" />
    return sortDirection === 'asc' ? <ArrowUp className="ml-1" /> : <ArrowDown className="ml-1" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Oppdragsgivere</h2>
        <div className="flex items-center gap-2">
          <Switch
            id="show-closed-projects"
            checked={showClosedProjects}
            onCheckedChange={setShowClosedProjects}
          />
          <Label htmlFor="show-closed-projects" className="cursor-pointer">
            Vis lukkede prosjekter
          </Label>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  Oppdragsgiver
                  <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('projects')}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  Prosjekter
                  <SortIcon field="projects" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('consultants')}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  Konsulenter
                  <SortIcon field="consultants" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('allocation')}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  Total belastning
                  <SortIcon field="allocation" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOppdragsgivere.map((oppdragsgiver) => {
              const oppdragsgiverProjects = getOppdragsgiverProjects(oppdragsgiver.name)
              const oppdragsgiverConsultants = getOppdragsgiverConsultants(oppdragsgiver.name)
              const totalAllocation = getOppdragsgiverTotalAllocation(oppdragsgiver.name)

              return (
                <TableRow
                  key={oppdragsgiver.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(oppdragsgiver)}
                >
                  <TableCell className="font-medium">{oppdragsgiver.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {oppdragsgiverProjects.length === 0 ? (
                        <span className="text-muted-foreground text-sm">Ingen prosjekter</span>
                      ) : (
                        oppdragsgiverProjects.map((project) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <Badge
                              variant={
                                project.status === 'active'
                                  ? 'default'
                                  : project.status === 'planlagt'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {project.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(project.startDate), 'dd.MM.yy', { locale: nb })} -{' '}
                              {format(new Date(project.endDate), 'dd.MM.yy', { locale: nb })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {oppdragsgiverConsultants.length === 0 ? (
                        <span className="text-muted-foreground text-sm">Ingen konsulenter</span>
                      ) : (
                        oppdragsgiverConsultants.map(({ consultant, totalPercentage }) => (
                          <div
                            key={consultant.id}
                            className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={consultant.avatarUrl} alt={consultant.name} />
                              <AvatarFallback className="text-xs">
                                {consultant.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{consultant.name}</span>
                            <Badge
                              variant={totalPercentage > 100 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {totalPercentage}%
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono">{totalAllocation}%</span>
                      {totalAllocation > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({oppdragsgiverConsultants.length} konsulent{oppdragsgiverConsultants.length !== 1 ? 'er' : ''})
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <OppdragsgiverDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        oppdragsgiver={selectedOppdragsgiver}
        onSave={handleSave}
        onDelete={selectedOppdragsgiver ? () => onDeleteOppdragsgiver(selectedOppdragsgiver.id) : undefined}
      />
    </div>
  )
}
