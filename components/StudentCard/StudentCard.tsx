"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Student } from "@/types/student";
import { saveAs } from "file-saver";

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

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

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

  // Read dates from AdminCards configuration (localStorage keys)
  useEffect(() => {
    try {
      const i = localStorage.getItem('admin_card_issue') || '';
      const e = localStorage.getItem('admin_card_expiry') || '';
      setIssue(i);
      setExpiry(e);
    } catch {}
  }, []);

  const qrSrc = useMemo(() => getQrSrc(student, issue, expiry, 80), [student, issue, expiry]);

  const handleSavePdf = async () => {
    const [{ jsPDF }] = await Promise.all([
      import("jspdf"),
    ]);

    const frontImg = await loadImage(frontBg);
    const backImg = await loadImage(backBg);
    // Export at fixed preview size to match admin (189x321)
    const cardW = 189;
    const cardH = 321;
    const doc = new jsPDF({ unit: 'px', format: [cardW, cardH], orientation: 'portrait' });

    const drawFront = async () => {
      doc.addImage(frontImg, 'JPEG', 0, 0, cardW, cardH);
      if (student.photoUrl) {
        try {
          const photo = await loadImage(String(student.photoUrl));
          const pw = 103; const ph = 103; const px = (cardW - pw) / 2; const py = 46;
          doc.addImage(photo, 'JPEG', px, py, pw, ph);
        } catch {}
      }
      doc.setTextColor(35,31,85); doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.text(String(student.fullName||'').toUpperCase(), cardW/2, 159, {align:'center'});
      doc.text(String(student.fatherName||'').toUpperCase(), cardW/2, 177, {align:'center'});
      doc.setTextColor(255,255,255); doc.setFontSize(10);
      doc.text(`Level-${intToRoman(student.admissionFor)}`, cardW/2, 188, {align:'center'});
      doc.setTextColor(35,31,85); doc.setFontSize(10);
      const baseX = Math.min(cardW - 35, 154); let y = 205;
      doc.text(String(student.rollNumber||''), baseX, y, {align:'right'}); y += 16;
      doc.text(String(student.grNumber||''), baseX, y, {align:'right'}); y += 16;
      doc.text(String(student.dob||''), baseX, y, {align:'right'});
    };

    const drawBack = async () => {
      doc.addImage(backImg, 'JPEG', 0, 0, cardW, cardH);
      try {
        const qr = await loadImage(qrSrc);
        const qSize = 80; const qx = (cardW - qSize) / 2; const qy = 105;
        doc.addImage(qr, 'PNG', qx, qy, qSize, qSize);
      } catch {}
      doc.setTextColor(35,31,85); doc.setFontSize(8);
      const tx = Math.min(cardW - 20, 170);
      doc.text(String(issue||''), tx, 205);
      doc.text(String(expiry||''), tx, 215);
      doc.setTextColor(255,255,255); doc.setFontSize(9);
      doc.text(String(student.phoneNumber||''), 120, 232);
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

    const blob = doc.output('blob');
    const roll = (student.rollNumber || student.grNumber || 'student').toString().replace(/[^a-z0-9_-]+/gi, '_');
    saveAs(blob, `${roll}_card.pdf`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3 justify-end">
        <button onClick={handleSavePdf} className="px-5 h-10 md:h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm shadow hover:opacity-95 w-full sm:w-auto">Save PDF</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-center place-items-center">
        {(side === 'front' || side === 'both') && (
          <div className="w-[189px] h-[321px] bg-white rounded-xl shadow relative overflow-hidden border mx-auto">
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frontBg} alt="front" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="relative z-10 p-3 h-full flex flex-col">
              <div className="mt-[46px] mr-2 flex-1 flex flex-col items-center justify-start">
                <div className="w-[103px] h-[103px] rounded-full overflow-hidden">
                  {student.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="mt-3 w-full text-center">
                  <div className="mb-1 text-[11px] font-bold text-[#231f55] truncate">{(student.fullName || "").toUpperCase()}</div>
                  <div className="mt-[7px] text-[11px] font-bold text-[#231f55] truncate">{(student.fatherName || "").toUpperCase()}</div>
                  <div className="mt-[1px] text-[10px] font-semibold text-white truncate ">Level-{intToRoman(student.admissionFor)}</div>
                </div>
                <div className="mt-[14px] ml-24 w-full text-[10px] text-[#231f55]">
                  <div className="flex items-center justify-between"><span className="opacity-80">{student.rollNumber || ""}</span></div>
                  <div className="flex items-center justify-between"><span className="opacity-80">{student.grNumber || ""}</span></div>
                  <div className="flex items-center justify-between"><span className="opacity-80">{student.dob || ""}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {(side === 'back' || side === 'both') && (
          <div className="w-[189px] h-[321px] bg-white rounded-xl shadow relative overflow-hidden border mx-auto">
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backBg} alt="back" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="relative z-10 p-3 h-full flex flex-col">
              <div className="mt-[105px] w-full text-[10px] text-[#231f55]">
                <div className="flex items-center justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="QR" className="w-20 h-20 bg-white rounded border" />
                </div>
                <div className="flex flex-col items-start ml-20">
                  <span className="opacity-80 text-right text-[8px] mt-[2px] ">{issue || ''}</span>
                  <span className="opacity-80 text-right text-[8px]">{expiry || ''}</span>
                </div>
                <div className="mt-[17px] ml-[68px] text-[9px] font-semibold text-white truncate ">{student.phoneNumber || ''}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
