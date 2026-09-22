import { zodResolver as _zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const zodResolver = <T extends FieldValues>(schema: ZodType<any, any, any>): Resolver<T> =>
  _zodResolver(schema as any) as Resolver<T>
