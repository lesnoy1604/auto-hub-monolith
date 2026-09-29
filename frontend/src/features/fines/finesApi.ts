import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'
import type { Fine } from '@/shared/types'

interface CreateFineDto {
  carId: number
  driverId: number
  contractId?: number
  amount: number
  description: string
  fineDate: string
}

interface FinesListResponse { fines: Fine[]; total: number }

export const finesApi = createApi({
  reducerPath: 'finesApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Fine'],
  endpoints: (builder) => ({
    getFines: builder.query<FinesListResponse, { status?: string }>({
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
