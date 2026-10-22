import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  failed: boolean
}

export function ErrorFallback() {
  return (
    <div className="container page" role="alert">
      <p className="error-banner">Something went wrong.</p>
      <p className="status" style={{ textAlign: 'center' }}>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </p>
    </div>
  )
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    return this.state.failed ? <ErrorFallback /> : this.props.children
  }
}
