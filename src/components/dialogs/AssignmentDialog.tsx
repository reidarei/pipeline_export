import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Project } from '@/lib/types'
import { validateAllocation } from '@/lib/timeline-utils'
import { WarningCircle } from '@phosphor-icons/react'

interface AssignmentDialogProps {
  isOpen: boolean
  consultantId: string
  consultantName: string
  projectId: string
  projectName: string
  currentPercentage?: number
  projects: Project[]
  onConfirm: (percentage: number) => void
  onClose: () => void
}

export function AssignmentDialog({
  isOpen,
  consultantId,
  consultantName,
  projectId,
  projectName,
  currentPercentage = 50,
  projects,
  onConfirm,
  onClose,
}: AssignmentDialogProps) {
  const [percentage, setPercentage] = useState(currentPercentage)
  const [inputValue, setInputValue] = useState(String(currentPercentage))

  useEffect(() => {
    if (isOpen) {
      setPercentage(currentPercentage)
      setInputValue(String(currentPercentage))
    }
  }, [isOpen, currentPercentage])

  const validation = validateAllocation(consultantId, projects, projectId, percentage)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 10 && numValue <= 100) {
      setPercentage(numValue)
    }
  }

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue)
    if (isNaN(numValue) || numValue < 10) {
      setPercentage(10)
      setInputValue('10')
    } else if (numValue > 100) {
      setPercentage(100)
      setInputValue('100')
    } else {
      const snapped = Math.round(numValue / 10) * 10
      setPercentage(snapped)
      setInputValue(String(snapped))
    }
  }

  const handleConfirm = () => {
    if (percentage >= 10 && percentage <= 100 && validation.isValid) {
      onConfirm(percentage)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Consultant</DialogTitle>
          <DialogDescription>
            Set allocation percentage for {consultantName} on {projectName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="percentage">Allocation Percentage</Label>
            <Input
              id="percentage"
              type="number"
              min="10"
              max="100"
              step="10"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              className={!validation.isValid ? 'border-destructive' : ''}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter a value between 10 and 100 (in increments of 10)
            </p>
          </div>
          
          {!validation.isValid && (
            <Alert variant="destructive">
              <WarningCircle className="h-4 w-4" />
              <AlertDescription>
                This allocation would exceed {consultantName}'s total capacity by {validation.exceeded}%. 
                Total allocation would be {validation.totalAllocation}% (max 100%).
              </AlertDescription>
            </Alert>
          )}
          
          {validation.isValid && validation.totalAllocation > 0 && (
            <div className="text-sm text-muted-foreground">
              Total allocation after this assignment: {validation.totalAllocation}%
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!validation.isValid || percentage < 10 || percentage > 100}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
