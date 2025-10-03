import { NextResponse } from 'next/server'
import serverClient from '@/sanity/lib/serverClient'

export async function POST(request: Request) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
  }
  const body = await request.json()
  console.log('API POST /api/students body:', body)
  try {
    // minimal validation: must have fullName and admissionFor at least
    if (!body?.fullName || !body?.admissionFor) {
      return NextResponse.json({ ok: false, error: 'fullName and admissionFor are required' }, { status: 400 })
    }
    const doc = await serverClient.create({ _type: 'student', ...body })
    return NextResponse.json({ ok: true, doc })
  } catch (err) {
    console.error('API POST error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
  }
  const { id, patch } = await request.json()
  console.log('API PATCH /api/students', id, patch)
  try {
    if (!id || !patch || typeof patch !== 'object') {
      return NextResponse.json({ ok: false, error: 'id and patch are required' }, { status: 400 })
    }
    const res = await serverClient.patch(id).set(patch).commit()
    return NextResponse.json({ ok: true, res })
  } catch (err) {
    console.error('API PATCH error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Server is missing SANITY_API_WRITE_TOKEN' }, { status: 500 })
  }
  const url = new URL(request.url)
  const all = url.searchParams.get('all') === 'true'
  const className = url.searchParams.get('class')?.trim()
  const force = url.searchParams.get('force') === 'true'

  // If bulk delete is requested, delete all students via GROQ query
  if (all) {
    console.log('API DELETE /api/students (bulk delete all)')
    try {
      // Collect all student IDs
      const ids: string[] = await serverClient.fetch('*[_type == "student"]._id')
      const deletable: string[] = []
      const blocked: Array<{ id: string; references: Array<{ _id: string; _type: string }> }> = []

      for (const id of ids) {
        const refs = await serverClient.fetch('*[references($id)]{_id,_type}', { id })
        if (Array.isArray(refs) && refs.length > 0) {
          blocked.push({ id, references: refs })
        } else {
          deletable.push(id)
        }
      }

      let res: any = null
      if (deletable.length > 0) {
        // Safe bulk delete only those without references
        res = await serverClient.delete({ query: '*[_type == "student" && _id in $ids]', params: { ids: deletable } })
      }
      return NextResponse.json({ ok: true, deletedCount: deletable.length, blocked }, { status: 200 })
    } catch (err) {
      console.error('API BULK DELETE error', err)
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
  }

  // Delete by class (safe bulk by specific class only)
  if (className) {
    console.log('API DELETE /api/students (by class):', className)
    try {
      // Guard against accidental wildcards
      if (className.toLowerCase() === 'all') {
        return NextResponse.json({ ok: false, error: 'Invalid class value' }, { status: 400 })
      }
      const ids: string[] = await serverClient.fetch('*[_type == "student" && admissionFor == $cls]._id', { cls: className })
      const deletedIds: string[] = []
      const blocked: Array<{ id: string; references: Array<{ _id: string; _type: string }> }> = []

      for (const id of ids) {
        const refs = await serverClient.fetch('*[references($id)]{_id,_type}', { id })
        if (Array.isArray(refs) && refs.length > 0) {
          // Always force: delete all referencing docs first
          for (const r of refs) {
            try { await serverClient.delete(r._id) } catch {}
          }
          const remaining = await serverClient.fetch('*[references($id)]{_id,_type}', { id })
          if (remaining.length === 0) {
            try { await serverClient.delete(id); deletedIds.push(id) } catch {
              // if still fails, treat as blocked with original refs
              blocked.push({ id, references: refs })
            }
          } else {
            blocked.push({ id, references: remaining })
          }
        } else {
          try { await serverClient.delete(id); deletedIds.push(id) } catch {
            // if delete fails unexpectedly, mark blocked with empty refs
            blocked.push({ id, references: [] as any })
          }
        }
      }

      return NextResponse.json({ ok: true, deletedCount: deletedIds.length, deletedIds, blocked })
    } catch (err) {
      console.error('API CLASS DELETE error', err)
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
  }

  // Otherwise delete a single student by id (expects JSON body with { id })
  const { id } = await request.json()
  console.log('API DELETE /api/students', id)
  try {
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }
    // First, check references and return 409 with details if any
    const refs: Array<{ _id: string; _type: string }> = await serverClient.fetch('*[references($id)]{_id,_type}', { id })
    if (Array.isArray(refs) && refs.length > 0) {
      if (!force) {
        return NextResponse.json(
          {
            ok: false,
            error: `Document ${id} cannot be deleted because it is referenced by other documents`,
            referencing: refs,
          },
          { status: 409 }
        )
      }
      // Force mode: delete ALL referencing docs (regardless of type), then proceed
      const toDelete = refs.map(r => r._id)
      const deletedRefs: string[] = []
      for (const rid of toDelete) {
        try {
          await serverClient.delete(rid)
          deletedRefs.push(rid)
        } catch (e) {
          // if any fails, continue and let final delete potentially fail with remaining refs
        }
      }
      // Re-check remaining references before deleting the student
      const remaining: Array<{ _id: string; _type: string }> = await serverClient.fetch('*[references($id)]{_id,_type}', { id })
      if (remaining.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Cannot force delete student; still referenced by other documents`,
            referencing: remaining,
            deletedReferencing: deletedRefs,
            skippedUnknownTypes: [],
          },
          { status: 409 }
        )
      }
    }

    const res = await serverClient.delete(id)
    return NextResponse.json({ ok: true, res })
  } catch (err) {
    console.error('API DELETE error', err)
    // If Sanity still returns a conflict-style error, surface 409
    const msg = String(err)
    if (msg.includes('references') || msg.includes('documentHasExistingReferencesError') || msg.includes('409')) {
      return NextResponse.json({ ok: false, error: msg }, { status: 409 })
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
