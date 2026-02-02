"use client";

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import ResultsHeader from './ResultsHeader';
import ResultsTable from './ResultsTable';
import ResultDetailDrawer from './ResultDetailDrawer';
import { useSession } from '@/context/SessionContext';

type Quiz = {
  _id: string;
  title: string;
  subject: string;
  resultsAnnounced?: boolean;
  totalQuestions?: number;
  _createdAt?: string;
};

type Result = {
  _id: string;
  quiz?: { _id: string; title: string; subject?: string; resultsAnnounced?: boolean; totalQuestions?: number };
  student?: { _id: string; fullName: string; grNumber?: string; admissionFor?: string };
  studentName?: string;
  studentGrNumber?: string;
  studentRollNumber?: string;
  className?: string;
  studentEmail?: string;
  answers?: number[];
  score: number;
  totalQuestions: number; // Derived
  percentage: number;     // Derived
  grade: string;          // Derived
  status: 'Pass' | 'Fail'; // Derived
  submittedAt?: string;
  _createdAt?: string;
  questionOrder?: number[];
};

const AdminResults = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const { selectedSession } = useSession();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null); // For delete actions
  const [isAnnouncing, setIsAnnouncing] = useState(false); // For announce toggle
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [quizDetail, setQuizDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { user } = useAuth();

  // --- Data Loading ---

  const loadQuizzes = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true); onLoadingChange?.(true);
    try {
      const res = await fetch(`/api/quizzes?limit=200&session=${encodeURIComponent(selectedSession)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.ok) setQuizzes(json.data);
      else throw new Error(json?.error || 'Failed to load quizzes');
    } catch (err: any) {
      console.error('Error loading quizzes:', err);
    } finally { setLoading(false); onLoadingChange?.(false); }
  }, [onLoadingChange, selectedSession]);

  const loadResults = useCallback(async (quizId: string) => {
    if (!quizId || !selectedSession) { setResults([]); return; }
    setLoading(true); onLoadingChange?.(true);
    try {
      const res = await fetch(`/api/quiz-results?quizId=${encodeURIComponent(quizId)}&limit=500&session=${encodeURIComponent(selectedSession)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json?.ok) {
        // Pre-process results for easier consumption
        const processed = (json.data || []).map((r: any) => {
          const total = r.quiz?.totalQuestions ?? (Array.isArray(r.answers) ? r.answers.length : 0);
          const pct = total > 0 ? Math.round((r.score / total) * 100) : 0;
          return {
            ...r,
            totalQuestions: total,
            percentage: pct,
            grade: pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F',
            status: pct >= 40 ? 'Pass' : 'Fail'
          };
        });
        setResults(processed);
      } else {
        throw new Error(json?.error || 'Failed to load results');
      }
    } catch (err: any) {
      console.error('Error loading results:', err);
    } finally { setLoading(false); onLoadingChange?.(false); }
  }, [onLoadingChange, selectedSession]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes, selectedSession]);
  useEffect(() => { loadResults(selectedQuizId); }, [selectedQuizId, loadResults, selectedSession]);

  // Fetch full quiz detail when a result is opened (for question text)
  useEffect(() => {
    const fetchQuizDetail = async () => {
      if (!selectedResult?.quiz?._id) return;

      setDetailLoading(true);
      try {
        // Only fetch if we don't already have the details for this quiz (optimization)
        if (quizDetail?._id === selectedResult.quiz._id) {
          setDetailLoading(false);
          return;
        }

        const res = await fetch(`/api/quizzes?id=${encodeURIComponent(selectedResult.quiz._id)}`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.ok) setQuizDetail(json.data);
      } catch (e) {
        console.error("Failed to load quiz details", e);
        toast.error("Failed to load analysis details");
      } finally {
        setDetailLoading(false);
      }
    };
    fetchQuizDetail();
  }, [selectedResult, quizDetail?._id]);

  // --- Computed Stats ---

  const stats = useMemo(() => {
    if (!results.length) return { totalAttempts: 0, passRate: 0, avgScore: 0, highestScore: 0 };

    const total = results.length;
    const passed = results.filter(r => r.status === 'Pass').length;
    const passRate = Math.round((passed / total) * 100);
    const avg = Math.round(results.reduce((acc, r) => acc + r.score, 0) / total);
    const highest = Math.max(...results.map(r => r.score));

    return {
      totalAttempts: total,
      passRate,
      avgScore: avg,
      highestScore: highest
    };
  }, [results]);

  // --- Actions ---

  const handleToggleAnnounce = async () => {
    const quiz = quizzes.find(q => q._id === selectedQuizId);
    if (!quiz) return;

    setIsAnnouncing(true);
    try {
      const newVal = !quiz.resultsAnnounced;
      const token = await user?.getIdToken();
      await fetch('/api/quizzes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: quiz._id, resultsAnnounced: newVal })
      });

      setQuizzes(prev => prev.map(q => q._id === quiz._id ? { ...q, resultsAnnounced: newVal } : q));
      toast.success(newVal ? 'Results Announced Successfully' : 'Results Hidden Successfully');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsAnnouncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;

    setWorkingId(id);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/quiz-results?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error);

      setResults(prev => prev.filter(r => r._id !== id));
      toast.success('Result deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    } finally {
      setWorkingId(null);
    }
  };

  const handleExport = async () => {
    if (!selectedQuizId) return;
    const quiz = quizzes.find(q => q._id === selectedQuizId);
    if (!quiz) return;

    try {
      // Lazy load dependencies with robust default handling
      const ExcelJS = await import('exceljs').then(m => m.default || m);
      const fileSaver = await import('file-saver').then(m => m.default || m);
      const saveAs = fileSaver.saveAs || fileSaver;

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Results');

      ws.columns = [
        { header: 'Student Name', key: 'name', width: 25 },
        { header: 'Roll No', key: 'roll', width: 15 },
        { header: 'GR No', key: 'gr', width: 15 },
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Total', key: 'total', width: 10 },
        { header: '%', key: 'pct', width: 10 },
        { header: 'Grade', key: 'grade', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Date', key: 'date', width: 20 },
      ];

      // Style Header
      ws.getRow(1).font = { bold: true };

      results.forEach(r => {
        ws.addRow({
          name: r.studentName || r.student?.fullName,
          roll: r.studentRollNumber,
          gr: r.studentGrNumber || r.student?.grNumber,
          class: r.className || r.student?.admissionFor,
          score: r.score,
          total: r.totalQuestions,
          pct: `${r.percentage}%`,
          grade: r.grade,
          status: r.status,
          date: new Date(r.submittedAt || '').toLocaleDateString()
        });
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Results_${quiz.title.replace(/\s+/g, '_')}.xlsx`);

    } catch (e: any) {
      console.error(e);
      toast.error(`Export failed: ${e?.message || 'Check console details'}`);
    }
  };

  return (
    <div className="space-y-8 pb-20">

      {/* Header & Controls */}
      <ResultsHeader
        quizzes={quizzes}
        selectedQuizId={selectedQuizId}
        onSelectQuiz={setSelectedQuizId}
        onRefresh={loadQuizzes}
        loading={loading}
        stats={stats}
        onToggleAnnounce={handleToggleAnnounce}
        isAnnouncing={isAnnouncing}
        announced={quizzes.find(q => q._id === selectedQuizId)?.resultsAnnounced}
        onExport={handleExport}
      />

      {/* Main Data Grid */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <ResultsTable
          results={results}
          loading={loading}
          onViewDetail={setSelectedResult}
          onDelete={handleDelete}
          deletingId={workingId}
        />
      </div>

      {/* Detail Drawer */}
      <ResultDetailDrawer
        result={selectedResult}
        quizDetail={quizDetail}
        loading={detailLoading}
        onClose={() => setSelectedResult(null)}
      />

    </div >
  );
};

export default AdminResults;
