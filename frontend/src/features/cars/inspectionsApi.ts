import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'

export type InspectionAngle = 'front' | 'back' | 'left' | 'right' | 'interior' | 'odometer'

export interface InspectionPhoto {
  id: number
  inspectionId: number
  angle: InspectionAngle
  filename: string
  url: string
  createdAt: string
}

export interface CarInspection {
  id: number
  carId: number
  inspectedAt: string
  notes: string
  photos: InspectionPhoto[]
  createdAt: string
}

export const inspectionsApi = createApi({
  reducerPath: 'inspectionsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Inspection'],
  endpoints: (builder) => ({
    getCarInspections: builder.query<CarInspection[], number>({
      query: (carId) => `/cars/${carId}/inspections`,
      providesTags: (_r, _e, carId) => [{ type: 'Inspection', id: carId }],
    }),
    createInspection: builder.mutation<CarInspection, { carId: number; inspectedAt: string; notes: string }>({
      query: ({ carId, ...body }) => ({
        url: `/cars/${carId}/inspections`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { carId }) => [{ type: 'Inspection', id: carId }],
    }),
    uploadPhoto: builder.mutation<InspectionPhoto, { inspectionId: number; angle: InspectionAngle; file: File; carId: number }>({
      query: ({ inspectionId, angle, file }) => {
        const form = new FormData()
        form.append('angle', angle)
        form.append('photo', file)
        return { url: `/inspections/${inspectionId}/photos`, method: 'POST', body: form }
      },
      invalidatesTags: (_r, _e, { carId }) => [{ type: 'Inspection', id: carId }],
    }),
  }),
})

export const { useGetCarInspectionsQuery, useCreateInspectionMutation, useUploadPhotoMutation } = inspectionsApi
