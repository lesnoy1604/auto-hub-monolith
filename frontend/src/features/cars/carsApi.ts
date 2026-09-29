import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/app/baseQuery'
import type { Car } from '@/shared/types'

interface CarsQueryParams { status?: string; search?: string }

interface CarsListResponse { cars: Car[]; total: number }

export const carsApi = createApi({
  reducerPath: 'carsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Car'],
  endpoints: (builder) => ({
    getCars: builder.query<CarsListResponse, CarsQueryParams>({
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
    deleteCar: builder.mutation<void, number>({
      query: (id) => ({ url: `/cars/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Car'],
    }),
  }),
})

export const { useGetCarsQuery, useGetCarByIdQuery, useCreateCarMutation, useUpdateCarMutation, useDeleteCarMutation } = carsApi
