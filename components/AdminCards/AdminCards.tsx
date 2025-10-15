"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery } from "@/sanity/lib/queries";
import type { Student } from "@/types/student";
import { Search, Filter, Archive } from "lucide-react";
import { saveAs } from "file-saver";

// Lightweight Next.js implementation inspired by main.py (Streamlit + ReportLab)
// - Preview student ID cards (front only, for now) with school styling
// - Select students, filter, and print to PDF via browser print dialog

const AdminCards = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [klass, setKlass] = useState<string>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const [side, setSide] = useState<'front' | 'back' | 'both'>('front');
  const [issue, setIssue] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [showListMobile, setShowListMobile] = useState<boolean>(false);
  // Fixed backgrounds as requested
  const frontBg = "/1.jpeg";
  const backBg = "/2.jpeg";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      const data: Student[] = await client.fetch(getAllStudentsQuery);
      setStudents(data);
      setLoading(false);
      onLoadingChange?.(false);
    };
    load();
  }, [onLoadingChange]);

  // Persist Issue/Expiry across reloads (admin)
  useEffect(() => {
    try {
      const storedIssue = localStorage.getItem('admin_card_issue') || '';
      const storedExpiry = localStorage.getItem('admin_card_expiry') || '';
      if (storedIssue) setIssue(storedIssue);
      if (storedExpiry) setExpiry(storedExpiry);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('admin_card_issue', issue || ""); } catch {}
  }, [issue]);

  useEffect(() => {
    try { localStorage.setItem('admin_card_expiry', expiry || ""); } catch {}
  }, [expiry]);

  const classes = useMemo(() => {
    const unique = Array.from(new Set(students.map((s) => (s.admissionFor || "").toString().trim()).filter(Boolean)));
    return ["All", ...unique];
  }, [students]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesClass = klass === "All" || (s.admissionFor || "").toString() === klass;
      const matchesTerm = !term
        ? true
        : [s.fullName, s.fatherName, s.grNumber, s.rollNumber]
            .map((v) => (v || "").toString().toLowerCase())
            .some((v) => v.includes(term));
      return matchesClass && matchesTerm;
    });
  }, [students, search, klass]);

  // Sort: by class (ascending numeric if possible), then by roll number (ascending numeric)
  const sorted = useMemo(() => {
    const parseNum = (v?: string | number | null) => {
      const n = parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
    };
    const byClass = (a: Student, b: Student) => {
      const ca = parseNum(a.admissionFor as any);
      const cb = parseNum(b.admissionFor as any);
      if (ca !== cb) return ca - cb;
      const ra = parseNum(a.rollNumber as any);
      const rb = parseNum(b.rollNumber as any);
      return ra - rb;
    };
    return [...filtered].sort(byClass);
  }, [filtered]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filtered.map((s) => s._id!)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const toPrint = sorted.filter((s) => selectedIds.size === 0 || selectedIds.has(s._id!));

  const intToRoman = (value?: string) => {
    if (!value) return "";
    const num = parseInt(String(value), 10);
    if (isNaN(num)) return String(value);
    const val = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
    let i = 0; let roman = ""; let n = num;
    while (n > 0) {
      while (n >= val[i]) { roman += syms[i]; n -= val[i]; }
      i++;
    }
    return roman;
  };

  const buildQrData = (s: Student) => {
    const dob = (s.dob || '').toString();
    const iss = (s as any).issueDate || issue || '';
    const exp = (s as any).expiryDate || expiry || '';
    return `Name: ${s.fullName || ''}\nFather Name: ${s.fatherName || ''}\nRoll No: ${s.rollNumber || ''}\nGR NO: ${s.grNumber || ''}\nDOB: ${dob}\nIssue: ${iss}\nExpiry: ${exp}\nPhone: ${s.phoneNumber || ''}`;
  };

  const getQrSrc = (s: Student, size = 80) => {
    const data = buildQrData(s);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
    return url;
  };

  // Removed Print in favor of ZIP per request

  // Helper: load an image URL as HTMLImageElement
  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  // Helper: return a circular-cropped PNG data URL for an image at a given size
  // qualityScale > 1 increases pixel density (improves sharpness in PDF while maintaining same displayed size)
  const circleImageDataUrl = (img: HTMLImageElement, size: number, qualityScale: number = 3) => {
    try {
      const canvas = document.createElement('canvas');
      const cs = Math.max(1, Math.floor(size * qualityScale));
      canvas.width = cs; canvas.height = cs;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Transparent background
      ctx.clearRect(0, 0, cs, cs);

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(cs / 2, cs / 2, cs / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the image with object-fit: cover behavior
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = Math.max(cs / iw, cs / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cs - dw) / 2;
      const dy = (cs - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      return canvas.toDataURL('image/png');
    } catch {
      // If cross-origin taints the canvas or any error occurs, return empty string to allow fallback
      return '';
    }
  };

  // Helper: convert white pixels to transparent in an image and return dataURL PNG
  const toTransparentPng = (img: HTMLImageElement) => {
    const w = img.naturalWidth || img.width; const h = img.naturalHeight || img.height;
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'); if (!ctx) return '';
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(img, 0, 0, w, h);
    try {
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        // detect near-white boxes and make transparent
        if (r > 240 && g > 240 && b > 240) {
          d[i+3] = 0; // alpha to 0
        }
      }
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  };

  // Small helper component to preview QR without white background
  const QRPreview = ({ src, size = 80 }: { src: string; size?: number }) => {
    const [out, setOut] = useState<string>('');
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const img = await loadImage(src);
          const data = toTransparentPng(img);
          if (mounted) setOut(data || src);
        } catch {
          if (mounted) setOut(src);
        }
      })();
      return () => { mounted = false };
    }, [src]);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={out || src} alt="QR" style={{ width: size, height: size }} className="w-20 h-20" />
  };

  // Generate per-student PDFs (card-sized based on background) and download as ZIP
  const handleDownloadZip = async () => {
    if (toPrint.length === 0) return;
    const [{ jsPDF }, JSZip] = await Promise.all([
      import("jspdf"),
      import("jszip")
    ]);

    const zip = new JSZip.default();

    // Preload backgrounds once
    const frontImg = await loadImage(frontBg);
    const backImg = await loadImage(backBg);

    // Export size must match on-screen preview (189x321)
    const cardW = 189;
    const cardH = 321;

    // For each selected student create a PDF
    for (const s of toPrint) {
      const doc = new jsPDF({ unit: 'px', format: [cardW, cardH], orientation: 'portrait' });

      const drawFront = async () => {
        // Background
        doc.addImage(frontImg, 'JPEG', 0, 0, cardW, cardH);
        
        // Photo positioning - matching Python ReportLab coordinates
        if (s.photoUrl) {
          try {
            const photo = await loadImage(String(s.photoUrl));
            // Python coordinates: img_x = CARD_WIDTH - 149 = 40, img_y = CARD_HEIGHT - 161.5 = 159.5, img_size = 103
            // jsPDF uses different Y-axis (0 at top), so we need to convert: cardH - pythonY - height
            const img_x = cardW - 149; // 40
            const img_y = cardH - 161.5 - 101; // Convert from bottom-up to top-down coordinates
            const img_size = 103;
            // Create a circular PNG via canvas to match UI (rounded avatar)
            const circ = circleImageDataUrl(photo, img_size, 3);
            if (circ) {
              doc.addImage(circ, 'PNG', img_x, img_y, img_size, img_size);
            } else {
              // Fallback to original square if canvas is tainted or conversion fails
              // Use no compression to avoid additional blurring
              doc.addImage(photo as any, 'JPEG', img_x, img_y, img_size, img_size, undefined as any, 'NONE');
            }
          } catch {}
        }
        
        // Text positioning - matching Python ReportLab coordinates exactly
        doc.setTextColor(35, 31, 85); // #231f55
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        const name = String(s.fullName || '').toUpperCase();
        const father = String(s.fatherName || '').toUpperCase();
        
        // Python coordinates: c.drawCentredString(94.5, 140, info['name'].upper())
        // Convert Y coordinate: cardH - pythonY = 321 - 140 = 181
        doc.text(name, 94.5, cardH - 140, { align: 'center' });
        
        // Python coordinates: c.drawCentredString(94.5, 113, info['father_name'].upper())
        // Convert Y coordinate: cardH - pythonY = 321 - 113 = 208
        doc.text(father, 94.5, cardH - 113, { align: 'center' });

        // Level badge text (white on template)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        // Python coordinates: c.drawCentredString(90.5, 95, "Level" + "-" + roman_class)
        // Convert Y coordinate: cardH - pythonY = 321 - 95 = 226
        doc.text(`LEVEL-${intToRoman(s.admissionFor)}`, 90.5, cardH - 96.2, { align: 'center' });

        // Secondary values - matching Python positioning exactly
        doc.setTextColor(35, 31, 85);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Python coordinates: c.drawString(65, 67, info['roll_no'])
        // Convert Y coordinate: cardH - pythonY = 321 - 67 = 254
        doc.text(String(s.rollNumber || ''), 65, cardH - 67.3);
        
        // Python coordinates: c.drawString(65, 52, info['gr_number'])
        // Convert Y coordinate: cardH - pythonY = 321 - 52 = 269
        doc.text(String(s.grNumber || ''), 65, cardH - 52.4);
        
        // Python coordinates: c.drawString(65, 37, dob_formatted)
        // Convert Y coordinate: cardH - pythonY = 321 - 37 = 284
        const dobFormatted = s.dob ? new Date(s.dob).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }) : '';
        doc.text(dobFormatted, 65, cardH - 38);
      };

      const drawBack = async () => {
        doc.addImage(backImg, 'JPEG', 0, 0, cardW, cardH);
        
        // QR Code positioning - matching Python ReportLab coordinates
        try {
          const qr = await loadImage(getQrSrc(s, 80));
          const qSize = 80;
          // Python coordinates: d.drawOn(c, 50, 125)
          // Convert Y coordinate: cardH - pythonY - qrSize = 321 - 125 - 80 = 116
          const qx = 50;
          const qy = cardH - 125 - qSize;
          // Attempt to strip white background by converting near-white to transparent
          const transparent = toTransparentPng(qr);
          if (transparent) {
            doc.addImage(transparent, 'PNG', qx, qy, qSize, qSize);
          } else {
            doc.addImage(qr as any, 'PNG', qx, qy, qSize, qSize);
          }
        } catch {}
        
        // Issue/Expiry dates - matching Python positioning exactly
        doc.setTextColor(35, 31, 85);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        // Format dates to match Python formatting
        const issRaw = (s as any).issueDate || issue || '';
        const expRaw = (s as any).expiryDate || expiry || '';
        const issueFormatted = issRaw ? new Date(issRaw).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }) : '';
        const expiryFormatted = expRaw ? new Date(expRaw).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }) : '';
        
        // Python coordinates: c.drawString(95, 104, issue_formatted)
        // Convert Y coordinate: cardH - pythonY = 321 - 104 = 217
        doc.text(issueFormatted, 95, cardH - 104);
        
        // Python coordinates: c.drawString(95, 93, expiry_formatted)
        // Convert Y coordinate: cardH - pythonY = 321 - 93 = 228
        doc.text(expiryFormatted, 95, cardH - 93);
        
        // Phone number - matching Python positioning exactly
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        // Python coordinates: c.drawString(85.5, 62.5, info['phone'])
        // Convert Y coordinate: cardH - pythonY = 321 - 62.5 = 258.5
        doc.text(String(s.phoneNumber || ''), 85.5, cardH - 62.5);
      };

      if (side === 'front') {
        await drawFront();
      } else if (side === 'back') {
        await drawBack();
      } else {
        await drawFront();
        doc.addPage([cardW, cardH], 'portrait');
        await drawBack();
      }

      const pdfBlob = doc.output('blob');
      const roll = (s.rollNumber || s.grNumber || 'student').toString().replace(/[^a-z0-9_-]+/gi, '_');
      const filename = `${roll}_card.pdf`;
      zip.file(filename, pdfBlob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'student_cards.zip');
  };

  return (
    <div>
      {/* Controls */}
      <div className="space-y-4">
        {/* Row 1: Search + Filter */}
        <div className="w-full bg-white p-3 rounded-xl shadow sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, father, GR, Roll..."
                className="pl-10 pr-4 py-3 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              />
            </div>
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className="px-3 py-3 sm:py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 w-full"
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filter</span>
              </button>
              {showFilter && (
                <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg w-56 p-2 right-0">
                  <label className="text-xs text-gray-500 px-1">Class</label>
                  <select
                    value={klass}
                    onChange={(e) => setKlass(e.target.value)}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  >
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Actions */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {/* Side selector */}
          <div className="flex items-center gap-2 bg-white border rounded-lg px-2 h-10">
              <label className="text-sm text-gray-600">Side</label>
              <select value={side} onChange={(e) => setSide(e.target.value as any)} className="text-sm border rounded px-2 py-1">
                <option value="front">Front</option>
                <option value="back">Back</option>
                <option value="both">Both</option>
              </select>
          </div>
          {/* Dates */}
          <input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className="h-10 border rounded-lg px-3 text-sm bg-white w-[48%] sm:w-auto" placeholder="Issue" />
          <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="h-10 border rounded-lg px-3 text-sm bg-white w-[48%] sm:w-auto" placeholder="Expiry" />
          <button
            onClick={async () => {
              if (!issue && !expiry) return;
              try {
                onLoadingChange?.(true);
                await Promise.all(toPrint.map(s => fetch('/api/students', {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s._id, patch: {
                    ...(issue ? { issueDate: new Date(issue).toISOString().slice(0,10) } : {}),
                    ...(expiry ? { expiryDate: new Date(expiry).toISOString().slice(0,10) } : {}),
                  } })
                })));
                // refresh students to reflect updated dates
                const data: Student[] = await client.fetch(getAllStudentsQuery);
                setStudents(data);
              } finally { onLoadingChange?.(false); }
            }}
            className="px-3 h-10 md:h-11 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm"
            title="Save dates to selected students"
          >
            Save Dates to Selected
          </button>
          <button
            onClick={selectAllVisible}
            className="px-4 h-10 md:h-11 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm"
            title="Select all visible"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-4 h-10 md:h-11 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm"
            title="Clear selection"
          >
            Clear
          </button>
          <button
            onClick={handleDownloadZip}
            className="px-5 h-10 md:h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm shadow hover:opacity-95 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            title="Download ZIP (PDFs)"
          >
            <Archive size={16} />
            Download ZIP
          </button>
          {/* Mobile toggle for list */}
          <button
            onClick={() => setShowListMobile((v) => !v)}
            className="sm:hidden px-4 h-10 md:h-11 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm"
            title="Toggle students list"
          >
            {showListMobile ? 'Hide List' : 'Show List'}
          </button>
        </div>
      </div>

      {/* List + Preview */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {/* List */}
        <div className={`${showListMobile ? 'block' : 'hidden'} sm:block md:col-span-1 bg-white rounded-2xl shadow p-4 h-max max-h-[70vh] overflow-auto`}>
          <div className="text-sm text-gray-600 mb-2">{sorted.length} students</div>
          <div className="space-y-2">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3 w-2/3 bg-gray-200 rounded mb-2" />
                      <div className="h-2 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-500">No students found</div>
            ) : (
              sorted.map((s) => (
                <label key={s._id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s._id!)}
                    onChange={() => toggleSelect(s._id!)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">{s.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">Roll {s.rollNumber || '-'} • GR {s.grNumber || '-'} • Class {s.admissionFor || '-'}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="md:col-span-2">
          {/* Print styles removed along with Print feature */}
          <div ref={printAreaRef} className="print-area grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 justify-center place-items-center">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="w-[189px] h-[321px] bg-white rounded-xl shadow relative overflow-hidden border mx-auto animate-pulse">
                  <div className="absolute inset-0 bg-gray-100" />
                  <div className="relative z-10 p-3 h-full flex flex-col">
                    <div className="mt-[46px] mr-2 flex-1 flex flex-col items-center justify-start">
                      <div className="w-[103px] h-[103px] rounded-full bg-gray-200" />
                      <div className="mt-3 w-3/4 h-3 bg-gray-200 rounded" />
                      <div className="mt-2 w-1/2 h-3 bg-gray-200 rounded" />
                      <div className="mt-4 w-2/3 h-2 bg-gray-200 rounded ml-auto" />
                      <div className="mt-2 w-2/3 h-2 bg-gray-200 rounded ml-auto" />
                      <div className="mt-2 w-2/3 h-2 bg-gray-200 rounded ml-auto" />
                    </div>
                  </div>
                </div>
              ))
            ) : toPrint.length === 0 ? (
              <div className="text-gray-500">Select students to preview cards</div>
            ) : (
              toPrint.flatMap((s) => {
                const cards: React.ReactNode[] = [];
                const renderFront = (
                  <div key={`${s._id}-front`} className="w-[189px] h-[321px] bg-white rounded-xl shadow relative overflow-hidden border mx-auto">
                    <div className="absolute inset-0">
                      {/* Background image for front */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={frontBg} alt="front" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="relative z-10 p-3 h-full flex flex-col">
                      <div className="mt-[46px] mr-2 flex-1 flex flex-col items-center justify-start">
                        {/* Photo placed inside existing circle on template */}
                        <div className="w-[103px] h-[103px] rounded-full overflow-hidden">
                          {s.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.photoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                          ) : null}
                        </div>

                        {/* Name and Father - positioned to match PDF exactly */}
                        <div className="mt-3 w-full text-center">
                          <div className="mb-1 text-[9px] font-bold text-[#231f55] truncate">{(s.fullName || "").toUpperCase()}</div>
                          {/* Background already has 'SON OF' label */}
                          <div className="mt-[11px] text-[9px] font-bold text-[#231f55] truncate">{(s.fatherName || "").toUpperCase()}</div>
                          <div className="mt-[3.5px] text-[9px] font-bold text-white truncate">LEVEL-{intToRoman(s.admissionFor)}</div>
                        </div>

                        {/* Secondary values - positioned to match PDF exactly */}
                        <div className="mt-[15px] ml-24 w-full text-[9px] text-[#231f55]">
                          <div className="mb-[2px]">
                            <span>{s.rollNumber || ""}</span>
                          </div>
                          <div className="mb-[1px]">
                            <span>{s.grNumber || ""}</span>
                          </div>
                          <div className={`${s.grNumber ? "" : "mt-[15px]"}`}>
                            <span>{s.dob ? new Date(s.dob).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            }) : ""}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                const renderBack = (
                  <div key={`${s._id}-back`} className="w-[189px] h-[321px] bg-white rounded-xl shadow relative overflow-hidden border mx-auto">
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={backBg} alt="back" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="relative z-10 p-3 h-full flex flex-col">
                      <div className="mt-[116px] w-full text-[8px] text-[#231f55]">
                        {/* QR Code positioned to match PDF exactly */}
                        <div className="absolute left-[50px] top-[116px]">
                          <QRPreview src={getQrSrc(s, 80)} size={80} />
                        </div>
                        
                        {/* Issue and Expiry dates positioned to match PDF exactly */}
                        <div className="absolute left-[95px] top-[207px] text-[8px] font-bold text-[#231f55]">
                          <div className="mb-[0.1px]">
                            {((s as any).issueDate || issue) ? new Date((s as any).issueDate || issue).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            }) : ''}
                          </div>
                          <div>
                            {((s as any).expiryDate || expiry) ? new Date((s as any).expiryDate || expiry).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            }) : ''}
                          </div>
                        </div>
                        
                        {/* Phone number positioned to match PDF exactly */}
                        <div className="absolute left-[85px] top-[248px] text-[8px] font-bold text-white">
                          {s.phoneNumber || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                if (side === 'front') cards.push(renderFront);
                else if (side === 'back') cards.push(renderBack);
                else cards.push(renderFront, renderBack);
                return cards;
              })
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500">Tip: Use "Download ZIP" to get per-student PDF cards.</div>
        </div>
      </div>
    </div>
  );
};

export default AdminCards;
