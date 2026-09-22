import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { checkSession } from '@/features/auth/authSlice'
import { Spinner } from '@/shared/ui/Spinner'

export function ProtectedRoute() {
  const dispatch = useAppDispatch()
  const { status } = useAppSelector((s) => s.auth)

  useEffect(() => {
    if (status === 'idle') {
      dispatch(checkSession())
    }
  }, [dispatch, status])

  if (status === 'idle' || status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
