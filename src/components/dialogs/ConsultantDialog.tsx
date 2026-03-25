import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Consultant, ConsultantLevel } from '@/lib/types'

interface ConsultantDialogProps {
  isOpen: boolean
  consultant?: Consultant
  onSave: (consultant: Omit<Consultant, 'id'> | Consultant) => void
  onClose: () => void
}

export function ConsultantDialog({ isOpen, consultant, onSave, onClose }: ConsultantDialogProps) {
  const [name, setName] = useState(consultant?.name || '')
  const [level, setLevel] = useState<ConsultantLevel>(consultant?.level || 'Medior')
  const [avatarUrl, setAvatarUrl] = useState(consultant?.avatarUrl || '')
  const [hasLeave, setHasLeave] = useState(!!consultant?.leave)
  const [leaveStartDate, setLeaveStartDate] = useState(consultant?.leave?.startDate || '')
  const [leaveEndDate, setLeaveEndDate] = useState(consultant?.leave?.endDate || '')

  const handleSave = () => {
    if (name && level) {
      const leave = hasLeave && leaveStartDate && leaveEndDate 
        ? { startDate: leaveStartDate, endDate: leaveEndDate }
        : undefined

      if (consultant) {
        onSave({
          ...consultant,
          name,
          level,
          avatarUrl: avatarUrl || undefined,
          leave,
        })
      } else {
        onSave({
          name,
          level,
          avatarUrl: avatarUrl || undefined,
          leave,
        })
      }
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{consultant ? 'Edit Consultant' : 'Add Consultant'}</DialogTitle>
          <DialogDescription>
            {consultant ? 'Update consultant details' : 'Add a new consultant to the team'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter consultant name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="level">Level</Label>
            <Select value={level} onValueChange={(value) => setLevel(value as ConsultantLevel)}>
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Junior">Junior</SelectItem>
                <SelectItem value="Medior">Medior</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
                <SelectItem value="Principal">Principal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div className="grid gap-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasLeave"
                checked={hasLeave}
                onCheckedChange={(checked) => setHasLeave(checked as boolean)}
              />
              <Label htmlFor="hasLeave" className="cursor-pointer">
                Consultant has leave
              </Label>
            </div>
            {hasLeave && (
              <div className="grid gap-3 pl-6">
                <div className="grid gap-2">
                  <Label htmlFor="leaveStartDate">Leave Start Date</Label>
                  <Input
                    id="leaveStartDate"
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leaveEndDate">Leave End Date</Label>
                  <Input
                    id="leaveEndDate"
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {consultant ? 'Save Changes' : 'Add Consultant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
