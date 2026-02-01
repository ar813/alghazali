"use client";

import React, { useEffect, useState } from "react";
import type { Student } from "@/types/student";

// Helper utility for Roman Numerals
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

const QRPreview = ({ src, size = 80 }: { src: string; size?: number }) => {
    const [out, setOut] = useState<string>('');
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = src;
                await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
                const data = toTransparentPng(img);
                if (mounted) setOut(data || src);
            } catch {
                if (mounted) setOut(src);
            }
        })();
        return () => { mounted = false };
    }, [src]);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={out || src} alt="QR" style={{ width: size, height: size }} />;
};

interface IDCardProps {
    student: Student;
    side: 'front' | 'back';
    issueDate?: string;
    expiryDate?: string;
}

const IDCard = ({ student: s, side, issueDate, expiryDate }: IDCardProps) => {
    const frontBg = "/1.jpeg";
    const backBg = "/2.jpeg";

    // Build QR Data
    const buildQrData = (s: Student) => {
        const dob = (s.dob || '').toString();
        const iss = (s as any).issueDate || issueDate || '';
        const exp = (s as any).expiryDate || expiryDate || '';
        return `Name: ${s.fullName || ''}\nFather Name: ${s.fatherName || ''}\nRoll No: ${s.rollNumber || ''}\nGR NO: ${s.grNumber || ''}\nDOB: ${dob}\nIssue: ${iss}\nExpiry: ${exp}\nPhone: ${s.phoneNumber || ''}`;
    };

    const getQrSrc = (s: Student, size = 80) => {
        const data = buildQrData(s);
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
    };

    if (side === 'front') {
        return (
            <div className="w-[189px] h-[321px] bg-white rounded-xl shadow-lg relative overflow-hidden ring-1 ring-zinc-900/5 mx-auto select-none group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={frontBg} alt="front" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="relative z-10 p-3 h-full flex flex-col">
                    <div className="mt-[46px] mr-2 flex-1 flex flex-col items-center justify-start">
                        <div className="w-[103px] h-[103px] rounded-full overflow-hidden ring-4 ring-white/30 shadow-inner bg-zinc-100">
                            {s.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.photoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                            ) : null}
                        </div>

                        <div className="mt-3 w-full text-center">
                            <div className="mb-1 text-[9px] font-bold text-[#231f55] truncate px-2 font-sans tracking-wide">{(s.fullName || "").toUpperCase()}</div>
                            <div className="mt-[11px] text-[9px] font-bold text-[#231f55] truncate px-2 font-sans tracking-wide">{(s.fatherName || "").toUpperCase()}</div>
                            <div className="mt-[3.5px] text-[9px] font-bold text-white truncate drop-shadow-sm font-mono tracking-wider">LEVEL-{intToRoman(s.admissionFor)}</div>
                        </div>

                        <div className="mt-[15px] ml-24 w-full text-[9px] text-[#231f55] font-medium">
                            <div className="mb-[2px]">
                                <span className="tracking-widest">{s.rollNumber || ""}</span>
                            </div>
                            <div className="mb-[1px]">
                                <span className="tracking-widest">{s.grNumber || ""}</span>
                            </div>
                            <div className={`${s.grNumber ? "" : "mt-[15px]"}`}>
                                <span className="tracking-wider">{s.dob ? new Date(s.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[189px] h-[321px] bg-white rounded-xl shadow-lg relative overflow-hidden ring-1 ring-zinc-900/5 mx-auto select-none group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backBg} alt="back" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="relative z-10 p-3 h-full flex flex-col">
                <div className="mt-[116px] w-full text-[8px] text-[#231f55]">
                    <div className="absolute left-[50px] top-[116px] mix-blend-multiply opacity-90">
                        <QRPreview src={getQrSrc(s, 80)} size={80} />
                    </div>

                    <div className="absolute left-[95px] top-[207px] text-[8px] font-bold text-[#231f55] leading-tight font-mono">
                        <div className="mb-[0.1px]">
                            {((s as any).issueDate || issueDate) ? new Date((s as any).issueDate || issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </div>
                        <div>
                            {((s as any).expiryDate || expiryDate) ? new Date((s as any).expiryDate || expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </div>
                    </div>

                    <div className="absolute left-[85px] top-[248px] text-[8px] font-bold text-white tracking-wider font-mono drop-shadow-md">
                        {s.phoneNumber || ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IDCard;
