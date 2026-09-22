import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'
import type { Payment } from '@/shared/types'

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    getPayments: builder.query<Payment[], { status?: string }>({
      query: (params) => ({ url: '/payments', params }),
      providesTags: ['Payment'],
    }),
    markPayment: builder.mutation<Payment, { contractId: number; paymentId: number }>({
      query: (body) => ({ url: '/payments', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
  }),
})

export const { useGetPaymentsQuery, useMarkPaymentMutation } = paymentsApi
