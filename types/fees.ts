export type FeeStatus = 'paid' | 'partial' | 'unpaid'
export type FeeType = 'monthly' | 'admission'

export interface Fee {
  _id: string
  student: {
    _ref: string
    _type: 'reference'
  }
  className?: string
  month: string
  year: number
  amountPaid?: number
  status: FeeStatus
  feeType: FeeType
  dueDate?: string
  paidDate?: string
  receiptNumber?: string
  bookNumber?: string
  notes?: string
}

export interface FeeCreateDTO {
  studentId: string
  className?: string
  month: string
  year: number
  amountPaid?: number
  status?: FeeStatus
  feeType?: FeeType
  dueDate?: string
  paidDate?: string
  receiptNumber?: string
  bookNumber?: string
  notes?: string
}

export interface FeeUpdateDTO {
  id: string
  patch: Partial<Omit<FeeCreateDTO, 'studentId'>> & {
    studentId?: string
  }
}
