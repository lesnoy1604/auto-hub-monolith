import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CarsPage } from '@/features/cars/CarsPage'
import { CarDetailPage } from '@/features/cars/CarDetailPage'
import { ContractsPage } from '@/features/contracts/ContractsPage'
import { ContractDetailPage } from '@/features/contracts/ContractDetailPage'
import { DriversPage } from '@/features/drivers/DriversPage'
import { DriverDetailPage } from '@/features/drivers/DriverDetailPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { FinesPage } from '@/features/fines/FinesPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/cars', element: <CarsPage /> },
          { path: '/cars/:id', element: <CarDetailPage /> },
          { path: '/contracts', element: <ContractsPage /> },
          { path: '/contracts/:id', element: <ContractDetailPage /> },
          { path: '/drivers', element: <DriversPage /> },
          { path: '/drivers/:id', element: <DriverDetailPage /> },
          { path: '/payments', element: <PaymentsPage /> },
          { path: '/fines', element: <FinesPage /> },
        ],
      },
    ],
  },
])
