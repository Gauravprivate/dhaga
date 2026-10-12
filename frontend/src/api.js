import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const api = axios.create({ baseURL: BASE_URL })

const isPublic = (url = '') =>
  url.includes('/auth/login/') ||
  url.includes('/auth/register/') ||
  url.includes('/auth/token/refresh/')

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token && !isPublic(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const refresh = localStorage.getItem('refresh')

    if (
      error.response?.status === 401 &&
      refresh &&
      !original._retry &&
      !isPublic(original.url)
    ) {
      original._retry = true
      try {
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
      }
    }
    return Promise.reject(error)
  },
)

export default api