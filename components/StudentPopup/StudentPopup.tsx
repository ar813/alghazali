'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

const StudentPopup = ({ onSubmit }: { onSubmit: any }) => {
  const [grNumber, setGrNumber] = useState('');
  const [bFormNumber, setBFormNumber] = useState('');
  const router = useRouter();

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (grNumber && bFormNumber) {
      onSubmit({ grNumber, bFormNumber });
    } else {
      alert('Please fill in both fields');
    }
  };

  const handleClose = () => {
    router.push('/'); // redirect to homepage
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-2xl shadow-xl p-8 w-[90%] max-w-md">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
          aria-label="Close popup"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
          Student Verification
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              GR Number
            </label>
            <input
              type="text"
              value={grNumber}
              onChange={(e) => setGrNumber(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter GR Number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              B-Form Number
            </label>
            <input
              type="text"
              value={bFormNumber}
              onChange={(e) => setBFormNumber(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter B-Form Number"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentPopup;
