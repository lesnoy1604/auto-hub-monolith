// Маппинг фото моделей автомобилей.
// Ключ: "<brand>_<model>" в нижнем регистре, пробелы → "_".
// Значение: путь относительно /public/cars/.
//
// Чтобы добавить фото для новой модели:
//   1. Положи изображение в frontend/public/cars/<файл>
//   2. Добавь одну строку сюда: 'toyota_camry': 'toyota-camry.png'

const modelImages: Record<string, string> = {
  // Примеры (раскомментируй и добавь файл в public/cars/):
  // 'kia_rio':              'kia-rio.png',
  // 'hyundai_solaris':      'hyundai-solaris.png',
  // 'toyota_camry':         'toyota-camry.png',
  // 'volkswagen_polo':      'volkswagen-polo.png',
  // 'skoda_octavia':        'skoda-octavia.png',
  // 'renault_logan':        'renault-logan.png',
  // 'nissan_almera':        'nissan-almera.png',
  // 'ford_focus':           'ford-focus.png',
  // 'lada_vesta':           'lada-vesta.png',
  // 'mazda_3':              'mazda-3.png',
  // 'bmw_3_series':         'bmw-3-series.png',
  // 'chevrolet_cruze':      'chevrolet-cruze.png',
}

export function getCarModelImage(brand: string, model: string): string | null {
  const key = `${brand}_${model}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
  const filename = modelImages[key]
  return filename ? `/cars/${filename}` : null
}
