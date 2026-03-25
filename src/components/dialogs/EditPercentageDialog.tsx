import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Consultant } from '@/lib/types'

interface EditPercentageDialogProps {
  isOpen: boolean
  consultant: Consultant | null
  projectName: string
  currentPercentage: number
  onSave: (newPercentage: number) => void
  onClose: () => void
}

export function EditPercentageDialog({
  isOpen,
  consultant,
  projectName,
  currentPercentage,
  onSave,
  onClose,
}: EditPercentageDialogProps) {
  const [percentage, setPercentage] = useState(currentPercentage)
  const [inputValue, setInputValue] = useState(String(currentPercentage))

  useEffect(() => {
    setPercentage(currentPercentage)
    setInputValue(String(currentPercentage))
  }, [currentPercentage, isOpen])

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0]
    setPercentage(newValue)
    setInputValue(String(newValue))
  }

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

  const handleSave = () => {
    onSave(percentage)
    onClose()
  }

  if (!consultant) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Allocation</DialogTitle>
          <DialogDescription>
            Adjust the percentage allocation for this consultant on {projectName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={consultant.avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {consultant.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{consultant.name}</div>
              <div className="text-xs text-muted-foreground">{consultant.level}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="percentage-input">Allocation Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="percentage-input"
                  type="number"
                  min="0"
                  max="100"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className="w-20 text-center font-mono"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Slider
                value={[percentage]}
                onValueChange={handleSliderChange}
                min={10}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
