import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Project } from '@/lib/types'
import { formatDateForInput } from '@/lib/timeline-utils'

interface ProjectDialogProps {
  isOpen: boolean
  project?: Project
  onSave: (project: Omit<Project, 'id'> | Project) => void
  onClose: () => void
}

export function ProjectDialog({ isOpen, project, onSave, onClose }: ProjectDialogProps) {
  const [name, setName] = useState(project?.name || '')
  const [oppdragsgiver, setOppdragsgiver] = useState(project?.oppdragsgiver || '')
  const [startDate, setStartDate] = useState(
    project ? formatDateForInput(project.startDate) : formatDateForInput(new Date())
  )
  const [endDate, setEndDate] = useState(
    project ? formatDateForInput(project.endDate) : formatDateForInput(new Date())
  )

  const handleSave = () => {
    if (name && oppdragsgiver && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start > end) {
        return
      }
      
      if (project) {
        onSave({
          ...project,
          name,
          oppdragsgiver,
          startDate: startDate,
          endDate: endDate,
        })
      } else {
        onSave({
          name,
          oppdragsgiver,
          startDate: startDate,
          endDate: endDate,
          assignments: [],
          softTags: [],
          status: 'active',
        })
      }
      onClose()
    }
  }

  const isDateInvalid = () => {
    if (!startDate || !endDate) return false
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start > end
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Add Project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update project details' : 'Create a new project for the pipeline'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="oppdragsgiver">Oppdragsgiver</Label>
            <Input
              id="oppdragsgiver"
              value={oppdragsgiver}
              onChange={(e) => setOppdragsgiver(e.target.value)}
              placeholder="Navn på oppdragsgiver"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={isDateInvalid() ? 'border-destructive' : ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={isDateInvalid() ? 'border-destructive' : ''}
              />
            </div>
          </div>
          {isDateInvalid() && (
            <p className="text-sm text-destructive">
              Start date cannot be after end date
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isDateInvalid() || !name || !oppdragsgiver || !startDate || !endDate}>
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
