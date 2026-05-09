// utils/plant-catalog-seed.ts
// Run once to seed the global plant catalog in Supabase.
// Execute via: bun run utils/plant-catalog-seed.ts
// Or import seedPlantCatalog() in a one-time migration route.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const PLANT_SEED_DATA = [
  // ─── TREES ────────────────────────────────────────────────────────────────
  { common_name: 'Red Maple', botanical_name: 'Acer rubrum', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 40, mature_spread_ft: 30, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Sugar Maple', botanical_name: 'Acer saccharum', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 75, mature_spread_ft: 50, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Silver Maple', botanical_name: 'Acer saccharinum', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 60, mature_spread_ft: 45, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'River Birch', botanical_name: 'Betula nigra', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 40, mature_spread_ft: 30, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'White Birch', botanical_name: 'Betula papyrifera', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 50, mature_spread_ft: 25, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a'] },
  { common_name: 'Bald Cypress', botanical_name: 'Taxodium distichum', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'high', mature_height_ft: 70, mature_spread_ft: 25, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a'] },
  { common_name: 'Eastern Red Cedar', botanical_name: 'Juniperus virginiana', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 40, mature_spread_ft: 15, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Tulip Poplar', botanical_name: 'Liriodendron tulipifera', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 90, mature_spread_ft: 35, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'White Oak', botanical_name: 'Quercus alba', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 80, mature_spread_ft: 80, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Pin Oak', botanical_name: 'Quercus palustris', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 60, mature_spread_ft: 40, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Weeping Willow', botanical_name: 'Salix babylonica', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'high', mature_height_ft: 35, mature_spread_ft: 35, hardiness_zones: ['6a','6b','7a','7b','8a','8b','9a','9b'] },
  { common_name: 'Crape Myrtle', botanical_name: 'Lagerstroemia indica', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 20, mature_spread_ft: 15, hardiness_zones: ['6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Japanese Maple', botanical_name: 'Acer palmatum', plant_type: 'tree', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 20, mature_spread_ft: 20, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b'] },
  { common_name: 'Dogwood', botanical_name: 'Cornus florida', plant_type: 'tree', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 25, mature_spread_ft: 25, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Redbud', botanical_name: 'Cercis canadensis', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 20, mature_spread_ft: 25, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Serviceberry', botanical_name: 'Amelanchier canadensis', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 20, mature_spread_ft: 15, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Crabapple', botanical_name: 'Malus spp.', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 20, mature_spread_ft: 20, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'American Sweetgum', botanical_name: 'Liquidambar styraciflua', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 60, mature_spread_ft: 40, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'] },
  { common_name: 'Loblolly Pine', botanical_name: 'Pinus taeda', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 80, mature_spread_ft: 30, hardiness_zones: ['6a','6b','7a','7b','8a','8b','9a','9b'] },
  { common_name: 'Colorado Blue Spruce', botanical_name: 'Picea pungens', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 50, mature_spread_ft: 20, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'White Spruce', botanical_name: 'Picea glauca', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 60, mature_spread_ft: 15, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a'] },
  { common_name: 'Dawn Redwood', botanical_name: 'Metasequoia glyptostroboides', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 70, mature_spread_ft: 25, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b'] },
  { common_name: 'American Elm', botanical_name: 'Ulmus americana', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 80, mature_spread_ft: 80, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Ginkgo', botanical_name: 'Ginkgo biloba', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 50, mature_spread_ft: 30, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Magnolia', botanical_name: 'Magnolia grandiflora', plant_type: 'tree', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 60, mature_spread_ft: 35, hardiness_zones: ['6a','6b','7a','7b','8a','8b','9a','9b','10a'] },

  // ─── SHRUBS ───────────────────────────────────────────────────────────────
  { common_name: 'Boxwood', botanical_name: 'Buxus sempervirens', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'American Holly', botanical_name: 'Ilex opaca', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 15, mature_spread_ft: 10, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Inkberry Holly', botanical_name: 'Ilex glabra', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 6, mature_spread_ft: 6, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Winterberry Holly', botanical_name: 'Ilex verticillata', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'high', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Mountain Laurel', botanical_name: 'Kalmia latifolia', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Rhododendron', botanical_name: 'Rhododendron spp.', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Azalea', botanical_name: 'Rhododendron spp. (Azalea)', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 5, mature_spread_ft: 5, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Forsythia', botanical_name: 'Forsythia x intermedia', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Lilac', botanical_name: 'Syringa vulgaris', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 12, mature_spread_ft: 10, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a'] },
  { common_name: 'Viburnum', botanical_name: 'Viburnum spp.', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Spirea', botanical_name: 'Spiraea japonica', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 4, mature_spread_ft: 4, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Weigela', botanical_name: 'Weigela florida', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 6, mature_spread_ft: 6, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Rose of Sharon', botanical_name: 'Hibiscus syriacus', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 10, mature_spread_ft: 6, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Burning Bush', botanical_name: 'Euonymus alatus', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Yew', botanical_name: 'Taxus x media', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 12, mature_spread_ft: 10, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a'] },
  { common_name: 'Arborvitae', botanical_name: 'Thuja occidentalis', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 20, mature_spread_ft: 5, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Juniper', botanical_name: 'Juniperus horizontalis', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 8, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Nandina', botanical_name: 'Nandina domestica', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 6, mature_spread_ft: 4, hardiness_zones: ['6a','6b','7a','7b','8a','8b','9a','9b','10a'] },
  { common_name: 'Butterfly Bush', botanical_name: 'Buddleja davidii', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 6, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Knock Out Rose', botanical_name: 'Rosa Radrazz', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 4, mature_spread_ft: 4, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Panicle Hydrangea', botanical_name: 'Hydrangea paniculata', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 6, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Bigleaf Hydrangea', botanical_name: 'Hydrangea macrophylla', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 5, mature_spread_ft: 5, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Smooth Hydrangea', botanical_name: 'Hydrangea arborescens', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 5, mature_spread_ft: 5, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Oakleaf Hydrangea', botanical_name: 'Hydrangea quercifolia', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 6, mature_spread_ft: 6, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Pieris', botanical_name: 'Pieris japonica', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 6, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Bayberry', botanical_name: 'Morella pensylvanica', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a'] },
  { common_name: 'Ninebark', botanical_name: 'Physocarpus opulifolius', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 8, mature_spread_ft: 8, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b'] },
  { common_name: 'Witch Hazel', botanical_name: 'Hamamelis virginiana', plant_type: 'shrub', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 12, mature_spread_ft: 12, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Potentilla', botanical_name: 'Potentilla fruticosa', plant_type: 'shrub', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 4, mature_spread_ft: 4, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a'] },

  // ─── PERENNIALS ───────────────────────────────────────────────────────────
  { common_name: 'Coneflower', botanical_name: 'Echinacea purpurea', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 3, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Black-eyed Susan', botanical_name: 'Rudbeckia fulgida', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 3, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Daylily', botanical_name: 'Hemerocallis spp.', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 3, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Hosta', botanical_name: 'Hosta spp.', plant_type: 'perennial', sun_requirement: 'full_shade', water_need: 'medium', mature_height_ft: 2, mature_spread_ft: 3, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Salvia', botanical_name: 'Salvia nemorosa', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 1, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Lavender', botanical_name: 'Lavandula angustifolia', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 2, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Catmint', botanical_name: 'Nepeta x faassenii', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Russian Sage', botanical_name: 'Perovskia atriplicifolia', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 4, mature_spread_ft: 3, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Coreopsis', botanical_name: 'Coreopsis verticillata', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Astilbe', botanical_name: 'Astilbe spp.', plant_type: 'perennial', sun_requirement: 'part_shade', water_need: 'high', mature_height_ft: 3, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Phlox', botanical_name: 'Phlox paniculata', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 3, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Sedum', botanical_name: 'Sedum spectabile', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Liatris', botanical_name: 'Liatris spicata', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 3, mature_spread_ft: 1, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Yarrow', botanical_name: 'Achillea millefolium', plant_type: 'perennial', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Coral Bells', botanical_name: 'Heuchera spp.', plant_type: 'perennial', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Karl Foerster Grass', botanical_name: 'Calamagrostis x acutiflora', plant_type: 'grass', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 5, mature_spread_ft: 2, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Fountain Grass', botanical_name: 'Pennisetum alopecuroides', plant_type: 'grass', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 3, mature_spread_ft: 3, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Blue Oat Grass', botanical_name: 'Helictotrichon sempervirens', plant_type: 'grass', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 3, mature_spread_ft: 2, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Maiden Grass', botanical_name: 'Miscanthus sinensis', plant_type: 'grass', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 6, mature_spread_ft: 4, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Blue Fescue', botanical_name: 'Festuca glauca', plant_type: 'grass', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Switchgrass', botanical_name: 'Panicum virgatum', plant_type: 'grass', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 5, mature_spread_ft: 3, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Little Bluestem', botanical_name: 'Schizachyrium scoparium', plant_type: 'grass', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 3, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },

  // ─── GROUNDCOVERS ────────────────────────────────────────────────────────
  { common_name: 'Pachysandra', botanical_name: 'Pachysandra terminalis', plant_type: 'groundcover', sun_requirement: 'full_shade', water_need: 'medium', mature_height_ft: 0.5, mature_spread_ft: 1, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Liriope', botanical_name: 'Liriope muscari', plant_type: 'groundcover', sun_requirement: 'part_shade', water_need: 'low', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a'] },
  { common_name: 'Creeping Phlox', botanical_name: 'Phlox subulata', plant_type: 'groundcover', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 0.5, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Vinca', botanical_name: 'Vinca minor', plant_type: 'groundcover', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 0.5, mature_spread_ft: 2, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'English Ivy', botanical_name: 'Hedera helix', plant_type: 'groundcover', sun_requirement: 'full_shade', water_need: 'medium', mature_height_ft: 0.3, mature_spread_ft: 3, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Ajuga', botanical_name: 'Ajuga reptans', plant_type: 'groundcover', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 0.5, mature_spread_ft: 1, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Creeping Jenny', botanical_name: 'Lysimachia nummularia', plant_type: 'groundcover', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 0.3, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Stonecrop Sedum', botanical_name: 'Sedum acre', plant_type: 'groundcover', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 0.2, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Wild Ginger', botanical_name: 'Asarum canadense', plant_type: 'groundcover', sun_requirement: 'full_shade', water_need: 'medium', mature_height_ft: 0.5, mature_spread_ft: 1, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Sweet Woodruff', botanical_name: 'Galium odoratum', plant_type: 'groundcover', sun_requirement: 'full_shade', water_need: 'medium', mature_height_ft: 0.5, mature_spread_ft: 1, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a'] },

  // ─── ANNUALS ──────────────────────────────────────────────────────────────
  { common_name: 'Marigold', botanical_name: 'Tagetes spp.', plant_type: 'annual', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'] },
  { common_name: 'Petunia', botanical_name: 'Petunia x hybrida', plant_type: 'annual', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Impatiens', botanical_name: 'Impatiens walleriana', plant_type: 'annual', sun_requirement: 'full_shade', water_need: 'high', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Zinnia', botanical_name: 'Zinnia elegans', plant_type: 'annual', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 2, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Begonia', botanical_name: 'Begonia x semperflorens', plant_type: 'annual', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Coleus', botanical_name: 'Plectranthus scutellarioides', plant_type: 'annual', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Million Bells', botanical_name: 'Calibrachoa spp.', plant_type: 'annual', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 0.5, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Pansy', botanical_name: 'Viola x wittrockiana', plant_type: 'annual', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 0.5, mature_spread_ft: 0.5, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Snapdragon', botanical_name: 'Antirrhinum majus', plant_type: 'annual', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 2, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },
  { common_name: 'Dusty Miller', botanical_name: 'Senecio cineraria', plant_type: 'annual', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 1, mature_spread_ft: 1, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'] },

  // ─── VINES ────────────────────────────────────────────────────────────────
  { common_name: 'Wisteria', botanical_name: 'Wisteria frutescens', plant_type: 'vine', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 30, mature_spread_ft: 15, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Climbing Hydrangea', botanical_name: 'Hydrangea anomala petiolaris', plant_type: 'vine', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 60, mature_spread_ft: 5, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Trumpet Vine', botanical_name: 'Campsis radicans', plant_type: 'vine', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 30, mature_spread_ft: 10, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Virginia Creeper', botanical_name: 'Parthenocissus quinquefolia', plant_type: 'vine', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 50, mature_spread_ft: 10, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Clematis', botanical_name: 'Clematis spp.', plant_type: 'vine', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 15, mature_spread_ft: 5, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Honeysuckle Vine', botanical_name: 'Lonicera sempervirens', plant_type: 'vine', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 15, mature_spread_ft: 6, hardiness_zones: ['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },

  // ─── FERNS ────────────────────────────────────────────────────────────────
  { common_name: 'Ostrich Fern', botanical_name: 'Matteuccia struthiopteris', plant_type: 'fern', sun_requirement: 'part_shade', water_need: 'high', mature_height_ft: 4, mature_spread_ft: 3, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Autumn Fern', botanical_name: 'Dryopteris erythrosora', plant_type: 'fern', sun_requirement: 'part_shade', water_need: 'medium', mature_height_ft: 2, mature_spread_ft: 2, hardiness_zones: ['5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Christmas Fern', botanical_name: 'Polystichum acrostichoides', plant_type: 'fern', sun_requirement: 'full_shade', water_need: 'medium', mature_height_ft: 2, mature_spread_ft: 2, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Royal Fern', botanical_name: 'Osmunda regalis', plant_type: 'fern', sun_requirement: 'part_shade', water_need: 'high', mature_height_ft: 5, mature_spread_ft: 4, hardiness_zones: ['2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a'] },

  // ─── BULBS ────────────────────────────────────────────────────────────────
  { common_name: 'Tulip', botanical_name: 'Tulipa spp.', plant_type: 'bulb', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 1, mature_spread_ft: 0.3, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Daffodil', botanical_name: 'Narcissus spp.', plant_type: 'bulb', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 1.5, mature_spread_ft: 0.5, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
  { common_name: 'Allium', botanical_name: 'Allium spp.', plant_type: 'bulb', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 2, mature_spread_ft: 0.5, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a'] },
  { common_name: 'Canna Lily', botanical_name: 'Canna spp.', plant_type: 'bulb', sun_requirement: 'full_sun', water_need: 'high', mature_height_ft: 6, mature_spread_ft: 2, hardiness_zones: ['7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'] },
  { common_name: 'Dahlia', botanical_name: 'Dahlia spp.', plant_type: 'bulb', sun_requirement: 'full_sun', water_need: 'medium', mature_height_ft: 4, mature_spread_ft: 2, hardiness_zones: ['7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'] },
  { common_name: 'Iris', botanical_name: 'Iris germanica', plant_type: 'bulb', sun_requirement: 'full_sun', water_need: 'low', mature_height_ft: 3, mature_spread_ft: 1, hardiness_zones: ['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a'] },
]

export async function seedPlantCatalog() {
  console.log(`Seeding ${PLANT_SEED_DATA.length} plants...`)

  const rows = PLANT_SEED_DATA.map((p) => ({
    ...p,
    org_id: null,      // null = global / available to all orgs
    profile_id: null,  // null = system seed
    icon_url: null,    // to be uploaded later
    thumbnail_url: null,
    notes: '',
  }))

  // Upsert on common_name+botanical_name to be idempotent
  const { error } = await supabase
    .from('plant_catalog')
    .upsert(rows, { onConflict: 'common_name,botanical_name', ignoreDuplicates: true })

  if (error) {
    console.error('Seed error:', error.message)
    return { error: error.message }
  }

  console.log('Plant catalog seeded successfully.')
  return { success: true, count: rows.length }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPlantCatalog()
    .then((r) => console.log(r))
    .catch(console.error)
}