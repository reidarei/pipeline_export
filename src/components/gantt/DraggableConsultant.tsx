import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Consultant, Project } from '@/lib/types'
import { calculateMonthlyAvailability, isConsultantOnLeave } from '@/lib/timeline-utils'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface DraggableConsultantProps {
  consultant: Consultant
  availablePercentage?: number
  projects: Project[]
}

export function DraggableConsultant({ consultant, availablePercentage, projects }: DraggableConsultantProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('consultantid', consultant.id)
    e.dataTransfer.effectAllowed = 'copy'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const monthlyAvailability = calculateMonthlyAvailability(consultant, projects, 6)
  const currentAvailability = monthlyAvailability[0]?.percentage || 0
  const isOverstaffed = currentAvailability < 0
  const onLeave = isConsultantOnLeave(consultant)
  
  const softTaggedProjects = projects.filter(
    p => p.status === 'planlagt' && p.softTags?.some(st => st.consultantId === consultant.id)
  )
  
  const futureAvailabilities = monthlyAvailability.slice(1).reduce((acc, ma, slicedIndex) => {
    const originalIndex = slicedIndex + 1
    const previousAvailability = monthlyAvailability[originalIndex - 1].percentage
    
    if (ma.percentage !== previousAvailability) {
      acc.push(ma)
    }
    return acc
  }, [] as typeof monthlyAvailability)

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md bg-card border transition-all cursor-grab active:cursor-grabbing',
        onLeave && 'border-accent border-2 bg-accent/10 hover:border-accent hover:bg-accent/20',
        !onLeave && isOverstaffed && 'border-destructive border-2 bg-destructive/5 hover:border-destructive hover:bg-destructive/10',
        !onLeave && !isOverstaffed && 'border-border hover:border-primary hover:scale-102',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
        <AvatarImage src={consultant.avatarUrl} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
          {consultant.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-xs leading-tight",
          isOverstaffed && "text-destructive",
          onLeave && "text-accent"
        )}>
          {consultant.name}
        </div>
        <div className="flex flex-col gap-0.5 mt-0.5">
          {onLeave && consultant.leave ? (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 w-fit font-semibold bg-accent/20 text-accent border-accent">
              On Leave
            </Badge>
          ) : (
            availablePercentage !== undefined && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1 py-0 h-4 w-fit font-mono font-semibold",
                  isOverstaffed && "bg-destructive text-destructive-foreground border-destructive animate-pulse",
                  !isOverstaffed && availablePercentage >= 50 && "bg-accent/30 text-foreground border-accent/50",
                  !isOverstaffed && availablePercentage < 50 && availablePercentage >= 20 && "bg-muted text-foreground border-border",
                  !isOverstaffed && availablePercentage < 20 && "bg-destructive/20 text-foreground border-destructive/50"
                )}
              >
                {isOverstaffed ? `${Math.abs(availablePercentage)}% over` : `${availablePercentage}%`}
              </Badge>
            )
          )}
          {softTaggedProjects.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1 py-0 h-4 w-fit font-semibold bg-primary/10 text-primary border-dashed border-primary"
            >
              Soft-tagget
            </Badge>
          )}
          {onLeave && consultant.leave && (
            <span className="text-[9px] text-accent font-medium">
              Until {format(new Date(consultant.leave.endDate), 'MMM d')}
            </span>
          )}
          {!onLeave && futureAvailabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {futureAvailabilities.slice(0, 3).map((ma, index) => (
                <span 
                  key={index}
                  className="text-[9px] text-muted-foreground font-mono"
                >
                  {ma.percentage}% {ma.month}
                  {index < Math.min(2, futureAvailabilities.length - 1) && ','}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
