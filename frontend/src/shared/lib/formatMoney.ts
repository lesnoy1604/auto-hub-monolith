export const formatMoney = (n: number | string) =>
  Number(n).toLocaleString('ru-RU') + ' ₽'
