import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'
import type { Contract, Payment } from '@/shared/types'

interface ContractsListResponse { contracts: Contract[]; total: number }

export const contractsApi = createApi({
  reducerPath: 'contractsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Contract', 'Payment'],
  endpoints: (builder) => ({
    getContracts: builder.query<ContractsListResponse, { status?: string }>({
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
    deleteContract: builder.mutation<void, number>({
      query: (id) => ({ url: `/contracts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contract'],
    }),
    uploadContractDocument: builder.mutation<{ documentUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const form = new FormData()
        form.append('file', file)
        return { url: `/contracts/${id}/document`, method: 'POST', body: form }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Contract', id }],
    }),
    deleteContractDocument: builder.mutation<void, number>({
      query: (id) => ({ url: `/contracts/${id}/document`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Contract', id }],
    }),
  }),
})

export const {
  useGetContractsQuery,
  useGetContractByIdQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useGetContractPaymentsQuery,
  useDeleteContractMutation,
  useUploadContractDocumentMutation,
  useDeleteContractDocumentMutation,
} = contractsApi
