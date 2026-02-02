"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'
import { toast } from "sonner";
import QuizForm from './QuizForm';
import QuizList from './QuizList';
import QuizEditDrawer from './QuizEditDrawer';
import { useAuth } from '@/hooks/use-auth';
import { useSession } from '@/context/SessionContext';

type Quiz = {
  _id: string
  title: string
  subject: string
  examKey?: string
  targetType: 'all' | 'class' | 'student'
  className?: string
  student?: { _id: string; fullName: string }
  questions: { question: string; options: string[]; correctIndex: number; difficulty?: 'easy' | 'medium' | 'hard' }[]
  resultsAnnounced?: boolean
  durationMinutes?: number
  questionLimit?: number
}

const AdminQuiz = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const { selectedSession } = useSession()
  const [students, setStudents] = useState<any[]>([])
  const [items, setItems] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)

  const [editing, setEditing] = useState<any | null>(null)
  const { user } = useAuth();


  const genId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

  // Load Data
  const loadData = useCallback(async () => {
    if (!selectedSession) return
    setLoading(true)
    onLoadingChange?.(true)
    try {
      const s = await client.fetch(getAllStudentsQuery, { session: selectedSession })
      setStudents(s)

      const res = await fetch(`/api/quizzes?limit=50&session=${selectedSession}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setItems(json.data)
    } catch {
      toast.error('Data loading failure')
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }, [onLoadingChange, selectedSession])

  useEffect(() => { loadData() }, [loadData, selectedSession])

  const classOptions = useMemo(() =>
    Array.from(new Set(students.map(s => s.admissionFor).filter(Boolean))).sort() as string[]
    , [students])

  // API Handlers
  const handleCreate = async (formData: any) => {
    setSaving(true)
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, session: selectedSession })
      })
      const json = await res.json()
      if (json?.ok) {
        toast.success('Assessment published live')
        loadData()
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanentely delete this module?')) return
    setWorkingId(id)
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/quizzes?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const json = await res.json()
      if (json?.ok) {
        setItems(prev => prev.filter(i => i._id !== id))
        toast.success('Deleted from database')
      }
    } finally { setWorkingId(null) }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Form Section */}
      <div className="w-full">
        <QuizForm
          students={students}
          classOptions={classOptions}
          onSubmit={handleCreate}
          saving={saving}
          genId={genId}
        />
      </div>

      {/* List Section */}
      <div className="w-full">
        <QuizList
          items={items}
          loading={loading}
          workingId={workingId}
          onEdit={setEditing}
          onDelete={handleDelete}
          onRefresh={loadData}
        />
      </div>

      {/* Editing Context - Side Drawer */}
      {editing && (
        <QuizEditDrawer
          quiz={editing}
          students={students}
          classOptions={classOptions}
          genId={genId}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems(prev => prev.map(i => i._id === updated._id ? { ...i, ...updated } : i))
            setEditing(null)
            toast.success('System record updated')
          }}
        />
      )}
    </div>
  )
}

export default AdminQuiz
