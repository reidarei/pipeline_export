import { format } from 'date-fns'
import { getMonthColor } from '@/lib/timeline-utils'

interface TimelineRulerProps {
  months: Date[]
  monthWidth: number
}

export function TimelineRuler({ months, monthWidth }: TimelineRulerProps) {
  return (
    <div className="flex border-b-2 border-border sticky top-0 z-20 bg-background">
      {months.map((month, index) => (
        <div
          key={month.toISOString()}
          className="flex-shrink-0 border-r border-border p-3 font-semibold text-sm"
          style={{
            width: `${monthWidth}px`,
            backgroundColor: getMonthColor(month.getMonth()),
          }}
        >
          {format(month, 'MMMM yyyy')}
        </div>
      ))}
    </div>
  )
}
