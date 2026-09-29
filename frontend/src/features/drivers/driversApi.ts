import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'
import type { Driver } from '@/shared/types'

interface DriversListResponse { drivers: Driver[]; total: number }

export const driversApi = createApi({
  reducerPath: 'driversApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Driver'],
  endpoints: (builder) => ({
    getDrivers: builder.query<DriversListResponse, { status?: string; search?: string }>({
      query: (params) => ({ url: '/drivers', params }),
      providesTags: ['Driver'],
    }),
    getDriverById: builder.query<Driver, number>({
      query: (id) => `/drivers/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Driver', id }],
    }),
    createDriver: builder.mutation<Driver, Partial<Driver>>({
      query: (body) => ({ url: '/drivers', method: 'POST', body }),
      invalidatesTags: ['Driver'],
    }),
    updateDriver: builder.mutation<Driver, { id: number } & Partial<Driver>>({
      query: ({ id, ...body }) => ({ url: `/drivers/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Driver', { type: 'Driver', id }],
    }),
  }),
})

export const { useGetDriversQuery, useGetDriverByIdQuery, useCreateDriverMutation, useUpdateDriverMutation } = driversApi
