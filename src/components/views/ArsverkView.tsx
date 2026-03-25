import { useMemo } from 'react'
import { Project, Consultant } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, parseISO, isWithinInterval, isBefore, isAfter, differenceInDays } from 'date-fns'
import { nb } from 'date-fns/locale'

interface ArsverkViewProps {
  projects: Project[]
  consultants: Consultant[]
}

interface MonthData {
  month: Date
  availableFTE: number
  totalConsultants: number
  consultantsOnLeave: number
}

export function ArsverkView({ projects, consultants }: ArsverkViewProps) {
  const monthlyData = useMemo(() => {
    if (consultants.length === 0) {
      return []
    }

    const activeProjects = projects.filter(p => p.status === 'active')
    
    const allDates = [
      ...activeProjects.flatMap(p => [parseISO(p.startDate), parseISO(p.endDate)]),
      ...consultants.filter(c => c.leave).flatMap(c => [parseISO(c.leave!.startDate), parseISO(c.leave!.endDate)])
    ]
    
    if (allDates.length === 0) {
      const now = new Date()
      allDates.push(startOfMonth(now), endOfMonth(now))
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    const monthsToShow = eachMonthOfInterval({
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate)
    })

    const data: MonthData[] = monthsToShow.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
      
      let availableCapacity = consultants.length * 100
      const consultantsOnLeaveSet = new Set<string>()

      consultants.forEach(consultant => {
        if (consultant.leave) {
          const leaveStart = parseISO(consultant.leave.startDate)
          const leaveEnd = parseISO(consultant.leave.endDate)
          
          const leaveOverlapsMonth = 
            isWithinInterval(monthStart, { start: leaveStart, end: leaveEnd }) ||
            isWithinInterval(monthEnd, { start: leaveStart, end: leaveEnd }) ||
            (isBefore(leaveStart, monthStart) && isAfter(leaveEnd, monthEnd))
          
          if (leaveOverlapsMonth) {
            consultantsOnLeaveSet.add(consultant.id)
            
            const overlapStart = isBefore(leaveStart, monthStart) ? monthStart : leaveStart
            const overlapEnd = isAfter(leaveEnd, monthEnd) ? monthEnd : leaveEnd
            const leaveDaysInMonth = differenceInDays(overlapEnd, overlapStart) + 1
            const leavePercentageOfMonth = (leaveDaysInMonth / daysInMonth) * 100
            
            availableCapacity -= leavePercentageOfMonth
          }
        }
      })

      return {
        month,
        availableFTE: availableCapacity / 100,
        totalConsultants: consultants.length,
        consultantsOnLeave: consultantsOnLeaveSet.size
      }
    })

    return data
  }, [projects, consultants])

  const maxFTE = Math.max(...monthlyData.map(d => d.availableFTE), 1)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tilgjengelige årsverk per måned</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Ingen konsulenter å vise
            </div>
          ) : (
            <div className="w-full" style={{ aspectRatio: '16 / 9' }}>
              <div className="flex items-end gap-2 h-full px-4 pb-8">
                {monthlyData.map((data, index) => {
                  const barHeight = (data.availableFTE / maxFTE) * 100
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                      <div className="flex-1 w-full flex flex-col justify-end">
                        <div 
                          className="w-full bg-accent rounded-t-md transition-all relative group"
                          style={{ height: `${barHeight}%` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {data.availableFTE > 0 && (
                              <span className="text-accent-foreground font-semibold text-sm">
                                {data.availableFTE.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap">
                              <div>{data.totalConsultants} konsulenter</div>
                              {data.consultantsOnLeave > 0 && (
                                <div>{data.consultantsOnLeave} på permisjon</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center font-medium">
                        {format(data.month, 'MMM yy', { locale: nb })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gjennomsnittlig kapasitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {monthlyData.length > 0
                ? (monthlyData.reduce((sum, d) => sum + d.availableFTE, 0) / monthlyData.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Høyeste kapasitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {monthlyData.length > 0
                ? Math.max(...monthlyData.map(d => d.availableFTE)).toFixed(1)
                : '0.0'}
            </div>
            {monthlyData.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                {format(
                  monthlyData.reduce((max, d) => d.availableFTE > max.availableFTE ? d : max).month,
                  'MMMM yyyy',
                  { locale: nb }
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laveste kapasitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {monthlyData.length > 0
                ? Math.min(...monthlyData.map(d => d.availableFTE)).toFixed(1)
                : '0.0'}
            </div>
            {monthlyData.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                {format(
                  monthlyData.reduce((min, d) => d.availableFTE < min.availableFTE ? d : min).month,
                  'MMMM yyyy',
                  { locale: nb }
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
