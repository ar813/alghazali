"use client";

import React, { useEffect, useMemo, useState } from "react";
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery } from "@/sanity/lib/queries";
import type { Student } from "@/types/student";
// import { saveAs } from "file-saver"; // Moved to dynamic import
import { auth } from '@/lib/firebase';
import { toast } from "sonner";
import CardToolbar from "./CardToolbar";
import { useSession } from '@/context/SessionContext';
import StudentList from "./StudentList";
import IDCard from "./IDCard";

// Helper for image loading
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// Helper for circular image cropping
const circleImageDataUrl = (img: HTMLImageElement, size: number, qualityScale: number = 3) => {
  try {
    const canvas = document.createElement('canvas');
    const cs = Math.max(1, Math.floor(size * qualityScale));
    canvas.width = cs; canvas.height = cs;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.clearRect(0, 0, cs, cs);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cs / 2, cs / 2, cs / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
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
    return '';
  }
};

const intToRoman = (value?: string | number) => {
  if (!value) return "";
  const num = parseInt(String(value), 10);
  if (isNaN(num)) return String(value);
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let i = 0; let roman = ""; let n = num;
  while (n > 0) {
    while (n >= val[i]) { roman += syms[i]; n -= val[i]; }
    i++;
  }
  return roman;
};

// Helper to remove white background from QR
const toTransparentPng = (img: HTMLImageElement) => {
  const w = img.naturalWidth || img.width; const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'); if (!ctx) return '';
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  try {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (r > 240 && g > 240 && b > 240) {
        d[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
};

const AdminCards = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const { selectedSession } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selection
  const [search, setSearch] = useState("");
  const [klass, setKlass] = useState<string>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Config
  const [side, setSide] = useState<'front' | 'back' | 'both'>('front');
  const [issue, setIssue] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");

  // Processing state
  const [isDownloading, setIsDownloading] = useState(false);
  const [savingDates, setSavingDates] = useState(false);

  // Load Data
  const loadStudents = React.useCallback(async () => {
    try {
      if (!selectedSession) return;
      setLoading(true);
      onLoadingChange?.(true);
      const data: Student[] = await client.fetch(getAllStudentsQuery, { session: selectedSession });
      setStudents(data);
    } catch (error) {
      toast.error("Failed to load students");
      console.error(error);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange, selectedSession]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Persist Dates
  useEffect(() => {
    try {
      const storedIssue = localStorage.getItem('admin_card_issue');
      const storedExpiry = localStorage.getItem('admin_card_expiry');
      if (storedIssue) setIssue(storedIssue);
      if (storedExpiry) setExpiry(storedExpiry);
    } catch { }
  }, []);

  useEffect(() => { try { localStorage.setItem('admin_card_issue', issue || ""); } catch { } }, [issue]);
  useEffect(() => { try { localStorage.setItem('admin_card_expiry', expiry || ""); } catch { } }, [expiry]);

  // Derived State
  const classes = useMemo(() => {
    const unique = Array.from(new Set(students.map((s) => (s.admissionFor || "").toString().trim()).filter(Boolean)));
    // Sort classes numerically if possible
    return ["All", ...unique.sort((a, b) => {
      const na = parseInt(a); const nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    })];
  }, [students]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesClass = klass === "All" || (s.admissionFor || "").toString() === klass;
      const matchesTerm = !term
        ? true
        : [s.fullName, s.fatherName, s.grNumber, s.rollNumber, s.phoneNumber]
          .map((v) => (v || "").toString().toLowerCase())
          .some((v) => v.includes(term));
      return matchesClass && matchesTerm;
    });
  }, [students, search, klass]);

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

  const toPrint = useMemo(() =>
    sorted.filter((s) => selectedIds.size === 0 || selectedIds.has(s._id!)),
    [sorted, selectedIds]);


  // Handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => setSelectedIds(new Set(filtered.map((s) => s._id!)));
  const handleClearSelection = () => setSelectedIds(new Set());

  const handleSaveDates = async () => {
    if (!issue && !expiry) return;
    if (selectedIds.size === 0) {
      toast.error("Select students to save dates for");
      return;
    }

    try {
      setSavingDates(true);
      const token = await auth.currentUser?.getIdToken();
      const targets = sorted.filter(s => selectedIds.has(s._id!));

      await Promise.all(targets.map(s => fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: s._id,
          patch: {
            ...(issue ? { issueDate: new Date(issue).toISOString().slice(0, 10) } : {}),
            ...(expiry ? { expiryDate: new Date(expiry).toISOString().slice(0, 10) } : {}),
          }
        })
      })));

      await loadStudents();
      toast.success(`Dates updated for ${targets.length} students`);
    } catch {
      toast.error("Failed to save dates");
    } finally {
      setSavingDates(false);
    }
  };

  const handleDownloadZip = async () => {
    if (toPrint.length === 0) {
      toast.error("No students selected");
      return;
    }

    try {
      setIsDownloading(true);
      const [{ jsPDF }, JSZip] = await Promise.all([
        import("jspdf"),
        import("jszip")
      ]);

      const zip = new JSZip.default();
      const cardW = 189;
      const cardH = 321;

      // Assets
      const frontBg = "/1.jpeg";
      const backBg = "/2.jpeg";
      const [frontImg, backImg] = await Promise.all([
        loadImage(frontBg),
        loadImage(backBg)
      ]);

      for (const s of toPrint) {
        const doc = new jsPDF({ unit: 'px', format: [cardW, cardH], orientation: 'portrait' });

        const drawFront = async () => {
          doc.addImage(frontImg, 'JPEG', 0, 0, cardW, cardH);

          if (s.photoUrl) {
            try {
              const photo = await loadImage(String(s.photoUrl));
              const img_x = cardW - 149; // 40
              const img_y = cardH - 161.5 - 101;
              const img_size = 103;
              const circ = circleImageDataUrl(photo, img_size, 3);
              doc.addImage(circ || (photo as any), circ ? 'PNG' : 'JPEG', img_x, img_y, img_size, img_size);
            } catch { }
          }

          doc.setTextColor(35, 31, 85);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');

          const name = String(s.fullName || '').toUpperCase();
          const father = String(s.fatherName || '').toUpperCase();

          doc.text(name, 94.5, cardH - 140, { align: 'center' });
          doc.text(father, 94.5, cardH - 113, { align: 'center' });

          doc.setTextColor(255, 255, 255);
          doc.text(`LEVEL-${intToRoman(s.admissionFor)}`, 90.5, cardH - 96.2, { align: 'center' });

          doc.setTextColor(35, 31, 85);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');

          doc.text(String(s.rollNumber || ''), 65, cardH - 67.3);
          doc.text(String(s.grNumber || ''), 65, cardH - 52.4);

          const dobFormatted = s.dob ? new Date(s.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
          doc.text(dobFormatted, 65, cardH - 38);
        };

        const drawBack = async () => {
          doc.addImage(backImg, 'JPEG', 0, 0, cardW, cardH);

          try {
            const buildQrData = (s: Student) => {
              const dob = (s.dob || '').toString();
              const iss = (s as any).issueDate || issue || '';
              const exp = (s as any).expiryDate || expiry || '';
              return `Name: ${s.fullName || ''}\nFather Name: ${s.fatherName || ''}\nRoll No: ${s.rollNumber || ''}\nGR NO: ${s.grNumber || ''}\nDOB: ${dob}\nIssue: ${iss}\nExpiry: ${exp}\nPhone: ${s.phoneNumber || ''}`;
            };
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(buildQrData(s))}`;
            const qr = await loadImage(qrUrl);
            const transparent = toTransparentPng(qr);
            const qx = 50;
            const qy = cardH - 125 - 80;
            doc.addImage(transparent || (qr as any), 'PNG', qx, qy, 80, 80);
          } catch { }

          doc.setTextColor(35, 31, 85);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');

          const issRaw = (s as any).issueDate || issue || '';
          const expRaw = (s as any).expiryDate || expiry || '';
          const issueFormatted = issRaw ? new Date(issRaw).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
          const expiryFormatted = expRaw ? new Date(expRaw).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

          doc.text(issueFormatted, 95, cardH - 104);
          doc.text(expiryFormatted, 95, cardH - 93);

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.text(String(s.phoneNumber || ''), 85.5, cardH - 62.5);
        }

        if (side === 'front') await drawFront();
        else if (side === 'back') await drawBack();
        else { await drawFront(); doc.addPage([cardW, cardH], 'portrait'); await drawBack(); }

        const pdfBlob = doc.output('blob');
        const roll = (s.rollNumber || s.grNumber || 'student').toString().replace(/[^a-z0-9_-]+/gi, '_');
        zip.file(`${roll}_card.pdf`, pdfBlob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const { saveAs } = await import('file-saver');
      saveAs(content, 'student_cards.zip');
      toast.success("ZIP Downloaded successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate ZIP");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-20 px-4 sm:px-6">


      <CardToolbar
        searchTerm={search}
        onSearchChange={setSearch}
        filterClass={klass}
        onFilterClassChange={setKlass}
        classOptions={classes}
        side={side}
        onSideChange={setSide}
        issueDate={issue}
        onIssueDateChange={setIssue}
        expiryDate={expiry}
        onExpiryDateChange={setExpiry}
        selectedCount={selectedIds.size > 0 ? selectedIds.size : filtered.length}
        totalVisible={filtered.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onDownloadZip={handleDownloadZip}
        onSaveDates={handleSaveDates}
        onRefresh={loadStudents}
        savingDates={savingDates}
        isDownloading={isDownloading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-start">

        {/* Left Sidebar: List */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Students ({sorted.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <StudentList
              students={sorted}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Right Area: Preview Grid */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 min-h-[500px]">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-[189px] h-[321px] bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 mx-auto animate-pulse" />
                ))}
              </div>
            ) : toPrint.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-20">
                <p className="font-medium text-lg text-zinc-500">No students selected</p>
                <p className="text-sm">Select students from the list to preview cards.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-6 justify-items-center">
                {toPrint.map((s) => (
                  <React.Fragment key={s._id}>
                    {(side === 'front' || side === 'both') && (
                      <div className="flex flex-col gap-2">
                        <IDCard student={s} side="front" issueDate={issue} expiryDate={expiry} />
                        {side === 'both' && <span className="text-center text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Front</span>}
                      </div>
                    )}
                    {(side === 'back' || side === 'both') && (
                      <div className="flex flex-col gap-2">
                        <IDCard student={s} side="back" issueDate={issue} expiryDate={expiry} />
                        {side === 'both' && <span className="text-center text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Back</span>}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            {toPrint.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-xs font-medium text-zinc-400">Previewing {toPrint.length} student(s)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCards;
