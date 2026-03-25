import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { ChartBar, Table, Users, Buildings, ChartLineUp } from '@phosphor-icons/react'
import { Project, Consultant, Oppdragsgiver, ViewMode } from '@/lib/types'
import { GanttView } from '@/components/views/GanttView'
import { ProjectsView } from '@/components/views/ProjectsView'
import { ConsultantsView } from '@/components/views/ConsultantsView'
import { OppdragsgivereView } from '@/components/views/OppdragsgivereView'
import { RapporterView } from '@/components/views/RapporterView'
import { toast } from 'sonner'

function App() {
  const [projects, setProjects] = useKV<Project[]>('projects', [])
  const [consultants, setConsultants] = useKV<Consultant[]>('consultants', [])
  const [oppdragsgivere, setOppdragsgivere] = useKV<Oppdragsgiver[]>('oppdragsgivere', [])
  const [viewMode, setViewMode] = useState<ViewMode>('gantt')

  useEffect(() => {
    if (projects && projects.length > 0) {
      const needsStatusMigration = projects.some(p => !p.status)
      const needsSoftTagMigration = projects.some(p => p.softTags === undefined)
      const needsOppdragsgiverMigration = projects.some(p => !(p as any).oppdragsgiver && (p as any).customer)
      
      if (needsStatusMigration || needsSoftTagMigration || needsOppdragsgiverMigration) {
        setProjects((current) =>
          (current || []).map(p => {
            const legacy = p as any
            return {
              ...p,
              status: p.status || 'active',
              softTags: p.softTags || [],
              oppdragsgiver: p.oppdragsgiver || legacy.customer || ''
            }
          })
        )
      }
    }
  }, [])

  useEffect(() => {
    if (projects && projects.length > 0) {
      const uniqueOppdragsgiverNames = new Set<string>()
      projects.forEach(p => {
        const oppdragsgiverName = p.oppdragsgiver
        if (oppdragsgiverName && oppdragsgiverName.trim()) {
          uniqueOppdragsgiverNames.add(oppdragsgiverName)
        }
      })

      const existingOppdragsgiverNames = new Set(
        (oppdragsgivere || []).map(o => o.name)
      )

      const missingOppdragsgivere: Oppdragsgiver[] = Array.from(uniqueOppdragsgiverNames)
        .filter(name => !existingOppdragsgiverNames.has(name))
        .map(name => ({
          id: crypto.randomUUID(),
          name: name
        }))

      if (missingOppdragsgivere.length > 0) {
        setOppdragsgivere((current) => [...(current || []), ...missingOppdragsgivere])
      }
    }
  }, [projects])

  const handleAddProject = (newProject: Omit<Project, 'id'>) => {
    const project: Project = {
      ...newProject,
      id: crypto.randomUUID(),
    }
    setProjects((current) => [...(current || []), project])
    toast.success('Prosjekt lagt til')
  }

  const handleUpdateProject = (updatedProject: Project, silent = false) => {
    setProjects((current) =>
      (current || []).map((p) => (p.id === updatedProject.id ? updatedProject : p))
    )
    if (!silent) {
      toast.success('Prosjekt oppdatert')
    }
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects((current) => (current || []).filter((p) => p.id !== projectId))
    toast.success('Prosjekt slettet')
  }

  const handleAddConsultant = (newConsultant: Omit<Consultant, 'id'>) => {
    const consultant: Consultant = {
      ...newConsultant,
      id: crypto.randomUUID(),
    }
    setConsultants((current) => [...(current || []), consultant])
    toast.success('Konsulent lagt til')
  }

  const handleUpdateConsultant = (updatedConsultant: Consultant) => {
    setConsultants((current) =>
      (current || []).map((c) => (c.id === updatedConsultant.id ? updatedConsultant : c))
    )
    toast.success('Konsulent oppdatert')
  }

  const handleDeleteConsultant = (consultantId: string) => {
    setProjects((current) =>
      (current || []).map((p) => ({
        ...p,
        assignments: p.assignments.filter((a) => a.consultantId !== consultantId),
      }))
    )
    setConsultants((current) => (current || []).filter((c) => c.id !== consultantId))
    toast.success('Konsulent fjernet fra alle prosjekter')
  }

  const handleReorderProjects = (reorderedProjects: Project[]) => {
    setProjects(reorderedProjects)
  }

  const handleAddOppdragsgiver = (newOppdragsgiver: Omit<Oppdragsgiver, 'id'>) => {
    const oppdragsgiver: Oppdragsgiver = {
      ...newOppdragsgiver,
      id: crypto.randomUUID(),
    }
    setOppdragsgivere((current) => [...(current || []), oppdragsgiver])
    toast.success('Oppdragsgiver lagt til')
  }

  const handleUpdateOppdragsgiver = (updatedOppdragsgiver: Oppdragsgiver) => {
    setOppdragsgivere((current) =>
      (current || []).map((c) => (c.id === updatedOppdragsgiver.id ? updatedOppdragsgiver : c))
    )
    toast.success('Oppdragsgiver oppdatert')
  }

  const handleDeleteOppdragsgiver = (oppdragsgiverId: string) => {
    setOppdragsgivere((current) => (current || []).filter((c) => c.id !== oppdragsgiverId))
    toast.success('Oppdragsgiver slettet')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Consultings pipeline</h1>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <ChartBar />
              <span>Gantt</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Table />
              <span>Prosjekter</span>
            </TabsTrigger>
            <TabsTrigger value="consultants" className="flex items-center gap-2">
              <Users />
              <span>Konsulenter</span>
            </TabsTrigger>
            <TabsTrigger value="oppdragsgivere" className="flex items-center gap-2">
              <Buildings />
              <span>Oppdragsgivere</span>
            </TabsTrigger>
            <TabsTrigger value="rapporter" className="flex items-center gap-2">
              <ChartLineUp />
              <span>Rapporter</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="mt-6">
            <GanttView
              projects={projects || []}
              consultants={consultants || []}
              onUpdateProject={handleUpdateProject}
              onReorderProjects={handleReorderProjects}
            />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectsView
              projects={projects || []}
              consultants={consultants || []}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          </TabsContent>

          <TabsContent value="consultants" className="mt-6">
            <ConsultantsView
              consultants={consultants || []}
              projects={projects || []}
              onAddConsultant={handleAddConsultant}
              onUpdateConsultant={handleUpdateConsultant}
              onDeleteConsultant={handleDeleteConsultant}
              onUpdateProject={handleUpdateProject}
            />
          </TabsContent>

          <TabsContent value="oppdragsgivere" className="mt-6">
            <OppdragsgivereView
              oppdragsgivere={oppdragsgivere || []}
              projects={projects || []}
              consultants={consultants || []}
              onAddOppdragsgiver={handleAddOppdragsgiver}
              onUpdateOppdragsgiver={handleUpdateOppdragsgiver}
              onDeleteOppdragsgiver={handleDeleteOppdragsgiver}
            />
          </TabsContent>

          <TabsContent value="rapporter" className="mt-6">
            <RapporterView
              projects={projects || []}
              consultants={consultants || []}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}

export default App