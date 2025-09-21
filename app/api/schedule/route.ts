import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'

const token = process.env.SANITY_API_WRITE_TOKEN

if (!token) {
  // Warn at runtime in logs; requests will still fail gracefully
  console.warn('SANITY_API_WRITE_TOKEN is not set. POST requests to /api/schedule will fail.')
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

export async function GET() {
  try {
    const data = await client.fetch(`*[_type == "schedule"]{ _id, className, days[]{ day, periods[]{ subject, time } } } | order(className asc)`)
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_TOKEN' }, { status: 500 })
  }

  try {
    const body = await req.json()
    
    // Handle delete action via POST (fallback)
    if (body.action === 'delete') {
      const { className, day } = body as { action: string; className?: string; day?: string }
      
      if (!className || !day) {
        return NextResponse.json({ ok: false, error: 'className and day are required for delete' }, { status: 400 })
      }

      // Find existing schedule for class
      const existing = await client.fetch(
        `*[_type=="schedule" && className == $className][0]{ _id, days }`,
        { className }
      ) as { _id: string; days?: { day: string; periods?: { subject: string; time: string }[] }[] } | null

      if (!existing) {
        return NextResponse.json({ ok: false, error: 'Schedule not found' }, { status: 404 })
      }

      const scheduleId = existing._id
      const existingDayIndex = (existing.days || []).findIndex(d => d.day === day)

      if (existingDayIndex === -1) {
        return NextResponse.json({ ok: false, error: 'Day not found in schedule' }, { status: 404 })
      }

      // Remove the day from the schedule
      const updatedDays = (existing.days || []).filter(d => d.day !== day)
      
      if (updatedDays.length === 0) {
        // If no days left, delete the entire schedule document
        await client.delete(scheduleId)
        return NextResponse.json({ ok: true, action: 'schedule_deleted', id: scheduleId })
      } else {
        // Update the schedule with remaining days
        await client.patch(scheduleId).set({ days: updatedDays }).commit()
        return NextResponse.json({ ok: true, action: 'day_deleted', id: scheduleId })
      }
    }

    const { className, day, periods } = body as { className?: string; day?: string; periods?: { subject: string; time: string }[] }

    if (!className || !day || !Array.isArray(periods) || periods.length === 0) {
      return NextResponse.json({ ok: false, error: 'className, day and at least one period are required' }, { status: 400 })
    }

    // Find existing schedule for class
    const existing = await client.fetch(
      `*[_type=="schedule" && className == $className][0]{ _id, days }`,
      { className }
    ) as { _id: string; days?: { day: string; periods?: { subject: string; time: string }[] }[] } | null

    if (!existing) {
      // Create new schedule document
      const doc = {
        _type: 'schedule',
        className,
        days: [
          {
            day,
            periods: periods.map(p => ({ subject: p.subject, time: p.time }))
          }
        ]
      }
      const created = await client.create(doc)
      return NextResponse.json({ ok: true, action: 'created', id: created._id })
    }

    const scheduleId = existing._id

    // Check if day exists; if yes, overwrite its periods; if not, append new day
    const existingDayIndex = (existing.days || []).findIndex(d => d.day === day)

    if (existingDayIndex === -1) {
      // Append new day
      await client.patch(scheduleId).append('days', [{ day, periods }]).commit()
      return NextResponse.json({ ok: true, action: 'day_appended', id: scheduleId })
    } else {
      // Replace periods for the day
      await client
        .patch(scheduleId)
        .set({ [`days[${existingDayIndex}].periods`]: periods })
        .commit()
      return NextResponse.json({ ok: true, action: 'day_updated', id: scheduleId })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to upsert schedule' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_TOKEN' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const className = searchParams.get('className')
    const day = searchParams.get('day')

    if (!className || !day) {
      return NextResponse.json({ ok: false, error: 'className and day are required' }, { status: 400 })
    }

    // Find existing schedule for class
    const existing = await client.fetch(
      `*[_type=="schedule" && className == $className][0]{ _id, days }`,
      { className }
    ) as { _id: string; days?: { day: string; periods?: { subject: string; time: string }[] }[] } | null

    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Schedule not found' }, { status: 404 })
    }

    const scheduleId = existing._id
    const existingDayIndex = (existing.days || []).findIndex(d => d.day === day)

    if (existingDayIndex === -1) {
      return NextResponse.json({ ok: false, error: 'Day not found in schedule' }, { status: 404 })
    }

    // Remove the day from the schedule
    const updatedDays = (existing.days || []).filter(d => d.day !== day)
    
    if (updatedDays.length === 0) {
      // If no days left, delete the entire schedule document
      await client.delete(scheduleId)
      return NextResponse.json({ ok: true, action: 'schedule_deleted', id: scheduleId })
    } else {
      // Update the schedule with remaining days
      await client.patch(scheduleId).set({ days: updatedDays }).commit()
      return NextResponse.json({ ok: true, action: 'day_deleted', id: scheduleId })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete schedule day' }, { status: 500 })
  }
}
