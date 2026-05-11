import type { AITool } from '../provider.interface'

export const designTools: AITool[] = [
  {
    name: 'get_designs',
    description:
      'Get all landscape designs. Optionally filter by customer or project. Returns name, status, customer, area, and ID for each design.',
    parameters: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'Filter designs by customer ID',
        },
        project_id: {
          type: 'string',
          description: 'Filter designs by project ID',
        },
        limit: {
          type: 'number',
          description: 'Max number of results (default 10)',
        },
      },
    },
  },
  {
    name: 'get_design',
    description:
      'Get full details for a specific landscape design including zones, plants, and canvas state.',
    parameters: {
      type: 'object',
      properties: {
        design_id: {
          type: 'string',
          description: 'The design ID',
        },
      },
      required: ['design_id'],
    },
  },
  {
    name: 'suggest_plants',
    description:
      'Suggest plants from the catalog based on zone conditions. Returns up to 8 matching plants with their IDs.',
    parameters: {
      type: 'object',
      properties: {
        zone_description: {
          type: 'string',
          description:
            'Description of the zone, e.g. "front bed, full sun, low water, zone 6b"',
        },
        plant_type: {
          type: 'string',
          description: 'Optional plant type filter',
          enum: [
            'tree',
            'shrub',
            'perennial',
            'annual',
            'groundcover',
            'grass',
            'vine',
            'succulent',
            'fern',
            'bulb',
          ],
        },
        sun_requirement: {
          type: 'string',
          description: 'Sun exposure filter',
          enum: ['full_sun', 'part_shade', 'full_shade'],
        },
        water_need: {
          type: 'string',
          description: 'Water need filter',
          enum: ['low', 'medium', 'high'],
        },
        limit: {
          type: 'number',
          description: 'Max number of suggestions (default 8)',
        },
      },
      required: ['zone_description'],
    },
  },
  {
    name: 'get_design_materials_list',
    description:
      'Compute the materials list for a design based on zone areas and plant counts. Returns quantities and estimated costs.',
    parameters: {
      type: 'object',
      properties: {
        design_id: {
          type: 'string',
          description: 'The design ID to compute materials for',
        },
      },
      required: ['design_id'],
    },
  },
  {
    name: 'create_design',
    description:
      'Create a new landscape design draft for a customer. Returns the new design ID.',
    parameters: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'Customer ID to link this design to',
        },
        name: {
          type: 'string',
          description: 'Name for the design, e.g. "Front Yard Refresh"',
        },
        project_id: {
          type: 'string',
          description: 'Optional project ID to link this design to',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the design goals',
        },
      },
      required: ['customer_id', 'name'],
    },
  },
  {
    name: 'design_to_quote',
    description:
      'Convert a landscape design into a quote draft. Computes the materials list and creates a draft quote in Module G linked to the same customer.',
    parameters: {
      type: 'object',
      properties: {
        design_id: {
          type: 'string',
          description: 'The design ID to convert to a quote',
        },
      },
      required: ['design_id'],
    },
  },
]