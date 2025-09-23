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

  const toPrint = filtered.filter((s) => selectedIds.size === 0 || selectedIds.has(s._id!));

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
    return `Name: ${s.fullName || ''}\nFather Name: ${s.fatherName || ''}\nRoll No: ${s.rollNumber || ''}\nGR NO: ${s.grNumber || ''}\nDOB: ${dob}\nIssue: ${issue || ''}\nExpiry: ${expiry || ''}\nPhone: ${s.phoneNumber || ''}`;
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
    // Scale factors relative to original small design 189x321 (fixed 1:1)
    const sx = 1;
    const sy = 1;

    // For each selected student create a PDF
    for (const s of toPrint) {
      const doc = new jsPDF({ unit: 'px', format: [cardW, cardH], orientation: 'portrait' });

      const drawFront = async () => {
        // Background
        doc.addImage(frontImg, 'JPEG', 0, 0, cardW, cardH);
        // Photo (approx positions based on DOM layout)
        if (s.photoUrl) {
          try {
            const photo = await loadImage(String(s.photoUrl));
            // 103x103 centered region starting at y ~ 46 (scaled)
            const pw = 103 * sx; const ph = 103 * sy;
            const px = (cardW - pw) / 2; const py = 46 * sy;
            doc.addImage(photo, 'JPEG', px, py, pw, ph);
          } catch {}
        }
        // Texts
        doc.setTextColor(35, 31, 85);
        doc.setFontSize(11 * sx);
        doc.setFont('helvetica', 'bold');
        const name = String(s.fullName || '').toUpperCase();
        const father = String(s.fatherName || '').toUpperCase();
        // Name centered around y ~ 46 + 103 + 10 => ~159
        doc.text(name, cardW / 2, 159 * sy, { align: 'center' });
        // Father name at ~ 159 + 18 => ~177
        doc.text(father, cardW / 2, 177 * sy, { align: 'center' });
        // Level badge text (white on template) just draw for record at ~ 188
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10 * sx);
        doc.text(`Level-${intToRoman(s.admissionFor)}`, cardW / 2, 188 * sy, { align: 'center' });

        // Secondary values block at roughly x ~ 150, starting y ~ 205
        doc.setTextColor(35, 31, 85);
        doc.setFontSize(10 * sx);
        const baseX = Math.min(cardW - 35 * sx, 154 * sx);
        let y = 205 * sy;
        doc.text(String(s.rollNumber || ''), baseX, y, { align: 'right' }); y += 16 * sy;
        doc.text(String(s.grNumber || ''), baseX, y, { align: 'right' }); y += 16 * sy;
        doc.text(String(s.dob || ''), baseX, y, { align: 'right' });
      };

      const drawBack = async () => {
        doc.addImage(backImg, 'JPEG', 0, 0, cardW, cardH);
        // QR in center at ~ y 105, size 80 (scaled)
        try {
          const qr = await loadImage(getQrSrc(s, Math.round(80 * sx)));
          const qSize = 80 * sx;
          const qx = (cardW - qSize) / 2;
          const qy = 105 * sy;
          doc.addImage(qr, 'PNG', qx, qy, qSize, qSize);
        } catch {}
        // Issue/Expiry near right side
        doc.setTextColor(35, 31, 85);
        doc.setFontSize(8 * sx);
        const tx = Math.min(cardW - 20 * sx, 170 * sx);
        doc.text(String(issue || ''), tx, 205 * sy);
        doc.text(String(expiry || ''), tx, 215 * sy);
        // Phone printed in white on template position
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9 * sx);
        doc.text(String(s.phoneNumber || ''), 120 * sx, 232 * sy);
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
          <div className="text-sm text-gray-600 mb-2">{filtered.length} students</div>
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
              filtered.map((s) => (
                <label key={s._id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s._id!)}
                    onChange={() => toggleSelect(s._id!)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">{s.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{s.grNumber} • Class {s.admissionFor}</div>
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

                        {/* Name and Father (only dynamic values) */}
                        <div className="mt-3 w-full text-center">
                          <div className="mb-1 text-[11px] font-bold text-[#231f55] truncate">{(s.fullName || "").toUpperCase()}</div>
                          {/* Background already has 'SON OF' label */}
                          <div className="mt-[7px] text-[11px] font-bold text-[#231f55] truncate">{(s.fatherName || "").toUpperCase()}</div>
                          <div className="mt-[1px] text-[10px] font-semibold text-white truncate ">Level-{intToRoman(s.admissionFor)}</div>
                        </div>

                        {/* Secondary values aligned with template labels */}
                        <div className="mt-[14px] ml-24 w-full text-[10px] text-[#231f55]">
                          <div className="flex items-center justify-between">
                            <span className="opacity-80">{s.rollNumber || ""}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="opacity-80">{s.grNumber || ""}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="opacity-80">{s.dob || ""}</span>
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
                      <div className="mt-[105px] w-full text-[10px] text-[#231f55]">
                        <div className="flex items-center justify-center mb-2">
                          {/* Real QR rendered via external API for now */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getQrSrc(s, 80)} alt="QR" className="w-20 h-20 bg-white rounded border" />
                        </div>
                        {/* Background already contains labels 'Issue:', 'Expiry:', 'Phone' */}
                        <div className="flex flex-col items-start ml-20">
                          <span className="opacity-80 text-right text-[8px] mt-[2px] ">{issue || ''}</span>
                          <span className="opacity-80 text-right text-[8px]">{expiry || ''}</span>
                        </div>
                          <div className="mt-[17px] ml-[68px] text-[9px] font-semibold text-white truncate ">{s.phoneNumber || ''}</div>
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
