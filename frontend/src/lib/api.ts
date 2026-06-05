import axios from 'axios'
import { getToken, clearToken } from '@/lib/auth'
import type { TokenResponse } from '@/types/api'
import type {
  ReportStatus,
  DashboardListItem,
  DashboardOut,
  DashboardConfig,
  PublishResponse,
} from '@/types/dashboard'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401
    ) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  async register(email: string, password: string): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/register', {
      email,
      password,
    })
    return res.data
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/login', {
      email,
      password,
    })
    return res.data
  },
}

// Reports API
export const reportsApi = {
  async upload(
    file: File,
    onProgress: (pct: number) => void
  ): Promise<{ report_id: string; status: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<{ report_id: string; status: string }>(
      '/reports/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(pct)
          }
        },
      }
    )
    return res.data
  },

  async get(id: string): Promise<ReportStatus> {
    const res = await apiClient.get<ReportStatus>(`/reports/${id}`)
    return res.data
  },

  async list(): Promise<ReportStatus[]> {
    const res = await apiClient.get<ReportStatus[]>('/reports')
    return res.data
  },
}

// Dashboards API
export const dashboardsApi = {
  async list(): Promise<DashboardListItem[]> {
    const res = await apiClient.get<DashboardListItem[]>('/dashboards')
    return res.data
  },

  async get(id: string): Promise<DashboardOut> {
    const res = await apiClient.get<DashboardOut>(`/dashboards/${id}`)
    return res.data
  },

  async update(
    id: string,
    data: { title?: string; config?: DashboardConfig }
  ): Promise<DashboardOut> {
    const res = await apiClient.put<DashboardOut>(`/dashboards/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/dashboards/${id}`)
  },

  async publish(id: string): Promise<PublishResponse> {
    const res = await apiClient.post<PublishResponse>(
      `/dashboards/${id}/publish`
    )
    return res.data
  },

  async unpublish(id: string): Promise<void> {
    await apiClient.delete(`/dashboards/${id}/publish`)
  },

  async getPublic(slug: string): Promise<DashboardOut> {
    const res = await apiClient.get<DashboardOut>(`/d/${slug}`)
    return res.data
  },
}

export default apiClient
