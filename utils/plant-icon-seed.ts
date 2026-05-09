// utils/plant-icon-seed.ts
// Place your icon files in a local folder: utils/plant-icons/{common_name}.png
// Run: bun run utils/plant-icon-seed.ts

import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role bypasses RLS
)

const ICONS_DIR = path.join(process.cwd(), 'utils/plant-icons')

async function seedPlantIcons() {
  const files = await readdir(ICONS_DIR)

  for (const file of files) {
    const commonName = path.basename(file, path.extname(file))
    .replace(/[-_]/g, ' ')  // handles both - and _
    .replace(/\b\w/g, c => c.toUpperCase())

    // Find the plant by name
    const { data: plant } = await supabase
      .from('plant_catalog')
      .select('id')
      .ilike('common_name', commonName)
      .single()

    if (!plant) {
      console.log(`⚠️  No match for: ${commonName}`)
      continue
    }

    const buffer = await readFile(path.join(ICONS_DIR, file))
    const ext = path.extname(file).slice(1)
    const storagePath = `plant-icons/${plant.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('design-assets')
      .upload(storagePath, buffer, {
        contentType: ext === 'svg' ? 'image/svg+xml' : `image/${ext}`,
        upsert: true,
      })

    if (uploadError) {
      console.log(`✗ Upload failed for ${commonName}:`, uploadError.message)
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from('design-assets')
      .getPublicUrl(storagePath)

    await supabase
      .from('plant_catalog')
      .update({ icon_url: publicUrl })
      .eq('id', plant.id)

    console.log(`✓ ${commonName}`)
  }

  console.log('Done.')
}

seedPlantIcons().catch(console.error)