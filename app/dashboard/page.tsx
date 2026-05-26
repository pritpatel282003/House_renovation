import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import NewProjectDialog from '@/components/NewProjectDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ImageIcon } from 'lucide-react'
import type { Project } from '@/lib/types'

const statusColors: Record<string, string> = {
  uploaded: 'bg-blue-100 text-blue-700',
  segmented: 'bg-amber-100 text-amber-700',
  designed: 'bg-purple-100 text-purple-700',
  estimated: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <>
      <Navbar />
      <Suspense>
        <NewProjectDialog />
      </Suspense>
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-[#1C2B3A]">
                My Projects
              </h1>
              <p className="mt-1 text-[#1C2B3A]/60">
                Manage your exterior renovation projects
              </p>
            </div>
            <Link href="/dashboard?new=true">
              <Button className="bg-[#C4622D] hover:bg-[#a85225] gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {!projects || projects.length === 0 ? (
            <Card className="border-dashed border-2 border-[#1C2B3A]/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-[#C4622D]/10 flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-[#C4622D]" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#1C2B3A]">
                  No projects yet
                </h3>
                <p className="mt-2 text-sm text-[#1C2B3A]/60 text-center max-w-sm">
                  Upload a photo of your home exterior to start your first renovation project.
                </p>
                <Link href="/dashboard?new=true">
                  <Button className="mt-6 bg-[#C4622D] hover:bg-[#a85225] gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(projects as Project[]).map((project) => (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <Card className="group overflow-hidden border-[#1C2B3A]/5 transition-all hover:shadow-lg hover:border-[#C4622D]/20">
                    <div className="aspect-video bg-[#1C2B3A]/5 relative overflow-hidden">
                      {project.original_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.original_image_url}
                          alt={project.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-[#1C2B3A]/20" />
                        </div>
                      )}
                      <Badge
                        className={`absolute top-3 right-3 ${statusColors[project.status] || ''}`}
                        variant="secondary"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-heading text-lg font-semibold text-[#1C2B3A] truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-[#1C2B3A]/50 mt-1">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
