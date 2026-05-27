export type DataSourceType = 'google_trends' | 'tiktok' | 'vnexpress' | 'manual'

export interface DataSource {
  id: string
  type: DataSourceType
  label: string
  value: string           // keyword or URL
  fetchedContent?: string
  status: 'idle' | 'loading' | 'fetched' | 'error'
  error?: string
}

export interface CoreContent {
  topic: string
  warningSigns: string[]
  causes: string[]
  diagnosticMethods: string[]
  standardTreatments: string[]
  keywords: string[]
  contentAngles: string[]
}
