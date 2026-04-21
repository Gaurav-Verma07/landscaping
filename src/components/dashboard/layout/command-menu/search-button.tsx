"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { CommandMenu } from "./command-menu"

export function SearchButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <Search className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Open command palette</span>
      </Button>
      <CommandMenu open={open} setOpen={setOpen} />
    </>
  )
}

