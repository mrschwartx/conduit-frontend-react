import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router'
import { toast } from '@/shared/toast/toast-store'
import { endSession } from '../session'

export function LogoutPage() {
  const queryClient = useQueryClient()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    endSession(queryClient)
    toast.success("You've been logged out successfully!")
  }, [queryClient])

  return <Navigate to="/" replace />
}
