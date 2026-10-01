export type CarStatus = 'FREE' | 'RENTED' | 'REPAIR' | 'SOLD'
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'GAS'
export type BodyType = 'SEDAN' | 'HATCHBACK' | 'CROSSOVER' | 'MINIVAN' | 'WAGON' | 'SUV' | 'COUPE' | 'PICKUP' | 'VAN'
export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type DriverStatus = 'ACTIVE' | 'INACTIVE'
export type PaymentStatus = 'PAID' | 'UNPAID' | 'OVERDUE'
export type FineStatus = 'UNPAID' | 'PAID' | 'DISPUTED'

export interface Car {
  id: number
  plateNumber: string
  vin: string
  brand: string
  model: string
  year: number
  mileage: number
  status: CarStatus
  engineVolume: number | null
  fuelType: FuelType | null
  bodyType: BodyType | null
  osagoBefore: string | null
  inspectionBefore: string | null
  contracts?: Contract[]
  fines?: Fine[]
}

export interface Driver {
  id: number
  fullName: string
  phone: string
  passportNum: string
  licenseNum: string
  status: DriverStatus
  createdAt: string
  contracts?: Contract[]
}

export interface Payment {
  id: number
  contractId: number
  dueDate: string
  amount: number
  status: PaymentStatus
  paidDate: string | null
  contract?: Contract
}

export interface Contract {
  id: number
  carId: number
  driverId: number
  totalAmount: number
  paidAmount: number
  monthlyPayment: number
  startDate: string
  endDate: string | null
  status: ContractStatus
  documentUrl?: string | null
  car?: Car
  driver?: Driver
  payments?: Payment[]
}

export interface Fine {
  id: number
  carId: number
  driverId: number
  contractId: number | null
  amount: number
  description: string
  fineDate: string
  status: FineStatus
  car?: Car
  driver?: Driver
}

export interface DashboardData {
  cars: { FREE: number; RENTED: number; REPAIR: number; SOLD: number; total: number }
  contracts: { active: number }
  payments: {
    overdueCount: number
    overdueAmount: number
    collectedThisMonth: number
    upcoming: UpcomingPayment[]
  }
  fines: { unpaidCount: number; unpaidAmount: number }
  topDebtors: TopDebtor[]
}

export interface UpcomingPayment {
  id: number
  contractId: number
  dueDate: string
  amount: number
  car: { plateNumber: string; brand: string; model: string }
  driver: { fullName: string }
}

export interface TopDebtor {
  driverId: number
  driverName: string
  carPlate: string
  carModel: string
  overdueCount: number
  totalDebt: number
  maxDaysOverdue: number
  contractId: number
  firstOverduePaymentId: number
}
