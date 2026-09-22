import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Fine } from '@/shared/types'

interface CreateFineDto {
  carId: number
  driverId: number
  contractId?: number
  amount: number
  description: string
  fineDate: string
}

export const finesApi = createApi({
  reducerPath: 'finesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Fine'],
  endpoints: (builder) => ({
    getFines: builder.query<Fine[], { status?: string }>({
      query: (params) => ({ url: '/fines', params }),
      providesTags: ['Fine'],
    }),
    createFine: builder.mutation<Fine, CreateFineDto>({
      query: (body) => ({ url: '/fines', method: 'POST', body }),
      invalidatesTags: ['Fine'],
    }),
    updateFine: builder.mutation<Fine, { id: number; status: string }>({
      query: ({ id, ...body }) => ({ url: `/fines/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Fine'],
    }),
  }),
})

export const { useGetFinesQuery, useCreateFineMutation, useUpdateFineMutation } = finesApi
