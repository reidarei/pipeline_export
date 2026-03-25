import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Consultant, Project } from '@/lib/types'
import { calculateConsultantAvailability } from '@/lib/timeline-utils'

interface ConsultantSelectorDialogProps {
  isOpen: boolean
  projectId: string
  projectName: string
  consultants: Consultant[]
  projects: Project[]
  onSelectConsultant: (consultantId: string) => void
  onClose: () => void
}

export function ConsultantSelectorDialog({
  isOpen,
  projectName,
  consultants,
  projects,
  onSelectConsultant,
  onClose,
}: ConsultantSelectorDialogProps) {
  const handleSelectConsultant = (consultantId: string) => {
    onSelectConsultant(consultantId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Consultant</DialogTitle>
          <DialogDescription>
            Select a consultant to assign to {projectName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {consultants.map((consultant) => {
              const availablePercentage = calculateConsultantAvailability(consultant, projects)
              return (
                <Button
                  key={consultant.id}
                  variant="ghost"
                  className="w-full h-auto p-3 justify-start hover:bg-accent"
                  onClick={() => handleSelectConsultant(consultant.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={consultant.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {consultant.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{consultant.name}</div>
                    <div className="text-xs text-muted-foreground">{consultant.level}</div>
                  </div>
                  <Badge variant={availablePercentage > 0 ? 'default' : 'secondary'}>
                    {availablePercentage}% free
                  </Badge>
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
