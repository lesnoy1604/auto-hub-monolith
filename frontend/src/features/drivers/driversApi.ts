import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Driver } from '@/shared/types'

export const driversApi = createApi({
  reducerPath: 'driversApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Driver'],
  endpoints: (builder) => ({
    getDrivers: builder.query<Driver[], { status?: string; search?: string }>({
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
