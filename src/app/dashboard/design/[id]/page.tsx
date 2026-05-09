'use client'

// app/dashboard/design/[id]/page.tsx

import { use } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Fabric.js accesses the DOM on import — must be dynamically loaded with ssr:false
const DesignCanvasEditor = dynamic(
  () =>
    import('@/components/dashboard/design/design-canvas-editor').then(
      (m) => m.DesignCanvasEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

interface Props {
  params: Promise<{ id: string }>
}

export default function DesignEditorPage({ params }: Props) {
  const { id } = use(params)
  return <DesignCanvasEditor designId={id} />
}