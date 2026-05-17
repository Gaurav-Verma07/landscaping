"use client"

import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"

import { PendingForm } from "@/components/auth/pending-form"

export default function PendingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-xs flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex aspect-square size-9 items-center justify-center rounded-md border bg-transparent">
              <Image
                src="/landscraping_logo.png"
                alt="Landscaping"
                width={36}
                height={36}
                className="size-7 object-contain"
                priority
              />
            </div>
            Landscaping
          </Link>
          <PendingForm />
        </div>
      </div>
    </Suspense>
  )
}

