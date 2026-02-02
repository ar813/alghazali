"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'
import type { Student } from '@/types/student'
import { toast } from "sonner";
import NoticeForm from './NoticeForm';
import NoticeList from './NoticeList';
import EditNoticeModal from './EditNoticeModal';
import { useSession } from '@/context/SessionContext';

const AdminNotice = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const { selectedSession } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)

  // Initial Load - Students
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSession) return
      onLoadingChange?.(true)
      try {
        const s: Student[] = await client.fetch(getAllStudentsQuery, { session: selectedSession })
        setStudents(s)
      } finally { onLoadingChange?.(false) }
    }
    loadStudents()
  }, [onLoadingChange, selectedSession])

  // Load Notices
  const loadNotices = useCallback(async () => {
    if (!selectedSession) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notices?limit=100&session=${selectedSession}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setItems(json.data)
    } finally { setLoading(false) }
  }, [selectedSession])

  useEffect(() => { loadNotices() }, [loadNotices, selectedSession])

  const classOptions = useMemo(() =>
    Array.from(new Set(students.map(s => s.admissionFor).filter(Boolean))).sort() as string[]
    , [students])

  // Create Notice
  const handleCreate = async (formData: any) => {
    setSaving(true)
    try {
      const payload = {
        ...formData,
        eventDate: formData.isEvent && formData.eventDate ? new Date(formData.eventDate).toISOString() : undefined,
        eventType: formData.isEvent ? (formData.eventType || 'General') : undefined,
        session: selectedSession,
      }
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json?.ok) {
        toast.success('Notice published successfully')
        loadNotices()
      } else {
        toast.error(json?.error || 'Failed to publish notice')
      }
    } catch (_e) {
      toast.error('Network error. Check your connection.')
    } finally { setSaving(false) }
  }

  // Delete Notice
  const handleDelete = async (id: string) => {
    setWorkingId(id)
    try {
      const res = await fetch(`/api/notices?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json?.ok) {
        setItems(prev => prev.filter(i => i._id !== id))
        toast.success('Notice deleted permanentely')
      }
    } finally { setWorkingId(null) }
  }

  // Delete All
  const handleDeleteAll = async () => {
    if (!confirm('Type "DELETE" to confirm flushing all records?')) return;
    setLoading(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/notices?all=true&session=${selectedSession}`, { method: 'DELETE' })
      const json = await res.json()
      if (json?.ok) {
        setItems([])
        toast.success('All notices cleared')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Form Section */}
      <div className="w-full">
        <NoticeForm
          students={students}
          classOptions={classOptions}
          onSubmit={handleCreate}
          saving={saving}
        />
      </div>

      {/* List Section */}
      <div className="w-full">
        <NoticeList
          items={items}
          loading={loading}
          workingId={workingId}
          onEdit={setEditing}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          onRefresh={loadNotices}
        />
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditNoticeModal
          notice={editing}
          students={students}
          classOptions={classOptions}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems(prev => prev.map(i => i._id === updated._id ? { ...i, ...updated } : i))
            setEditing(null)
            toast.success('Changes saved successfully')
          }}
        />
      )}
    </div>
  )
}

export default AdminNotice
