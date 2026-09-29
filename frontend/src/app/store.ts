import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from '@/features/auth/authSlice'
import { carsApi } from '@/features/cars/carsApi'
import { contractsApi } from '@/features/contracts/contractsApi'
import { driversApi } from '@/features/drivers/driversApi'
import { paymentsApi } from '@/features/payments/paymentsApi'
import { finesApi } from '@/features/fines/finesApi'
import { dashboardApi } from '@/features/dashboard/dashboardApi'
import { inspectionsApi } from '@/features/cars/inspectionsApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [carsApi.reducerPath]: carsApi.reducer,
    [contractsApi.reducerPath]: contractsApi.reducer,
    [driversApi.reducerPath]: driversApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
    [finesApi.reducerPath]: finesApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [inspectionsApi.reducerPath]: inspectionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(carsApi.middleware)
      .concat(contractsApi.middleware)
      .concat(driversApi.middleware)
      .concat(paymentsApi.middleware)
      .concat(finesApi.middleware)
      .concat(dashboardApi.middleware)
      .concat(inspectionsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
