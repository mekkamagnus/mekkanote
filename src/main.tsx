/**
 * Application Entry Point
 * Bootstrap the React application with proper error boundaries
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles/main.css'

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-base-100">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 mx-auto mb-4 text-error">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-base-content mb-2">
              Something went wrong
            </h1>
            <p className="text-base-content/70 mb-4">
              The application encountered an unexpected error.
            </p>
            {this.state.error && (
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm font-medium text-base-content/80 mb-2">
                  Error details
                </summary>
                <pre className="text-xs bg-base-200 p-3 rounded overflow-x-auto">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </details>
            )}
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Service Worker Registration (for PWA functionality)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Bootstrap the application
function bootstrap() {
  const container = document.getElementById('root')
  
  if (!container) {
    throw new Error('Root container not found')
  }

  const root = createRoot(container)

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
}

// Initialize application
try {
  bootstrap()
} catch (error) {
  console.error('Failed to bootstrap application:', error)
  
  // Fallback error display
  const container = document.getElementById('root')
  if (container) {
    container.innerHTML = `
      <div class="h-screen flex items-center justify-center bg-red-50">
        <div class="text-center max-w-md mx-auto p-6">
          <h1 class="text-2xl font-bold text-red-800 mb-2">
            Failed to start application
          </h1>
          <p class="text-red-600 mb-4">
            ${error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onclick="window.location.reload()"
          >
            Reload Page
          </button>
        </div>
      </div>
    `
  }
}