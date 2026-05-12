import axios from 'axios'

/**
 * Axios instance configured for the BarberShop POS backend API.
 *
 * Base URL is read from the VITE_API_URL environment variable,
 * falling back to http://localhost:8000/api/v1.
 *
 * @type {import('axios').AxiosInstance}
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor – can be used later to attach auth tokens etc.
 */
api.interceptors.request.use(
  (config) => {
    // You can add an Authorization header here when authentication is implemented
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor – logs errors and normalises error messages.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error(
        `[API Error] ${error.response.status} – ${error.response.config.url}`,
        error.response.data
      )
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API Error] No response received', error.request)
    } else {
      // Something happened in setting up the request
      console.error('[API Error]', error.message)
    }
    return Promise.reject(error)
  }
)

export default api
