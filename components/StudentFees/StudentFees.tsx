"use client"

import React, { useEffect, useState } from 'react'

type FeeRow = {
  _id: string
  month: string
  year: number
  amountPaid?: number
  status: string
  feeType?: 'monthly' | 'admission'
  paidDate?: string
  receiptNumber?: string
  bookNumber?: string
  className?: string
}

const StudentFees = ({ studentId }: { studentId: string }) => {
  const [fees, setFees] = useState<FeeRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fees?studentId=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setFees(json.data as FeeRow[])
    } catch (e) {
      // Silently fail for student view
      console.error('Error loading fees:', e);
    } finally { setLoading(false) }
  }, [studentId])

  useEffect(() => { if (studentId) load() }, [studentId, load])

  const monthOrder = ['January','February','March','April','May','June','July','August','September','October','November','December','admission']
  const sortedFees = [...fees].sort((a,b) => {
    if (a.year !== b.year) return b.year - a.year
    const ai = monthOrder.indexOf(String(a.month))
    const bi = monthOrder.indexOf(String(b.month))
    return (bi - ai)
  })

  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Fees</h3>
        <button onClick={load} className="px-3 py-1 text-sm border rounded-lg bg-white hover:bg-gray-50">Refresh</button>
      </div>

      {loading ? (
        <div className="text-gray-600 text-sm">Loading...</div>
      ) : sortedFees.length === 0 ? (
        <div className="text-gray-500 text-sm">No fees found yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFees.map(f => (
            <div key={f._id} className="border rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-gray-800">{f.feeType === 'admission' ? 'Admission Fee' : `${f.month} ${f.year}`}</div>
                {f.feeType === 'admission' && (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Admission</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-2">Paid Date: {f.paidDate || '—'}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Paid</div>
                <div className="text-sm font-bold text-gray-900">{Number(f.amountPaid || 0).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-xs text-gray-600">Receipt: {f.receiptNumber || '—'}{f.bookNumber ? ` / ${f.bookNumber}` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentFees
