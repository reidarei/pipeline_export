import { useState, useEffect } from 'react'
import { Oppdragsgiver } from '@/lib/types'

export type Customer = Oppdragsgiver
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

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  onSave: (customer: Omit<Customer, 'id'>) => void
  onDelete?: () => void
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSave,
  onDelete,
}: CustomerDialogProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (customer) {
      setName(customer.name)
    } else {
      setName('')
    }
  }, [customer, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
    })
  }

  const handleDelete = () => {
    if (onDelete && confirm('Er du sikker på at du vil slette denne kunden?')) {
      onDelete()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? 'Rediger kunde' : 'Legg til kunde'}</DialogTitle>
          <DialogDescription>
            {customer
              ? 'Oppdater kundeinformasjon.'
              : 'Fyll inn informasjon om den nye kunden.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">Navn *</Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {customer && onDelete && (
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
