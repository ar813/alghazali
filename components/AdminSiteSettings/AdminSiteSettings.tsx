"use client"

import React, { useEffect, useState } from 'react'
import { Save, RefreshCw, Plus, Trash2 } from 'lucide-react'

export default function AdminSiteSettings({ onLoadingChange }: { onLoadingChange?: (b: boolean) => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    cardIssueDate: '',
    cardExpiryDate: '',
    classFees: [] as { className: string; amount: number | '' }[],
    schoolAddress: '',
    phoneNumber: '',
    email: '',
    officeHours: [] as { day: string; open: string; close: string }[],
  })

  const load = React.useCallback(async () => {
    onLoadingChange?.(true)
    try {
      const res = await fetch('/api/important', { cache: 'no-store' })
      const j = await res.json()
      if (j?.ok && j.data) {
        setForm({
          cardIssueDate: j.data.cardIssueDate || '',
          cardExpiryDate: j.data.cardExpiryDate || '',
          classFees: Array.isArray(j.data.classFees) ? j.data.classFees.map((x: any) => ({ className: x.className || '', amount: typeof x.amount === 'number' ? x.amount : '' })) : [],
          schoolAddress: j.data.schoolAddress || '',
          phoneNumber: j.data.phoneNumber || '',
          email: j.data.email || '',
          officeHours: Array.isArray(j.data.officeHours) ? j.data.officeHours.map((x: any) => ({ day: x.day || '', open: x.open || '', close: x.close || '' })) : [],
        })
      }
    } finally { onLoadingChange?.(false) }
  }, [onLoadingChange])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/important', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          ...form,
          classFees: (form.classFees || []).filter((x: any) => x.className && x.amount !== ''),
          officeHours: (form.officeHours || []).filter((x: any) => x.day && x.open && x.close),
        })
      })
      const j = await res.json()
      if (!j?.ok) throw new Error(j?.error || 'Failed to save')
      await load()
      alert('Saved')
    } catch (e: any) {
      alert(e?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Site Settings</h3>
          <div className="flex items-center gap-2">
            <button onClick={load} className="px-3 py-1.5 border rounded text-sm inline-flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
            <button onClick={save} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm inline-flex items-center gap-2">{saving ? 'Saving...' : (<><Save size={14} /> Save</>)}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Card Issue Date</label>
            <input type="date" value={form.cardIssueDate || ''} onChange={e => setForm((f: any) => ({ ...f, cardIssueDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Card Expiry Date</label>
            <input type="date" value={form.cardExpiryDate || ''} onChange={e => setForm((f: any) => ({ ...f, cardExpiryDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2"><h4 className="font-semibold">Class Fees</h4><button onClick={() => setForm((f: any) => ({ ...f, classFees: [...(f.classFees || []), { className: '', amount: '' }] }))} className="px-2 py-1 text-xs border rounded inline-flex items-center gap-1"><Plus size={14} /> Add</button></div>
          <div className="space-y-2">
            {(form.classFees || []).map((row: any, idx: number) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={row.className} onChange={e => setForm((f: any) => { const arr = [...f.classFees]; arr[idx] = { ...arr[idx], className: e.target.value }; return { ...f, classFees: arr } })} className="border rounded px-3 py-2" placeholder="Class (e.g. Class 1)" />
                <input type="number" value={row.amount} onChange={e => setForm((f: any) => { const arr = [...f.classFees]; arr[idx] = { ...arr[idx], amount: e.target.value === '' ? '' : Number(e.target.value) }; return { ...f, classFees: arr } })} className="border rounded px-3 py-2" placeholder="Amount" />
                <div>
                  <button onClick={() => setForm((f: any) => ({ ...f, classFees: f.classFees.filter((_: any, i: number) => i !== idx) }))} className="px-2 py-2 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14} /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">School Address</label>
            <textarea value={form.schoolAddress} onChange={e => setForm((f: any) => ({ ...f, schoolAddress: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input value={form.phoneNumber} onChange={e => setForm((f: any) => ({ ...f, phoneNumber: e.target.value }))} className="w-full border rounded px-3 py-2" />
            <label className="block text-sm font-medium mb-1 mt-3">Email</label>
            <input type="email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2"><h4 className="font-semibold">Office Hours</h4><button onClick={() => setForm((f: any) => ({ ...f, officeHours: [...(f.officeHours || []), { day: '', open: '', close: '' }] }))} className="px-2 py-1 text-xs border rounded inline-flex items-center gap-1"><Plus size={14} /> Add</button></div>
          <div className="space-y-2">
            {(form.officeHours || []).map((row: any, idx: number) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input value={row.day} onChange={e => setForm((f: any) => { const arr = [...f.officeHours]; arr[idx] = { ...arr[idx], day: e.target.value }; return { ...f, officeHours: arr } })} className="border rounded px-3 py-2" placeholder="Day" />
                <input value={row.open} onChange={e => setForm((f: any) => { const arr = [...f.officeHours]; arr[idx] = { ...arr[idx], open: e.target.value }; return { ...f, officeHours: arr } })} className="border rounded px-3 py-2" placeholder="Open (e.g. 8:00 AM)" />
                <input value={row.close} onChange={e => setForm((f: any) => { const arr = [...f.officeHours]; arr[idx] = { ...arr[idx], close: e.target.value }; return { ...f, officeHours: arr } })} className="border rounded px-3 py-2" placeholder="Close (e.g. 4:00 PM)" />
                <div>
                  <button onClick={() => setForm((f: any) => ({ ...f, officeHours: f.officeHours.filter((_: any, i: number) => i !== idx) }))} className="px-2 py-2 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14} /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
