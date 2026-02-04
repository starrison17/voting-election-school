import React from 'react';
import { Candidate } from '@/types';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onVote: (candidateId: string) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, isSelected, onVote }) => {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
        isSelected ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
      }`}
    >
      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-10 bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 animate-bounce-in">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Selected
        </div>
      )}

      {/* Candidate Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
        <img
          src={candidate.image_url}
          alt={candidate.name}
          className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=1e40af&color=fbbf24&size=300`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-block bg-blue-800 text-white text-xs px-3 py-1 rounded-full">
            {candidate.class_level}
          </span>
        </div>
      </div>

      {/* Candidate Info */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{candidate.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {candidate.manifesto}
        </p>

        {/* Vote Button */}
        <button
          onClick={() => onVote(candidate.id)}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            isSelected
              ? 'bg-yellow-400 text-blue-900 shadow-lg'
              : 'bg-blue-800 text-white hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          {isSelected ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Voted
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Vote
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out; }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CandidateCard;
