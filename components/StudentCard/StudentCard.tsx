"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Student } from "@/types/student";

const frontBg = "/1.jpeg";
const backBg = "/2.jpeg";

function intToRoman(value?: string) {
  if (!value) return "";
  const num = parseInt(String(value), 10);
  if (isNaN(num)) return String(value);
  const val = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let i = 0; let roman = ""; let n = num;
  while (n > 0) { while (n >= val[i]) { roman += syms[i]; n -= val[i]; } i++; }
  return roman;
}

function buildQrData(s: Student, issue: string, expiry: string) {
  const dob = (s.dob || '').toString();
  return `Name: ${s.fullName || ''}\nFather Name: ${s.fatherName || ''}\nRoll No: ${s.rollNumber || ''}\nGR NO: ${s.grNumber || ''}\nDOB: ${dob}\nIssue: ${issue || ''}\nExpiry: ${expiry || ''}\nPhone: ${s.phoneNumber || ''}`;
}

function getQrSrc(s: Student, issue: string, expiry: string, size = 80) {
  const data = buildQrData(s, issue, expiry);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export default function StudentCard({ student }: { student: Student }) {
  // Always show both sides in portal view
  const [side] = useState<'front'|'back'|'both'>('both');
  // Use admin-configured dates (read-only here)
  const [issue, setIssue] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");

  // Prefer dates from Sanity student document; fallback to AdminCards localStorage
  useEffect(() => {
    const sanityIssue = (student as any)?.issueDate || '';
    const sanityExpiry = (student as any)?.expiryDate || '';
    if (sanityIssue) setIssue(sanityIssue);
    if (sanityExpiry) setExpiry(sanityExpiry);
    if (!sanityIssue || !sanityExpiry) {
      try {
        const i = localStorage.getItem('admin_card_issue') || '';
        const e = localStorage.getItem('admin_card_expiry') || '';
        if (!sanityIssue) setIssue(i);
        if (!sanityExpiry) setExpiry(e);
      } catch {}
    }
  }, [student]);

  // Helpers for transparent QR
  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

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
        if (r > 240 && g > 240 && b > 240) d[i+3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch { return ''; }
  };

  const QRPreview = ({ src, size = 80 }: { src: string; size?: number }) => {
    const [out, setOut] = useState<string>('');
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const img = await loadImage(src);
          const data = toTransparentPng(img);
          if (mounted) setOut(data || src);
        } catch { if (mounted) setOut(src); }
      })();
      return () => { mounted = false };
    }, [src]);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={out || src} alt="QR" className="w-20 h-20 rounded border pointer-events-none select-none" style={{ width: size, height: size }} draggable={false} />
    );
  };

  const qrSrc = useMemo(() => getQrSrc(student, issue, expiry, 80), [student, issue, expiry]);

  return (
    <div
      className="select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      tabIndex={0}
      onKeyDown={(e) => {
        // Block common print/save shortcuts
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 's')) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <style jsx global>{`
        /* Hide content during printing from Student Portal */
        @media print { body * { display: none !important; } }
      `}</style>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-center place-items-center mt-20">
        {(side === 'front' || side === 'both') && (
          <div className="w-[189px] h-[321px] bg-white rounded-xl shadow relative overflow-hidden border mx-auto">
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frontBg} alt="front" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" draggable={false} />
            </div>
            <div className="relative z-10 p-3 h-full flex flex-col">
              <div className="mt-[46px] mr-2 flex-1 flex flex-col items-center justify-start">
                <div className="w-[103px] h-[103px] rounded-full overflow-hidden">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
                  ) : null}
                </div>
                {/* Match AdminCards preview typography and spacing */}
                <div className="mt-3 w-full text-center">
                  <div className="mb-1 text-[9px] font-bold text-[#231f55] truncate">{(student.fullName || "").toUpperCase()}</div>
                  {/* Background already has 'SON OF' label */}
                  <div className="mt-[11px] text-[9px] font-bold text-[#231f55] truncate">{(student.fatherName || "").toUpperCase()}</div>
                  <div className="mt-[3.5px] text-[9px] font-bold text-white truncate">Level-{intToRoman(student.admissionFor)}</div>
                </div>
                {/* Secondary values to mirror AdminCards positions and formatting */}
                <div className="mt-[15px] ml-24 w-full text-[9px] text-[#231f55]">
                  <div className="mb-[2px]">
                    <span>{student.rollNumber || ""}</span>
                  </div>
                  <div className="mb-[1px]">
                    <span>{student.grNumber || ""}</span>
                  </div>
                  <div>
                    <span>{student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {(side === 'back' || side === 'both') && (
          <div className="w-[189px] h-[321px] bg-white rounded-xl shadow relative overflow-hidden border mx-auto">
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backBg} alt="back" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" draggable={false} />
            </div>
            <div className="relative z-10 p-3 h-full flex flex-col">
              <div className="mt-[116px] w-full text-[8px] text-[#231f55]">
                {/* QR Code positioned exactly like AdminCards preview */}
                <div className="absolute left-[50px] top-[116px]">
                  <QRPreview src={qrSrc} />
                </div>

                {/* Issue and Expiry dates formatted and positioned */}
                <div className="absolute left-[95px] top-[207px] text-[8px] font-bold text-[#231f55]">
                  <div className="mb-[0.1px]">
                    {issue ? new Date(issue).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </div>
                  <div>
                    {expiry ? new Date(expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </div>
                </div>

                {/* Phone number positioned to match AdminCards */}
                <div className="absolute left-[85px] top-[248px] text-[8px] font-bold text-white">
                  {student.phoneNumber || ''}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
