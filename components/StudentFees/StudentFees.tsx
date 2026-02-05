"use client"

import React, { useEffect, useState } from 'react'
import { Wallet, RefreshCw, Receipt, Calendar } from 'lucide-react'
import { toast } from "sonner"

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

const StudentFees = ({ studentId, session }: { studentId: string; session?: string }) => {
  const [fees, setFees] = useState<FeeRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const load = React.useCallback(async (isManual = false) => {
    setLoading(true)
    if (isManual) toast.loading("Syncing fee records...", { id: "refresh-fees" });
    try {
      const url = new URL('/api/fees', window.location.origin)
      url.searchParams.set('studentId', studentId)
      if (session) url.searchParams.set('session', session)

      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) {
        setFees(json.data as FeeRow[])
        if (isManual) toast.success("Fee records synced", { id: "refresh-fees" });
      } else {
        if (isManual) toast.error("Failed to sync fees", { id: "refresh-fees" });
      }
    } catch (e) {
      if (isManual) toast.error("Network error syncing fees", { id: "refresh-fees" });
      console.error('Error loading fees:', e);
    } finally { setLoading(false) }
  }, [studentId, session])

  useEffect(() => { if (studentId) load() }, [studentId, load])

  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'admission']
  const sortedFees = [...fees].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    const ai = monthOrder.indexOf(String(a.month))
    const bi = monthOrder.indexOf(String(b.month))
    return (bi - ai)
  })

  // Calculate summary
  const totalPaid = fees.reduce((acc, f) => acc + (f.amountPaid || 0), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Vercel Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            <Wallet size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Fee Records</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{fees.length} payment{fees.length !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Card */}
      {!loading && fees.length > 0 && (
        <div className="bg-neutral-900 dark:bg-neutral-950 rounded-2xl p-5 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1">Total Paid</p>
              <p className="text-2xl font-black text-white tracking-tight">Rs. {totalPaid.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <Wallet size={24} className="text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 animate-pulse">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-3" />
              <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-2/3 mb-2" />
              <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : sortedFees.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Receipt size={28} className="text-neutral-400" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">No fees found yet.</p>
        </div>
      ) : (
        /* Fees Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFees.map(f => (
            <div key={f._id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                  {f.feeType === 'admission' ? 'Admission Fee' : `${f.month} ${f.year}`}
                </h4>
                {f.feeType === 'admission' && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 font-bold uppercase tracking-wider">
                    Admission
                  </span>
                )}
              </div>

              {/* Paid Date */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                <Calendar size={12} />
                <span>{f.paidDate || 'Date not recorded'}</span>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50 mb-3">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Amount Paid</span>
                <span className="text-lg font-black text-neutral-900 dark:text-white">Rs. {Number(f.amountPaid || 0).toLocaleString()}</span>
              </div>

              {/* Receipt Info */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <Receipt size={12} />
                <span>Receipt: {f.receiptNumber || '—'}{f.bookNumber ? ` / Book: ${f.bookNumber}` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentFees
