import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, ArrowLeft, CheckCircle2 } from 'lucide-react'
import type { Project } from '@/lib/types'

export default async function ResultPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!data) redirect('/dashboard')

  const project = data as Project

  return (
    <>
      <Navbar />
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#1C2B3A]">
                  {project.title}
                </h1>
                <Badge className="bg-green-100 text-green-700 mt-1">{project.status}</Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              {project.report_storage_path && (
                <a href={`/api/report/download?projectId=${projectId}`} target="_blank">
                  <Button className="bg-[#C4622D] hover:bg-[#a85225]">
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Before/After */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Original</CardTitle>
              </CardHeader>
              <CardContent>
                {project.original_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.original_image_url}
                    alt="Original"
                    className="w-full rounded-lg"
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Redesigned</CardTitle>
              </CardHeader>
              <CardContent>
                {project.redesigned_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.redesigned_image_url}
                    alt="Redesigned"
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="aspect-video bg-[#1C2B3A]/5 rounded-lg flex items-center justify-center text-[#1C2B3A]/30">
                    No redesign generated
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cost Summary */}
          {project.cost_data && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Cost Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-[#FAFAF8]">
                    <p className="text-sm text-[#1C2B3A]/50">Material Cost</p>
                    <p className="text-xl font-bold font-heading mt-1">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(project.cost_data.subtotal_material)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#FAFAF8]">
                    <p className="text-sm text-[#1C2B3A]/50">Labor Cost</p>
                    <p className="text-xl font-bold font-heading mt-1">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(project.cost_data.subtotal_labor)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#C4622D]/10">
                    <p className="text-sm text-[#C4622D]">Grand Total</p>
                    <p className="text-xl font-bold font-heading mt-1 text-[#C4622D]">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(project.cost_data.grand_total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
