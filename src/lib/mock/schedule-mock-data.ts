import { Job, Crew, Assignment, WeatherData, WeatherThresholds, StormMode } from '@/types/schedule.types';

// Mock Jobs Data
export const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Roof Replacement - John Carter',
    client: 'John Carter',
    clientId: 'client-1',
    date: '2023-12-15',
    startTime: '09:00',
    endTime: '17:00',
    crewId: 'crew-1',
    crew: 'Crew Alpha',
    location: '112 Lakeview Dr, Springfield, IL',
    status: 'assigned',
    weatherRisk: 'low',
    ETA: '08:30',
    notes: 'Client requested premium materials',
    tags: ['residential', 'insurance'],
    estimatedValue: 12000,
    priority: 'medium',
    attachments: 3
  },
  {
    id: 'job-2',
    title: 'Roof Repair - Maria Hernandez',
    client: 'Maria Hernandez',
    clientId: 'client-2',
    date: '2023-12-15',
    startTime: '10:00',
    endTime: '14:00',
    crewId: 'crew-2',
    crew: 'Crew Beta',
    location: '51 Westwood Ave, Springfield, IL',
    status: 'en-route',
    weatherRisk: 'medium',
    ETA: '09:45',
    notes: 'Hail damage assessment',
    tags: ['residential', 'urgent'],
    estimatedValue: 3500,
    priority: 'high',
    attachments: 5
  },
  {
    id: 'job-3',
    title: 'Commercial Roof Inspection - Kim Peterson',
    client: 'Kim Peterson',
    clientId: 'client-3',
    date: '2023-12-15',
    startTime: '13:00',
    endTime: '16:00',
    crewId: 'crew-3',
    crew: 'Crew Gamma',
    location: '8 Brookline Ct, Springfield, IL',
    status: 'new',
    weatherRisk: 'low',
    notes: 'Annual inspection for insurance',
    tags: ['commercial', 'inspection'],
    estimatedValue: 800,
    priority: 'low',
    attachments: 1
  },
  {
    id: 'job-4',
    title: 'Emergency Leak Repair - Tyler Mann',
    client: 'Tyler Mann',
    clientId: 'client-4',
    date: '2023-12-14',
    startTime: '14:00',
    endTime: '18:00',
    crewId: 'crew-1',
    crew: 'Crew Alpha',
    location: '993 Hillcrest Way, Springfield, IL',
    status: 'completed',
    weatherRisk: 'high',
    notes: 'Emergency call due to storm damage',
    tags: ['residential', 'emergency'],
    estimatedValue: 2200,
    priority: 'high',
    attachments: 7
  },
  {
    id: 'job-5',
    title: 'Gutter Installation - Sarah Johnson',
    client: 'Sarah Johnson',
    clientId: 'client-5',
    date: '2023-12-16',
    startTime: '08:00',
    endTime: '12:00',
    crewId: 'crew-2',
    crew: 'Crew Beta',
    location: '245 Oak Street, Springfield, IL',
    status: 'assigned',
    weatherRisk: 'medium',
    notes: 'New gutter installation with leaf guards',
    tags: ['residential'],
    estimatedValue: 4500,
    priority: 'medium',
    attachments: 2
  },
  {
    id: 'job-6',
    title: 'Roof Maintenance - Robert Davis',
    client: 'Robert Davis',
    clientId: 'client-6',
    date: '2023-12-16',
    startTime: '09:00',
    endTime: '11:00',
    crewId: 'crew-3',
    crew: 'Crew Gamma',
    location: '777 Pine Street, Springfield, IL',
    status: 'new',
    weatherRisk: 'low',
    notes: 'Quarterly maintenance check',
    tags: ['commercial', 'maintenance'],
    estimatedValue: 600,
    priority: 'low',
    attachments: 0,
    recurring: {
      pattern: 'monthly',
      interval: 3
    }
  },
  {
    id: 'job-7',
    title: 'Skylight Installation - Jennifer Wilson',
    client: 'Jennifer Wilson',
    clientId: 'client-7',
    date: '2023-12-17',
    startTime: '10:00',
    endTime: '15:00',
    crewId: 'crew-1',
    crew: 'Crew Alpha',
    location: '123 Maple Avenue, Springfield, IL',
    status: 'assigned',
    weatherRisk: 'low',
    notes: 'Install 3 skylights in living room',
    tags: ['residential'],
    estimatedValue: 3500,
    priority: 'medium',
    attachments: 4
  }
];

// Mock Crews Data
export const mockCrews: Crew[] = [
  {
    id: 'crew-1',
    name: 'Crew Alpha',
    avatar: '/avatars/crew-alpha.jpg',
    skills: ['Roofing', 'Gutters', 'Skylights', 'Emergency Repair'],
    certifications: ['OSHA 10', 'Roofing Contractor License', 'Fall Protection'],
    capacity: 2,
    location: 'Downtown Springfield',
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    currentJobs: 2,
    maxJobs: 2,
    status: 'busy',
    contact: {
      phone: '(555) 123-4567',
      email: 'crew-alpha@landscaping.app'
    },
    rating: 4.8
  },
  {
    id: 'crew-2',
    name: 'Crew Beta',
    avatar: '/avatars/crew-beta.jpg',
    skills: ['Roofing', 'Siding', 'Windows', 'Gutters'],
    certifications: ['OSHA 30', 'General Contractor License'],
    capacity: 3,
    location: 'West Springfield',
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false
    },
    currentJobs: 1,
    maxJobs: 3,
    status: 'available',
    contact: {
      phone: '(555) 234-5678',
      email: 'crew-beta@landscaping.app'
    },
    rating: 4.6
  },
  {
    id: 'crew-3',
    name: 'Crew Gamma',
    avatar: '/avatars/crew-gamma.jpg',
    skills: ['Commercial Roofing', 'Inspections', 'Maintenance', 'Metal Roofing'],
    certifications: ['Commercial Roofing Certification', 'Inspector License'],
    capacity: 2,
    location: 'East Springfield',
    availability: {
      monday: true,
      tuesday: true,
      wednesday: false,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    currentJobs: 1,
    maxJobs: 2,
    status: 'available',
    contact: {
      phone: '(555) 345-6789',
      email: 'crew-gamma@landscaping.app'
    },
    rating: 4.9
  },
  {
    id: 'crew-4',
    name: 'Crew Delta',
    avatar: '/avatars/crew-delta.jpg',
    skills: ['Emergency Repair', 'Storm Damage', 'Insurance Claims'],
    certifications: ['Storm Damage Specialist', 'Insurance Adjuster Certification'],
    capacity: 3,
    location: 'North Springfield',
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    currentJobs: 0,
    maxJobs: 3,
    status: 'available',
    contact: {
      phone: '(555) 456-7890',
      email: 'crew-delta@landscaping.app'
    },
    rating: 4.7
  },
  {
    id: 'crew-5',
    name: 'Crew Epsilon',
    avatar: '/avatars/crew-epsilon.jpg',
    skills: ['Residential Roofing', 'Tile Roofing', 'Historic Restoration'],
    certifications: ['Historic Restoration Certification', 'Tile Roofing Specialist'],
    capacity: 1,
    location: 'South Springfield',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    currentJobs: 0,
    maxJobs: 1,
    status: 'pto',
    contact: {
      phone: '(555) 567-8901',
      email: 'crew-epsilon@landscaping.app'
    },
    rating: 4.9
  }
];

// Mock Assignments Data
export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    jobId: 'job-1',
    crewId: 'crew-1',
    status: 'assigned',
    assignedDate: '2023-12-10',
    assignedBy: 'manager-1',
    notes: 'Client requested this specific crew'
  },
  {
    id: 'assign-2',
    jobId: 'job-2',
    crewId: 'crew-2',
    status: 'accepted',
    assignedDate: '2023-12-12',
    assignedBy: 'manager-1',
    notes: 'Urgent job - priority assignment'
  },
  {
    id: 'assign-3',
    jobId: 'job-3',
    crewId: 'crew-3',
    status: 'assigned',
    assignedDate: '2023-12-13',
    assignedBy: 'manager-2',
    notes: 'Commercial inspection requires certified crew'
  },
  {
    id: 'assign-4',
    jobId: 'job-4',
    crewId: 'crew-1',
    status: 'completed',
    assignedDate: '2023-12-13',
    assignedBy: 'manager-1',
    notes: 'Emergency assignment'
  },
  {
    id: 'assign-5',
    jobId: 'job-5',
    crewId: 'crew-2',
    status: 'assigned',
    assignedDate: '2023-12-14',
    assignedBy: 'manager-2',
    notes: 'Gutter installation requires specific tools'
  }
];

// Mock Weather Data
export const mockWeatherData: WeatherData = {
  location: 'Springfield, IL',
  current: {
    temperature: 72,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 8,
    windDirection: 'NW',
    precipitation: 0
  },
  forecast: [
    {
      date: '2023-12-14',
      high: 75,
      low: 58,
      condition: 'Partly Cloudy',
      precipitationChance: 20,
      windSpeed: 10,
      humidity: 60
    },
    {
      date: '2023-12-15',
      high: 73,
      low: 55,
      condition: 'Mostly Sunny',
      precipitationChance: 10,
      windSpeed: 8,
      humidity: 55
    },
    {
      date: '2023-12-16',
      high: 68,
      low: 52,
      condition: 'Cloudy',
      precipitationChance: 40,
      windSpeed: 12,
      humidity: 70
    },
    {
      date: '2023-12-17',
      high: 65,
      low: 48,
      condition: 'Showers',
      precipitationChance: 70,
      windSpeed: 15,
      humidity: 80
    },
    {
      date: '2023-12-18',
      high: 62,
      low: 45,
      condition: 'Thunderstorms',
      precipitationChance: 80,
      windSpeed: 20,
      humidity: 85
    },
    {
      date: '2023-12-19',
      high: 70,
      low: 50,
      condition: 'Partly Cloudy',
      precipitationChance: 30,
      windSpeed: 10,
      humidity: 65
    },
    {
      date: '2023-12-20',
      high: 72,
      low: 54,
      condition: 'Mostly Sunny',
      precipitationChance: 15,
      windSpeed: 7,
      humidity: 60
    }
  ],
  alerts: [
    {
      type: 'wind',
      severity: 'medium',
      message: 'Gusty winds expected on Dec 18',
      startTime: '2023-12-18T10:00:00Z',
      endTime: '2023-12-18T18:00:00Z'
    },
    {
      type: 'rain',
      severity: 'high',
      message: 'Heavy rainfall expected on Dec 17-18',
      startTime: '2023-12-17T12:00:00Z',
      endTime: '2023-12-18T12:00:00Z'
    }
  ]
};

// Mock Weather Thresholds
export const mockWeatherThresholds: WeatherThresholds = {
  windSpeed: 25, // mph
  precipitation: 0.5, // inches
  hailSize: 0.75, // inches
  temperature: {
    min: 20, // °F
    max: 95 // °F
  }
};

// Mock Storm Mode
export const mockStormMode: StormMode = {
  active: false,
  commissionRate: 10,
  affectedJobs: [],
  startTime: undefined,
  endTime: undefined
};
