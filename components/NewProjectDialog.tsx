'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ImageUploader from '@/components/ImageUploader'

export default function NewProjectDialog() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get('new') === 'true'

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">New Renovation Project</DialogTitle>
        </DialogHeader>
        <ImageUploader />
      </DialogContent>
    </Dialog>
  )
}
