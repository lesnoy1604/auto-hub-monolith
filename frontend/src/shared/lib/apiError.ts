export function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data: unknown }).data
    if (data && typeof data === 'object' && 'detail' in data) {
      return String((data as { detail: string }).detail)
    }
  }
  return 'Произошла ошибка'
}
