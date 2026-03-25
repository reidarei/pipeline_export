import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Project, Consultant } from '@/lib/types'
import { seedProjects, seedConsultants } from '@/lib/seed-data'
import { Database } from '@phosphor-icons/react'

interface SeedDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSeedData: (projects: Project[], consultants: Consultant[]) => void
  currentProjectCount: number
  currentConsultantCount: number
}

export function SeedDataDialog({
  open,
  onOpenChange,
  onSeedData,
  currentProjectCount,
  currentConsultantCount,
}: SeedDataDialogProps) {
  const handleSeedData = () => {
    onSeedData(seedProjects, seedConsultants)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Seed Test Data
          </DialogTitle>
          <DialogDescription>
            Load sample data to quickly populate your pipeline with realistic projects and
            consultants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Projects</span>
              <span className="text-sm text-muted-foreground">
                {currentProjectCount} → 12
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Consultants</span>
              <span className="text-sm text-muted-foreground">
                {currentConsultantCount} → 40
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            This will replace all existing data with 12 sample projects and 40 consultants with
            realistic assignments and timelines.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSeedData}>Load Test Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
