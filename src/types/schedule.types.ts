// Types for schedule-related entities

export interface Job {
  id: string;
  title: string;
  client: string;
  clientId: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  crewId?: string;
  crew?: string;
  location: string;
  status: 'new' | 'assigned' | 'en-route' | 'on-site' | 'completed' | 'cancelled';
  weatherRisk: 'low' | 'medium' | 'high';
  ETA?: string; // Estimated time of arrival
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  notes?: string;
  tags?: string[];
  estimatedValue?: number;
  priority: 'low' | 'medium' | 'high';
  attachments?: number; // Count of attachments
}

export interface Crew {
  id: string;
  name: string;
  avatar?: string;
  skills: string[];
  certifications: string[];
  capacity: number; // Max jobs per day
  location: string;
  availability: {
    [key: string]: boolean; // Day of week -> available
  };
  currentJobs: number;
  maxJobs: number;
  status: 'available' | 'busy' | 'off-duty' | 'pto';
  contact: {
    phone: string;
    email: string;
  };
  rating: number; // 1-5
}

export interface Assignment {
  id: string;
  jobId: string;
  crewId: string;
  status: 'assigned' | 'accepted' | 'rejected' | 'completed';
  assignedDate: string;
  assignedBy: string;
  notes?: string;
}

export interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    precipitation: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitationChance: number;
    windSpeed: number;
    humidity: number;
  }>;
  alerts: Array<{
    type: 'wind' | 'hail' | 'rain' | 'snow' | 'temperature';
    severity: 'low' | 'medium' | 'high';
    message: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface WeatherThresholds {
  windSpeed: number; // mph
  precipitation: number; // inches
  hailSize: number; // inches
  temperature: {
    min: number; // °F
    max: number; // °F
  };
}

export interface StormMode {
  active: boolean;
  commissionRate: number; // 10 or 50
  affectedJobs: string[]; // Job IDs
  startTime?: string;
  endTime?: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'list';
  startDate: string;
  endDate?: string;
}

export interface JobFilter {
  status?: string[];
  crewId?: string[];
  weatherRisk?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
}

export interface CrewSuggestion {
  crewId: string;
  score: number; // 0-100
  factors: {
    distance: number; // miles
    availability: boolean;
    skillMatch: number; // 0-100
    workload: number; // current/max jobs ratio
  };
  estimatedETA: string;
}
