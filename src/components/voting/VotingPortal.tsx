import React, { useState, useEffect } from 'react';
import { useVoting } from '@/contexts/VotingContext';
import CandidateCard from './CandidateCard';
import ConfettiEffect from './ConfettiEffect';
import Footer from './Footer';

interface VotingPortalProps {
  onLogout: () => void;
}

const VotingPortal: React.FC<VotingPortalProps> = ({ onLogout }) => {
  const { 
    user, 
    categories, 
    candidates, 
    votes, 
    setVotes, 
    fetchCategories, 
    fetchCandidates,
    submitVotes,
    hasVoted,
    loading,
    logout
  } = useVoting();

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCandidates();
  }, []);

  const currentCategory = categories[currentCategoryIndex];
  const categoryCandidates = candidates.filter(c => c.category_id === currentCategory?.id);
  const progress = categories.length > 0 ? ((currentCategoryIndex + 1) / categories.length) * 100 : 0;
  const allCategoriesVoted = categories.length > 0 && categories.every(cat => votes[cat.id]);

  const handleVote = (candidateId: string) => {
    if (!currentCategory) return;
    setVotes(prev => ({
      ...prev,
      [currentCategory.id]: candidateId
    }));
  };

  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await submitVotes();
    setSubmitting(false);
    
    if (success) {
      localStorage.setItem(`voted_${user?.studentId}`, 'true');
      setShowConfirmation(false);
      setShowConfetti(true);
      setShowSuccess(true);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const getCategoryIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      crown: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
        </svg>
      ),
      sparkles: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      heart: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ),
      book: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      star: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
    };
    return icons[icon] || icons.star;
  };

  if (hasVoted || showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        {showConfetti && <ConfettiEffect />}
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center animate-fade-in">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-8">Your votes have been successfully recorded. Thank you for participating in the student elections!</p>
          <button
            onClick={handleLogout}
            className="px-8 py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading voting portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Student Elections</h1>
                <p className="text-blue-200 text-sm">Welcome, {user?.studentId}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Category {currentCategoryIndex + 1} of {categories.length}
            </span>
            <span className="text-sm font-medium text-blue-800">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-800 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 py-4">
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => setCurrentCategoryIndex(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                  index === currentCategoryIndex
                    ? 'bg-blue-800 text-white shadow-lg'
                    : votes[cat.id]
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getCategoryIcon(cat.icon)}
                <span className="font-medium">{cat.name}</span>
                {votes[cat.id] && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {currentCategory && (
          <div className="animate-fade-in">
            {/* Category Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 text-blue-900 rounded-full mb-4">
                {getCategoryIcon(currentCategory.icon)}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{currentCategory.name}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{currentCategory.description}</p>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {categoryCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={votes[currentCategory.id] === candidate.id}
                  onVote={handleVote}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={handlePrevious}
                disabled={currentCategoryIndex === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentCategoryIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {currentCategoryIndex === categories.length - 1 ? (
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={!allCategoriesVoted}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    allCategoriesVoted
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Submit All Votes
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
                >
                  Next Category
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirm Your Votes</h3>
              <p className="text-gray-600">Are you sure you want to submit your votes? This action cannot be undone.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto">
              {categories.map(cat => {
                const selectedCandidate = candidates.find(c => c.id === votes[cat.id]);
                return (
                  <div key={cat.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-gray-600">{cat.name}</span>
                    <span className="font-semibold text-blue-800">{selectedCandidate?.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirm
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default VotingPortal;
