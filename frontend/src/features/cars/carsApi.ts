import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Car } from '@/shared/types'

interface CarsQueryParams { status?: string; search?: string }

export const carsApi = createApi({
  reducerPath: 'carsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Car'],
  endpoints: (builder) => ({
    getCars: builder.query<Car[], CarsQueryParams>({
      query: (params) => ({
        url: '/cars',
        params,
      }),
      providesTags: ['Car'],
    }),
    getCarById: builder.query<Car, number>({
      query: (id) => `/cars/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Car', id }],
    }),
    createCar: builder.mutation<Car, Partial<Car>>({
      query: (body) => ({ url: '/cars', method: 'POST', body }),
      invalidatesTags: ['Car'],
    }),
    updateCar: builder.mutation<Car, { id: number } & Partial<Car>>({
      query: ({ id, ...body }) => ({ url: `/cars/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Car', { type: 'Car', id }],
    }),
  }),
})

export const { useGetCarsQuery, useGetCarByIdQuery, useCreateCarMutation, useUpdateCarMutation } = carsApi
