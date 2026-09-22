import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'
import type { Contract, Payment } from '@/shared/types'

export const contractsApi = createApi({
  reducerPath: 'contractsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Contract', 'Payment'],
  endpoints: (builder) => ({
    getContracts: builder.query<Contract[], { status?: string }>({
      query: (params) => ({ url: '/contracts', params }),
      providesTags: ['Contract'],
    }),
    getContractById: builder.query<Contract, number>({
      query: (id) => `/contracts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Contract', id }],
    }),
    createContract: builder.mutation<Contract, Partial<Contract>>({
      query: (body) => ({ url: '/contracts', method: 'POST', body }),
      invalidatesTags: ['Contract'],
    }),
    updateContract: builder.mutation<Contract, { id: number } & Partial<Contract>>({
      query: ({ id, ...body }) => ({ url: `/contracts/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Contract', { type: 'Contract', id }],
    }),
    getContractPayments: builder.query<Payment[], number>({
      query: (id) => `/contracts/${id}/payments`,
      providesTags: ['Payment'],
    }),
  }),
})

export const {
  useGetContractsQuery,
  useGetContractByIdQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useGetContractPaymentsQuery,
} = contractsApi
