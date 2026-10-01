import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'

export type DriverDocType = 'passport' | 'license' | 'contract' | 'photo' | 'other'

export interface DriverDocument {
  id: number
  driverId: number
  docType: DriverDocType
  title: string
  filename: string
  url: string
  createdAt: string
}

export const driverDocumentsApi = createApi({
  reducerPath: 'driverDocumentsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['DriverDocument'],
  endpoints: (builder) => ({
    getDriverDocuments: builder.query<DriverDocument[], number>({
      query: (driverId) => `/drivers/${driverId}/documents`,
      providesTags: (_r, _e, driverId) => [{ type: 'DriverDocument', id: driverId }],
    }),
    uploadDriverDocument: builder.mutation<DriverDocument, { driverId: number; docType: DriverDocType; title: string; file: File }>({
      query: ({ driverId, docType, title, file }) => {
        const form = new FormData()
        form.append('docType', docType)
        form.append('title', title)
        form.append('file', file)
        return { url: `/drivers/${driverId}/documents`, method: 'POST', body: form }
      },
      invalidatesTags: (_r, _e, { driverId }) => [{ type: 'DriverDocument', id: driverId }],
    }),
    deleteDriverDocument: builder.mutation<void, { id: number; driverId: number }>({
      query: ({ id }) => ({ url: `/driver-documents/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { driverId }) => [{ type: 'DriverDocument', id: driverId }],
    }),
  }),
})

export const {
  useGetDriverDocumentsQuery,
  useUploadDriverDocumentMutation,
  useDeleteDriverDocumentMutation,
} = driverDocumentsApi
