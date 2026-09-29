// Маппинг изображений по типу кузова.
// Ключ: значение bodyType (uppercase), значение: файл в /public/cars/.
//
// Чтобы добавить изображение для нового типа кузова:
//   1. Положи файл в frontend/public/cars/<файл>
//   2. Добавь строку сюда: 'WAGON': 'wagon.png'

const bodyTypeImages: Record<string, string> = {
  SEDAN:     'sedan.png',
  CROSSOVER: 'crossover.png',
  MINIVAN:   'minivan.png',
  HATCHBACK: 'crossover.png',
  WAGON:     'wagon.png',
  SUV:       'crossover.png',
  // COUPE:     'coupe.png',
  // PICKUP:    'pickup.png',
  // VAN:       'van.png',
}

export function getCarBodyTypeImage(bodyType: string | null | undefined): string | null {
  if (!bodyType) return null
  const filename = bodyTypeImages[bodyType]
  return filename ? `/cars/${filename}` : null
}
