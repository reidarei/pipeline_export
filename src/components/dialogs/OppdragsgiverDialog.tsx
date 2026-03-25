import { useState, useEffect } from 'react'
import { Oppdragsgiver } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OppdragsgiverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  oppdragsgiver?: Oppdragsgiver
  onSave: (oppdragsgiver: Omit<Oppdragsgiver, 'id'>) => void
  onDelete?: () => void
}

export function OppdragsgiverDialog({
  open,
  onOpenChange,
  oppdragsgiver,
  onSave,
  onDelete,
}: OppdragsgiverDialogProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (oppdragsgiver) {
      setName(oppdragsgiver.name)
    } else {
      setName('')
    }
  }, [oppdragsgiver, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
    })
  }

  const handleDelete = () => {
    if (onDelete && confirm('Er du sikker på at du vil slette denne oppdragsgiveren?')) {
      onDelete()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{oppdragsgiver ? 'Rediger oppdragsgiver' : 'Legg til oppdragsgiver'}</DialogTitle>
          <DialogDescription>
            {oppdragsgiver
              ? 'Oppdater oppdragsgiverinformasjon.'
              : 'Fyll inn informasjon om den nye oppdragsgiveren.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="oppdragsgiver-name">Navn *</Label>
              <Input
                id="oppdragsgiver-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {oppdragsgiver && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Slett
              </Button>
            )}
            <Button type="submit">Lagre</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
