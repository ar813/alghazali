import { Upload, Users, PieChart, BarChart2, Loader2, X } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from "sonner";
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'

type StudentType = {
  _id: string
  fullName: string
  gender?: string
  admissionFor?: string
  grNumber?: string
  rollNumber?: string
}

const AdminReports = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [students, setStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  // Modal to show lists for insights
  const [insightModal, setInsightModal] = useState<{ open: boolean; title: string; items: any[] }>({ open: false, title: '', items: [] })

  type TargetType = 'all' | 'class' | 'student'
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [className, setClassName] = useState<string>('')
  const [studentId, setStudentId] = useState<string>('')
  const [studentQuickFilter, setStudentQuickFilter] = useState('')

  // Fee Export target state
  const [feeExporting, setFeeExporting] = useState(false)
  const [feeTargetType, setFeeTargetType] = useState<TargetType>('all')
  const [feeClassName, setFeeClassName] = useState<string>('')
  const [feeStudentId, setFeeStudentId] = useState<string>('')
  const [feeStudentQuickFilter, setFeeStudentQuickFilter] = useState('')

  // Student Form (PDF Zip) target state
  const [zipPreparing, setZipPreparing] = useState(false)
  const [formTargetType, setFormTargetType] = useState<TargetType>('all')
  const [formClassName, setFormClassName] = useState<string>('')
  const [formStudentId, setFormStudentId] = useState<string>('')
  const [formStudentQuickFilter, setFormStudentQuickFilter] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      onLoadingChange?.(true)
      const data: StudentType[] = await client.fetch(getAllStudentsQuery)
      setStudents(data)
      setLoading(false)
      onLoadingChange?.(false)
    }
    fetchStudents()
  }, [onLoadingChange])

  const handleExportFeesExcel = async () => {
    try {
      setFeeExporting(true)
      // Build API query based on target
      const params = new URLSearchParams()
      if (feeTargetType === 'class') {
        if (!feeClassName) { toast.error('Please select a class'); return }
        params.set('className', feeClassName)
      } else if (feeTargetType === 'student') {
        if (!feeStudentId) { toast.error('Please select a student'); return }
        const st = (students as any[]).find(s => s._id === feeStudentId)
        const q = (st?.grNumber || st?.rollNumber || '').toString()
        if (q) params.set('q', q)
      }

      const res = await fetch(`/api/fees?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to load fees')
      const fees: any[] = json.data || []
      if (fees.length === 0) { toast.error('Koi fee records nahi mile export ke liye.'); return }

      const ExcelJS: any = await loadExcel()
      const fileSaver = await import('file-saver')
      const saveAs = (fileSaver as any).default?.saveAs || (fileSaver as any).saveAs

      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Fees')
      ws.columns = [
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'GR Number', key: 'grNumber', width: 15 },
        { header: 'Roll No', key: 'rollNumber', width: 12 },
        { header: 'Class', key: 'className', width: 10 },
        { header: 'Month', key: 'month', width: 14 },
        { header: 'Year', key: 'year', width: 8 },
        { header: 'Fee Type', key: 'feeType', width: 12 },
        { header: 'Amount Paid', key: 'amountPaid', width: 12 },
        { header: 'Paid Date', key: 'paidDate', width: 12 },
        { header: 'Receipt Number', key: 'receiptNumber', width: 16 },
        { header: 'Book Number', key: 'bookNumber', width: 14 },
        { header: 'Notes', key: 'notes', width: 30 },
      ]
      fees.forEach((f: any) => {
        ws.addRow({
          studentName: f.student?.fullName || '',
          grNumber: f.student?.grNumber || '',
          rollNumber: f.student?.rollNumber || '',
          className: f.className || f.student?.admissionFor || '',
          month: (f.feeType === 'admission') ? 'admission' : (f.month || ''),
          year: f.year || '',
          feeType: f.feeType || '',
          amountPaid: f.amountPaid ?? 0,
          paidDate: f.paidDate || '',
          receiptNumber: f.receiptNumber || '',
          bookNumber: f.bookNumber || '',
          notes: f.notes || '',
        })
      })
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const suffix = feeTargetType === 'all' ? 'all' : feeTargetType === 'class' ? `class_${feeClassName}` : 'single'
      const fileName = `fees_${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`
      if (saveAs && typeof saveAs === 'function') saveAs(blob, fileName)
      else {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Fee export mein error aaya')
    } finally {
      setFeeExporting(false)
    }
  }

  const handleDownloadFormsZip = async () => {
    try {
      setZipPreparing(true)
      // Select students per target
      let list: any[] = []
      if (formTargetType === 'all') list = students as any[]
      else if (formTargetType === 'class') list = (students as any[]).filter(s => (s.admissionFor || '') === formClassName)
      else if (formTargetType === 'student') list = (students as any[]).filter(s => s._id === formStudentId)
      if (list.length === 0) { toast.error('Koi student nahi mila.'); return }

      const jsPDFMod: any = await import('jspdf')
      const { default: JSZip } = await import('jszip') as any
      const fileSaver = await import('file-saver')
      const saveAs = (fileSaver as any).default?.saveAs || (fileSaver as any).saveAs
      const zip = new JSZip()

      // Helper to load image URL into DataURL for jsPDF
      const fetchImageDataUrl = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url, { cache: 'no-store' })
          if (!res.ok) return null
          const blob = await res.blob()
          const reader = new FileReader()
          return await new Promise((resolve) => {
            reader.onloadend = () => resolve(String(reader.result || ''))
            reader.readAsDataURL(blob)
          })
        } catch { return null }
      }

      // Build a concise QR payload (matches AdminCards style; improves scan reliability)
      const buildQrData = (s: any) => {
        const fields: Array<[string, any]> = [
          ['Name', s.fullName],
          ['Father Name', s.fatherName],
          ['GR No', s.grNumber],
          ['Roll No', s.rollNumber],
          ['Class', s.admissionFor],
          ['Phone', s.phoneNumber || s.whatsappNumber]
        ]
        return fields.map(([k, v]) => `${k}: ${v ?? ''}`).join('\n')
      }

      const getQrUrl = (s: any, size: number) => {
        const data = buildQrData(s)
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
      }

      // Helper: apply alpha and cover-fit to watermark image and return PNG dataURL
      const tintImageAlpha = async (dataUrl: string, alpha: number, drawW: number, drawH: number) => {
        return new Promise<string>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              const cw = Math.max(1, Math.floor(drawW))
              const ch = Math.max(1, Math.floor(drawH))
              canvas.width = cw; canvas.height = ch
              const ctx = canvas.getContext('2d')
              if (!ctx) { resolve(dataUrl); return }
              ctx.clearRect(0, 0, cw, ch)
              ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
              const iw = img.naturalWidth || img.width
              const ih = img.naturalHeight || img.height
              const scale = Math.max(cw / iw, ch / ih)
              const dw = iw * scale
              const dh = ih * scale
              const dx = (cw - dw) / 2
              const dy = (ch - dh) / 2
              ctx.drawImage(img, dx, dy, dw, dh)
              resolve(canvas.toDataURL('image/png'))
            } catch {
              resolve(dataUrl)
            }
          }
          img.onerror = () => resolve(dataUrl)
          img.src = dataUrl
        })
      }

      // Preload watermark logo (use /logo.png, fallback to /assets/logo.png)
      let logoDataUrl = await fetchImageDataUrl('/logo.png')
      if (!logoDataUrl) logoDataUrl = await fetchImageDataUrl('/assets/logo.png')

      // Professional, single-page A4 Student Form per student
      for (const s of list) {
        const doc = new jsPDFMod.jsPDF({ unit: 'pt', format: 'a4' })
        const pageWidth = doc.internal.pageSize.getWidth() // 595.28
        const pageHeight = doc.internal.pageSize.getHeight() // 841.89
        const margin = 50
        const contentWidth = pageWidth - margin * 2
        const colGap = 20
        const colWidth = (contentWidth - colGap) / 2
        let y = margin + 10
        const lineH = 16
        const sectionGap = 25

        // Header with school logo area and title
        // School Title - Professional styling
        doc.setFillColor(83, 36, 42) // Professional blue background
        doc.rect(margin, y - 5, contentWidth, 45, 'F')
        doc.setTextColor(255, 255, 255) // White text
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(26)
        doc.text('Al Ghazali High School', pageWidth / 2, y + 20, { align: 'center' })
        doc.setFontSize(12)
        doc.text('Student Information Form', pageWidth / 2, y + 35, { align: 'center' })
        doc.setTextColor(0, 0, 0) // Reset to black
        y += 60
        // Add two empty lines below title as per instruction
        y += lineH * 2

        // Watermark (background)
        try {
          if (logoDataUrl) {
            const wmW = contentWidth * 0.6
            const wmH = (pageHeight - margin * 2) * 0.6
            // Slightly darker watermark per requirement (still subtle)
            const tint = await tintImageAlpha(logoDataUrl, 0.12, wmW, wmH)
            const wmX = margin + (contentWidth - wmW) / 2
            const wmY = margin + ((pageHeight - margin * 2) - wmH) / 2
              ; (doc as any).addImage(tint, 'PNG', wmX, wmY, wmW, wmH)
          }
        } catch { }

        // Student Photo (professional positioning with border)
        let photoAdded = false
        // Hoisted photo metrics so other helpers can respect the reserved area
        let photoX = margin
        let photoY = y - 10
        let photoW = 67
        let photoH = 67
        try {
          const possibleUrl = (s as any).photoUrl || (s as any).imageUrl || (s as any).pictureUrl || (s as any).avatarUrl
          if (typeof possibleUrl === 'string' && /^https?:\/\//i.test(possibleUrl)) {
            const dataUrl = await fetchImageDataUrl(possibleUrl)
            if (dataUrl) {
              // Small square image on the LEFT side (fits within 3 lines ≈ 54pt)
              const imgW = 67, imgH = 67
              const imgX = margin
              // move image slightly upward to align with the visual top of the first summary line
              const imgY = y - 10
              // store metrics for later layout calculations
              photoX = imgX
              photoY = imgY
              photoW = imgW
              photoH = imgH

              // Add photo border
              doc.setDrawColor(83, 36, 42)
              doc.setLineWidth(2)
              doc.rect(imgX - 2, imgY - 2, imgW + 4, imgH + 4, 'S')

              // Try to infer image type from URL
              const fmt = /\.png($|\?)/i.test(possibleUrl) ? 'PNG' : 'JPEG'
              try {
                (doc as any).addImage(dataUrl, fmt, imgX, imgY, imgW, imgH)
                photoAdded = true
              } catch { /* ignore addImage error */ }
            }
          }
        } catch { /* ignore photo errors */ }

        // QR Code to the RIGHT of the photo, increased size for better scan
        try {
          const qSize = 70 // fixed pixel size in points for sharpness
          const qUrl = getQrUrl(s, qSize)
          const qDataUrl = await fetchImageDataUrl(qUrl)
          if (qDataUrl) {
            // place towards top-right within content area
            const qx = pageWidth - margin - qSize
            const qy = photoY
              ; (doc as any).addImage(qDataUrl, 'PNG', qx, qy, qSize, qSize)
          }
        } catch { /* ignore QR errors */ }

        const section = (title: string) => {
          // Professional section header with gradient-like effect
          doc.setFillColor(255, 202, 124) // Light blue background
          doc.setDrawColor(83, 36, 42) // Blue border
          doc.setLineWidth(1)
          // Always full-width header; photo sits outside content grid
          doc.rect(margin, y - 8, contentWidth, 28, 'FD')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(14)
          doc.setTextColor(83, 36, 42) // Blue text
          doc.text(title, margin + 12, y + 8)
          doc.setTextColor(0, 0, 0) // Reset to black
          y += 35
        }

        // Single-column KV for the top summary block (placed to the RIGHT of photo)
        const kvSingle = (label: string, value: any, startX: number, maxRightX: number) => {
          const x = startX
          const labelWidth = 80
          const adjustedWidth = Math.max(60, maxRightX - x)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(70, 70, 70)
          doc.text(label + ':', x, y)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          const text = (value ?? '—').toString()
          const maxWidth = Math.max(40, adjustedWidth - labelWidth - 2)
          const wrapped = doc.splitTextToSize(text, maxWidth)
          doc.text(wrapped, x + labelWidth, y)
          const extra = Math.max(0, wrapped.length - 1) * 12
          y += 16 + extra
        }

        const kv = (label: string, value: any, col: 0 | 1) => {
          // Base x for the column
          const x = margin + (col === 0 ? 0 : (colWidth + colGap))
          // If we are in right column and within photo's vertical band, clamp the usable width
          const withinPhotoBand = photoAdded && col === 1 && y <= (photoY + photoH)
          // Right boundary the text cannot cross (left of photo frame with small padding)
          const rightLimitX = withinPhotoBand ? (photoX - 10) : (margin + contentWidth)
          // Maximum width allowed for this column's content area
          const adjustedColWidth = Math.min(colWidth, Math.max(50, rightLimitX - x))
          const labelWidth = 110

          // Label styling
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(70, 70, 70) // Dark gray
          doc.text(label + ':', x, y)

          // Value styling with text wrapping for long content
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.setTextColor(0, 0, 0) // Black
          const text = (value ?? '—').toString()

          // Handle long text with proper wrapping
          const maxWidth = Math.max(40, adjustedColWidth - labelWidth - 5)
          if (text.length > 25) {
            const wrappedText = doc.splitTextToSize(text, maxWidth)
            doc.text(wrappedText, x + labelWidth, y)
            // Adjust y position if text wrapped to multiple lines
            if (wrappedText.length > 1) {
              return Math.max(1, wrappedText.length - 1) * 12 // Return extra height needed
            }
          } else {
            doc.text(text, x + labelWidth, y, { maxWidth: maxWidth })
          }
          return 0 // No extra height needed
        }

        const renderPairs = (pairs: Array<[string, any]>) => {
          for (let i = 0; i < pairs.length; i += 2) {
            const extraHeight1 = kv(pairs[i][0], pairs[i][1], 0)
            let extraHeight2 = 0
            if (pairs[i + 1]) {
              extraHeight2 = kv(pairs[i + 1][0], pairs[i + 1][1], 1)
            }
            // Use the maximum extra height needed for proper spacing
            const maxExtraHeight = Math.max(extraHeight1, extraHeight2)
            y += 18 + maxExtraHeight
          }
        }

        // Top summary block next to photo (to its RIGHT): show a few important fields
        const summaryStartX = photoAdded ? (photoX + photoW + 18) : margin
        const summaryRightX = margin + contentWidth
        kvSingle('Full Name', (s as any).fullName, summaryStartX, summaryRightX)
        kvSingle('Roll Number', (s as any).rollNumber, summaryStartX, summaryRightX)
        kvSingle('Class', (s as any).admissionFor, summaryStartX, summaryRightX)
        kvSingle('GR Number', (s as any).grNumber, summaryStartX, summaryRightX)

        // Move y below the photo block before starting Personal Information
        if (photoAdded) {
          y = Math.max(y, photoY + photoH) + 20
        } else {
          y += 10
        }

        // Sections with improved spacing and layout (secondary fields)
        section('Personal Information')
        renderPairs([
          ["Father's Name", (s as any).fatherName],
          ['Father CNIC', (s as any).fatherCnic],
          ['Date of Birth', (s as any).dob ? new Date((s as any).dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''],
          ['Gender', (s as any).gender],
          ['Nationality', (s as any).nationality],
          ['Medical Condition', (s as any).medicalCondition],
        ])
        y += sectionGap

        section('Academic Information')
        renderPairs([
          ['Class', (s as any).admissionFor],
          ['Former Education', (s as any).formerEducation],
          ['Previous Institute', (s as any).previousInstitute],
          ['Last Exam %', (s as any).lastExamPercentage],
        ])
        y += sectionGap

        section('Contact Information')
        renderPairs([
          ['Email', (s as any).email],
          ['Phone', (s as any).phoneNumber],
          ['WhatsApp', (s as any).whatsappNumber],
          ['CNIC/B-Form', (s as any).cnicOrBform],
          ['Address', (s as any).address],
        ])
        y += sectionGap

        section('Guardian Information')
        renderPairs([
          ['Guardian Name', (s as any).guardianName],
          ['Guardian Contact', (s as any).guardianContact],
          ['Guardian CNIC', (s as any).guardianCnic],
          ['Guardian Relation', (s as any).guardianRelation],
        ])
        y += sectionGap

        // Removed Undertaking (Iqrar Nama) section as requested

        // Signature section with professional styling
        // Footer must be at absolute bottom center with exact text
        const footerY = pageHeight - 20
        // Dynamic date/time in PKT (Asia/Karachi)
        const now = new Date()
        const createdDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' })
        const createdTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
        const footerText = `Generated by IT Department - Al Ghazali High School | Created on ${createdDate} at ${createdTime} PKT`

        // Ensure signatures fit on the page (moved a bit downward for spacing)
        const sigY = Math.min(y + 60, footerY - 100)

        // Signature section background
        doc.setFillColor(255, 255, 255) // Very light background
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(0.5)
        doc.rect(margin, sigY - 15, contentWidth, 60, 'FD')

        // Signature lines with better spacing
        const sigLineWidth = 140
        const sigGap = (contentWidth - sigLineWidth * 3) / 2
        const sigX1 = margin + 20
        const sigX2 = margin + sigLineWidth + sigGap
        const sigX3 = margin + (sigLineWidth + sigGap) * 2 - 20
        const actualSigY = sigY + 20

        // Draw signature lines
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(1)
        doc.line(sigX1, actualSigY, sigX1 + sigLineWidth, actualSigY)
        doc.line(sigX2, actualSigY, sigX2 + sigLineWidth, actualSigY)
        doc.line(sigX3, actualSigY, sigX3 + sigLineWidth, actualSigY)

        // Signature labels
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        const labelY = actualSigY + 15
        doc.text('Student Signature', sigX1 + sigLineWidth / 2, labelY, { align: 'center' })
        doc.text('Parent/Guardian Signature', sigX2 + sigLineWidth / 2, labelY, { align: 'center' })
        doc.text('Principal Signature', sigX3 + sigLineWidth / 2, labelY, { align: 'center' })

        // Footer with professional styling (bottom center)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text(footerText, pageWidth / 2, footerY, { align: 'center' })
        doc.setTextColor(0, 0, 0) // Reset to black

        const buffer = doc.output('arraybuffer')
        const safeName = ((s as any).fullName || 'student').toString().replace(/[^a-z0-9_\-]+/gi, '_')
        zip.file(`${safeName}_form.pdf`, buffer)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const suffix = formTargetType === 'all' ? 'all' : formTargetType === 'class' ? `class_${formClassName}` : 'single'
      const zipName = `student_forms_${suffix}_${new Date().toISOString().split('T')[0]}.zip`
      if (saveAs && typeof saveAs === 'function') saveAs(zipBlob, zipName)
      else {
        const url = window.URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url; a.download = zipName; document.body.appendChild(a); a.click(); document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (e: any) {
      toast.error(e?.message || 'ZIP prepare karte hue error aaya')
    } finally {
      setZipPreparing(false)
    }
  }

  const totals = useMemo(() => {
    const total = students.length
    const male = students.filter(s => s.gender === 'male').length
    const female = students.filter(s => s.gender === 'female').length
    return { total, male, female }
  }, [students])

  const classWise = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of students) {
      const key = s.admissionFor || '—'
      map.set(key, (map.get(key) || 0) + 1)
    }
    // sort by class label natural-ish
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [students])

  const classOptions = useMemo(() => {
    return Array.from(new Set(students.map(s => s.admissionFor).filter(Boolean))).sort() as string[]
  }, [students])

  // Extra insights and data quality metrics
  const insights = useMemo(() => {
    const total = students.length
    const uniqClasses = new Set<string>()
    let withEmail = 0, withWhatsapp = 0, withPhone = 0
    let medicalYes = 0
    let missingBForm = 0
    let missingGuardian = 0
    let withPhoto = 0
    let male = 0, female = 0
    const nationalityMap = new Map<string, number>()
    const classMap = new Map<string, number>()
    const ageBuckets = { '<5': 0, '5-7': 0, '8-10': 0, '11-13': 0, '14+': 0 } as Record<string, number>

    const ageFromDob = (dob: any) => {
      try {
        if (!dob) return null
        const d = new Date(dob)
        if (isNaN(d.getTime())) return null
        const diff = Date.now() - d.getTime()
        const years = diff / (365.25 * 24 * 60 * 60 * 1000)
        return Math.floor(years)
      } catch { return null }
    }

    for (const s of students as any[]) {
      const cls = (s.admissionFor || '—').toString()
      uniqClasses.add(cls)
      classMap.set(cls, (classMap.get(cls) || 0) + 1)

      const nat = (s.nationality || '—').toString().toLowerCase()
      nationalityMap.set(nat, (nationalityMap.get(nat) || 0) + 1)

      if (s.email) withEmail++
      if (s.whatsappNumber) withWhatsapp++
      if (s.phoneNumber) withPhone++
      if ((s.medicalCondition || '').toString().toLowerCase() === 'yes') medicalYes++
      if (!s.cnicOrBform) missingBForm++
      if (!s.guardianName || !s.guardianContact) missingGuardian++
      if (s.photoUrl || s.imageUrl) withPhoto++
      if ((s.gender || '').toString().toLowerCase() === 'male') male++
      if ((s.gender || '').toString().toLowerCase() === 'female') female++

      const age = ageFromDob(s.dob)
      if (age == null) {/* ignore */ }
      else if (age < 5) ageBuckets['<5']++
      else if (age <= 7) ageBuckets['5-7']++
      else if (age <= 10) ageBuckets['8-10']++
      else if (age <= 13) ageBuckets['11-13']++
      else ageBuckets['14+']++
    }

    const topClasses = Array.from(classMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topNationalities = Array.from(nationalityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return {
      total,
      uniqClassCount: uniqClasses.size,
      withEmail, withWhatsapp, withPhone,
      medicalYes,
      missingBForm,
      missingGuardian,
      withPhoto,
      male, female,
      ageBuckets,
      topClasses,
      topNationalities,
    }
  }, [students])

  const loadExcel = async () => {
    try {
      const ExcelJS = await import('exceljs')
      return (ExcelJS as any).default || ExcelJS
    } catch (e) {
      console.error('ExcelJS library could not be loaded:', e);
      throw new Error('ExcelJS library could not be loaded. Please make sure it is installed.')
    }
  }

  // Build list for a selected insight key
  const getInsightItems = (key: string): any[] => {
    const list = students as any[]
    switch (key) {
      case 'Unique Classes': {
        const m = new Map<string, number>()
        for (const s of list) { const c = (s.admissionFor || '—').toString(); m.set(c, (m.get(c) || 0) + 1) }
        return Array.from(m.entries()).map(([cls, cnt]) => ({ _id: cls, fullName: `Class ${cls}`, count: cnt }))
      }
      case 'With Email':
        return list.filter(s => !!s.email)
      case 'With WhatsApp':
        return list.filter(s => !!s.whatsappNumber)
      case 'With Phone':
        return list.filter(s => !!s.phoneNumber)
      case 'Unique Classes': {
        const m = new Map<string, number>()
        for (const s of list) { const c = (s.admissionFor || '—').toString(); m.set(c, (m.get(c) || 0) + 1) }
        return Array.from(m.entries()).map(([cls, cnt]) => ({ _id: cls, fullName: `Class ${cls}`, count: cnt }))
      }
      case 'With Email':
        return list.filter(s => !!s.email)
      case 'With WhatsApp':
        return list.filter(s => !!s.whatsappNumber)
      case 'With Phone':
        return list.filter(s => !!s.phoneNumber)
      case 'Medical Record':
        return list.filter(s => String(s.medicalCondition || '').toLowerCase() === 'yes')
      case 'Missing B-Form':
        return list.filter(s => !s.cnicOrBform)
      case 'Missing Guardian':
        return list.filter(s => !s.guardianName || !s.guardianContact)
      case 'Male':
        return list.filter(s => String(s.gender || '').toLowerCase() === 'male')
      case 'Female':
        return list.filter(s => String(s.gender || '').toLowerCase() === 'female')
      case 'Age <5': {
        const f = (s: any) => { const a = (s.dob ? Math.floor((Date.now() - new Date(s.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null); return a != null && a < 5 }
        return list.filter(f)
      }
      case 'Age 5-7': {
        const f = (s: any) => { const a = (s.dob ? Math.floor((Date.now() - new Date(s.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null); return a != null && a >= 5 && a <= 7 }
        return list.filter(f)
      }
      case 'Age 8-10': {
        const f = (s: any) => { const a = (s.dob ? Math.floor((Date.now() - new Date(s.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null); return a != null && a >= 8 && a <= 10 }
        return list.filter(f)
      }
      case 'Age 11-13': {
        const f = (s: any) => { const a = (s.dob ? Math.floor((Date.now() - new Date(s.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null); return a != null && a >= 11 && a <= 13 }
        return list.filter(f)
      }
      case 'Age 14+': {
        const f = (s: any) => { const a = (s.dob ? Math.floor((Date.now() - new Date(s.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null); return a != null && a >= 14 }
        return list.filter(f)
      }
      default:
        return []
    }
  }

  const handleExportExcel = async () => {
    try {
      setExporting(true)

      // Filter students based on target
      let selected: any[] = []
      if (targetType === 'all') selected = students as any[]
      else if (targetType === 'class') selected = (students as any[]).filter(s => (s.admissionFor || '') === className)
      else if (targetType === 'student') selected = (students as any[]).filter(s => s._id === studentId)

      if (selected.length === 0) {
        toast.error('Koi data nahi mila export ke liye.')
        return
      }

      const ExcelJS: any = await loadExcel()
      const fileSaver = await import('file-saver')
      const saveAs = (fileSaver as any).default?.saveAs || (fileSaver as any).saveAs

      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Students')

      ws.columns = [
        { header: 'Full Name', key: 'fullName', width: 25 },
        { header: "Father's Name", key: 'fatherName', width: 25 },
        { header: 'Father CNIC', key: 'fatherCnic', width: 18 },
        { header: 'DOB', key: 'dob', width: 15 },
        { header: 'Roll No', key: 'rollNumber', width: 12 },
        { header: 'GR Number', key: 'grNumber', width: 15 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Class', key: 'admissionFor', width: 10 },
        { header: 'Nationality', key: 'nationality', width: 15 },
        { header: 'Medical', key: 'medicalCondition', width: 10 },
        { header: 'CNIC/B-Form', key: 'cnicOrBform', width: 18 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phoneNumber', width: 15 },
        { header: 'WhatsApp', key: 'whatsappNumber', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Former Edu', key: 'formerEducation', width: 12 },
        { header: 'Prev Institute', key: 'previousInstitute', width: 20 },
        { header: 'Last %', key: 'lastExamPercentage', width: 10 },
        { header: 'Guardian Name', key: 'guardianName', width: 20 },
        { header: 'Guardian Contact', key: 'guardianContact', width: 18 },
        { header: 'Guardian CNIC', key: 'guardianCnic', width: 18 },
        { header: 'Relation', key: 'guardianRelation', width: 12 },
      ]

      selected.forEach((student) => {
        ws.addRow({
          fullName: student.fullName || '',
          fatherName: (student as any).fatherName || '',
          fatherCnic: (student as any).fatherCnic || '',
          dob: (student as any).dob || '',
          rollNumber: (student as any).rollNumber || '',
          grNumber: (student as any).grNumber || '',
          gender: (student as any).gender || '',
          admissionFor: (student as any).admissionFor || '',
          nationality: (student as any).nationality || '',
          medicalCondition: (student as any).medicalCondition || '',
          cnicOrBform: (student as any).cnicOrBform || '',
          email: (student as any).email || '',
          phoneNumber: (student as any).phoneNumber || '',
          whatsappNumber: (student as any).whatsappNumber || '',
          address: (student as any).address || '',
          formerEducation: (student as any).formerEducation || '',
          previousInstitute: (student as any).previousInstitute || '',
          lastExamPercentage: (student as any).lastExamPercentage || '',
          guardianName: (student as any).guardianName || '',
          guardianContact: (student as any).guardianContact || '',
          guardianCnic: (student as any).guardianCnic || '',
          guardianRelation: (student as any).guardianRelation || ''
        })
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const suffix = targetType === 'all' ? 'all' : targetType === 'class' ? `class_${className}` : 'single'
      const fileName = `students_${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`

      if (saveAs && typeof saveAs === 'function') saveAs(blob, fileName)
      else {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Excel export mein error aaya')
    } finally {
      setExporting(false)
    }
  }

  // Small card for insight metrics (clickable)
  const InsightCard = ({ label, value }: { label: string; value: number | string }) => (
    <button
      type="button"
      onClick={() => {
        const items = getInsightItems(label)
        setInsightModal({ open: true, title: label, items })
      }}
      className="p-4 border rounded-xl bg-white shadow-sm text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-800">{String(value)}</div>
    </button>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reports</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-neutral-100 shadow-sm gap-4">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-indigo-50 rounded-full"></div>
              <div className="absolute inset-0 w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Generating Statistics...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between border border-neutral-50">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{totals.total.toLocaleString()}</p>
              </div>
              <Users className="text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Male</p>
                <p className="text-2xl font-bold">{totals.male.toLocaleString()}</p>
              </div>
              <PieChart className="text-green-600" />
            </div>
            <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Female</p>
                <p className="text-2xl font-bold">{totals.female.toLocaleString()}</p>
              </div>
              <PieChart className="text-pink-600" />
            </div>
          </>
        )}
      </div>

      {/* Data Insights (15+ quick metrics) */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-50 relative overflow-hidden">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Data Insights</h3>
        {loading ? (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
            {/* Overlay loader is handled by parent, but we add a subtle skeleton here just in case */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full p-6 opacity-20">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 bg-neutral-100 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <InsightCard label="Unique Classes" value={insights.uniqClassCount} />
              <InsightCard label="With Email" value={insights.withEmail} />
              <InsightCard label="With WhatsApp" value={insights.withWhatsapp} />
              <InsightCard label="With Phone" value={insights.withPhone} />
              <InsightCard label="Medical Cases" value={insights.medicalYes} />
              <InsightCard label="Photos Available" value={insights.withPhoto} />
              <InsightCard label="Missing B-Form" value={insights.missingBForm} />
              <InsightCard label="Missing Guardian" value={insights.missingGuardian} />
              <InsightCard label="Male" value={insights.male} />
              <InsightCard label="Female" value={insights.female} />
              <InsightCard label="Age <5" value={insights.ageBuckets['<5']} />
              <InsightCard label="Age 5-7" value={insights.ageBuckets['5-7']} />
              <InsightCard label="Age 8-10" value={insights.ageBuckets['8-10']} />
              <InsightCard label="Age 11-13" value={insights.ageBuckets['11-13']} />
              <InsightCard label="Age 14+" value={insights.ageBuckets['14+']} />
              <InsightCard label="Top Classes Listed" value={insights.topClasses.length} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Top Classes by Strength</h4>
                <div className="divide-y">
                  {insights.topClasses.length === 0 ? (
                    <div className="text-sm text-gray-500">No data</div>
                  ) : (
                    insights.topClasses.map(([cls, cnt]) => (
                      <div key={String(cls)} className="flex items-center justify-between py-2">
                        <span className="text-gray-700">Class {String(cls)}</span>
                        <span className="font-semibold">{cnt}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Top Nationalities</h4>
                <div className="divide-y">
                  {insights.topNationalities.length === 0 ? (
                    <div className="text-sm text-gray-500">No data</div>
                  ) : (
                    insights.topNationalities.map(([nat, cnt]) => (
                      <div key={String(nat)} className="flex items-center justify-between py-2">
                        <span className="text-gray-700">{String(nat).toUpperCase()}</span>
                        <span className="font-semibold">{cnt}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class-wise distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 size={18} /> Class-wise Distribution</h3>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : classWise.length === 0 ? (
            <div className="text-sm text-gray-500">No data</div>
          ) : (
            <div className="divide-y">
              {classWise.map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Class {cls}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Student Data */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Export Student Data</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Target</label>
              <select value={targetType} onChange={e => setTargetType(e.target.value as TargetType)} className="w-full border rounded px-3 py-2">
                <option value="all">Whole School</option>
                <option value="class">Class</option>
                <option value="student">Particular Student</option>
              </select>
            </div>
            {targetType === 'class' && (
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select value={className} onChange={e => setClassName(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Class</option>
                  {classOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            {targetType === 'student' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Student</label>
                <input
                  value={studentQuickFilter}
                  onChange={e => setStudentQuickFilter(e.target.value)}
                  placeholder="Filter by Roll or GR"
                  className="w-full border rounded px-3 py-2 mb-2 text-sm"
                />
                <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Student</option>
                  {(students as any[])
                    .filter(s => {
                      const q = studentQuickFilter.trim().toLowerCase()
                      if (!q) return true
                      const roll = String((s as any).rollNumber || '').toLowerCase()
                      const gr = String((s as any).grNumber || '').toLowerCase()
                      return roll.includes(q) || gr.includes(q)
                    })
                    .slice()
                    .sort((a: any, b: any) => {
                      const ra = parseInt(String((a as any).rollNumber || '').replace(/[^0-9]/g, ''), 10)
                      const rb = parseInt(String((b as any).rollNumber || '').replace(/[^0-9]/g, ''), 10)
                      const na = isNaN(ra) ? Infinity : ra
                      const nb = isNaN(rb) ? Infinity : rb
                      return na - nb
                    })
                    .map(s => (
                      <option key={s._id} value={s._id}>
                        {(s as any).fullName} — {(s as any).grNumber} — Roll {(s as any).rollNumber}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4">
            <button onClick={handleExportExcel} disabled={exporting || (targetType === 'class' && !className) || (targetType === 'student' && !studentId)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm text-sm disabled:opacity-60">
              {exporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              <span>{exporting ? 'Exporting…' : 'Export'}</span>
            </button>
          </div>
        </div>

        {/* Export Student Fee Data */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Export Student Fee Data</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Target</label>
              <select value={feeTargetType} onChange={e => setFeeTargetType(e.target.value as TargetType)} className="w-full border rounded px-3 py-2">
                <option value="all">Whole School</option>
                <option value="class">Class</option>
                <option value="student">Particular Student</option>
              </select>
            </div>
            {feeTargetType === 'class' && (
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select value={feeClassName} onChange={e => setFeeClassName(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Class</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {feeTargetType === 'student' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Student</label>
                <input
                  value={feeStudentQuickFilter}
                  onChange={e => setFeeStudentQuickFilter(e.target.value)}
                  placeholder="Filter by Roll or GR"
                  className="w-full border rounded px-3 py-2 mb-2 text-sm"
                />
                <select value={feeStudentId} onChange={e => setFeeStudentId(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Student</option>
                  {(students as any[])
                    .filter(s => {
                      const q = feeStudentQuickFilter.trim().toLowerCase()
                      if (!q) return true
                      const roll = String((s as any).rollNumber || '').toLowerCase()
                      const gr = String((s as any).grNumber || '').toLowerCase()
                      return roll.includes(q) || gr.includes(q)
                    })
                    .slice()
                    .sort((a: any, b: any) => {
                      const ra = parseInt(String((a as any).rollNumber || '').replace(/[^0-9]/g, ''), 10)
                      const rb = parseInt(String((b as any).rollNumber || '').replace(/[^0-9]/g, ''), 10)
                      const na = isNaN(ra) ? Infinity : ra
                      const nb = isNaN(rb) ? Infinity : rb
                      return na - nb
                    })
                    .map(s => (
                      <option key={s._id} value={s._id}>
                        {(s as any).fullName} — {(s as any).grNumber} — Roll {(s as any).rollNumber}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4">
            <button onClick={handleExportFeesExcel} disabled={feeExporting || (feeTargetType === 'class' && !feeClassName) || (feeTargetType === 'student' && !feeStudentId)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm text-sm disabled:opacity-60">
              {feeExporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              <span>{feeExporting ? 'Exporting…' : 'Export Fees'}</span>
            </button>
          </div>
        </div>

        {/* Download Student's Form (in zip file) */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Download Student’s Form (in zip file)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Target</label>
              <select value={formTargetType} onChange={e => setFormTargetType(e.target.value as TargetType)} className="w-full border rounded px-3 py-2">
                <option value="all">Whole School</option>
                <option value="class">Class</option>
                <option value="student">Particular Student</option>
              </select>
            </div>
            {formTargetType === 'class' && (
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select value={formClassName} onChange={e => setFormClassName(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Class</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {formTargetType === 'student' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Student</label>
                <input
                  value={formStudentQuickFilter}
                  onChange={e => setFormStudentQuickFilter(e.target.value)}
                  placeholder="Filter by Roll or GR"
                  className="w-full border rounded px-3 py-2 mb-2 text-sm"
                />
                <select value={formStudentId} onChange={e => setFormStudentId(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Student</option>
                  {(students as any[])
                    .filter(s => {
                      const q = formStudentQuickFilter.trim().toLowerCase()
                      if (!q) return true
                      const roll = String((s as any).rollNumber || '').toLowerCase()
                      const gr = String((s as any).grNumber || '').toLowerCase()
                      return roll.includes(q) || gr.includes(q)
                    })
                    .slice()
                    .sort((a: any, b: any) => {
                      const ra = parseInt(String((a as any).rollNumber || '').replace(/[^0-9]/g, ''), 10)
                      const rb = parseInt(String((b as any).rollNumber || '').replace(/[^0-9]/g, ''), 10)
                      const na = isNaN(ra) ? Infinity : ra
                      const nb = isNaN(rb) ? Infinity : rb
                      return na - nb
                    })
                    .map(s => (
                      <option key={s._id} value={s._id}>
                        {(s as any).fullName} — {(s as any).grNumber} — Roll {(s as any).rollNumber}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4">
            <button onClick={handleDownloadFormsZip} disabled={zipPreparing || (formTargetType === 'class' && !formClassName) || (formTargetType === 'student' && !formStudentId)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm text-sm disabled:opacity-60">
              {zipPreparing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              <span>{zipPreparing ? 'Preparing…' : 'Download ZIP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Insight List Modal */}
      {insightModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Insight Details">
          <div className="bg-white sm:rounded-2xl rounded-none p-4 sm:p-6 w-full sm:max-w-2xl max-w-none h-full sm:h-auto relative shadow-2xl border border-gray-200 overflow-y-auto sm:max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-xl font-semibold">{insightModal.title}</h3>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setInsightModal({ open: false, title: '', items: [] })}><X /></button>
            </div>
            <div className="mt-4">
              {insightModal.title === 'Unique Classes' ? (
                <div className="divide-y">
                  {insightModal.items.length === 0 ? <div className="text-sm text-gray-500">No data</div> : insightModal.items.map((it: any) => (
                    <div key={it._id} className="flex items-center justify-between py-2">
                      <div className="text-gray-800">{it.fullName}</div>
                      <div className="text-sm text-gray-500">{it.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {insightModal.items.length === 0 ? (
                    <div className="text-sm text-gray-500">No students found</div>
                  ) : (
                    (insightModal.items as any[]).map((s: any) => (
                      <div key={s._id} className="p-3 border rounded-lg">
                        <div className="font-medium text-gray-800">{s.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">GR: {s.grNumber || '—'} • Roll: {s.rollNumber || '—'} • Class: {s.admissionFor || '—'}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminReports