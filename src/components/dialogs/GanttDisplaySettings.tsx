import { useState } from 'react'
import { Gear } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface GanttDisplayOptions {
  showConsultantPercentages: boolean
  showConsultantsInBars: boolean
  showPlannedProjects: boolean
  showClosedProjects: boolean
  showSoftTags: boolean
}

interface GanttDisplaySettingsProps {
  options: GanttDisplayOptions
  onOptionsChange: (options: GanttDisplayOptions) => void
}

export function GanttDisplaySettings({ options, onOptionsChange }: GanttDisplaySettingsProps) {
  const [open, setOpen] = useState(false)

  const handleToggle = (key: keyof GanttDisplayOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Visningsinnstillinger">
          <Gear className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gantt visningsinnstillinger</DialogTitle>
          <DialogDescription>
            Tilpass hva som vises i Gantt-diagrammet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Konsulenter</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-percentages" className="flex-1 cursor-pointer">
                  Vis prosenttall
                </Label>
                <Switch
                  id="show-percentages"
                  checked={options.showConsultantPercentages}
                  onCheckedChange={() => handleToggle('showConsultantPercentages')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Viser tildelte prosenttall på konsulenter i prosjektbarer
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-consultants-in-bars" className="flex-1 cursor-pointer">
                  Vis konsulenter i barer
                </Label>
                <Switch
                  id="show-consultants-in-bars"
                  checked={options.showConsultantsInBars}
                  onCheckedChange={() => handleToggle('showConsultantsInBars')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Viser konsulentavatarer inne i prosjektbarene
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-soft-tags" className="flex-1 cursor-pointer">
                  Vis soft tagging
                </Label>
                <Switch
                  id="show-soft-tags"
                  checked={options.showSoftTags}
                  onCheckedChange={() => handleToggle('showSoftTags')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Viser soft-taggede konsulenter på planlagte prosjekter
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Prosjekter</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-planned" className="flex-1 cursor-pointer">
                  Vis planlagte prosjekter
                </Label>
                <Switch
                  id="show-planned"
                  checked={options.showPlannedProjects}
                  onCheckedChange={() => handleToggle('showPlannedProjects')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Viser prosjekter med status "planlagt"
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-closed" className="flex-1 cursor-pointer">
                  Vis lukkede prosjekter
                </Label>
                <Switch
                  id="show-closed"
                  checked={options.showClosedProjects}
                  onCheckedChange={() => handleToggle('showClosedProjects')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Viser prosjekter med status "lukket"
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
