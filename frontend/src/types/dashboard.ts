export interface KpiConfig {
  label: string
  value: string | number
  color: 'blue' | 'green' | 'red' | 'teal' | 'purple'
}

export interface ChartConfig {
  title: string
  chartType: 'pie' | 'line' | 'bar'
  echartsOption: object
}

export interface Widget {
  id: string
  type: 'kpi' | 'chart'
  position: number
  config: KpiConfig | ChartConfig
}

export interface DashboardConfig {
  version: number
  title: string
  widgets: Widget[]
}

export interface DashboardOut {
  id: string
  title: string
  slug: string | null
  is_published: boolean
  config: DashboardConfig
  report_id: string
  created_at: string
  updated_at: string
}

export interface DashboardListItem {
  id: string
  title: string
  slug: string | null
  is_published: boolean
  created_at: string
}

export interface ReportStatus {
  id: string
  status: 'pending' | 'processing' | 'done' | 'error'
  dashboard_id?: string
  original_filename: string
  created_at: string
}

export interface PublishResponse {
  slug: string
  public_url: string
}
