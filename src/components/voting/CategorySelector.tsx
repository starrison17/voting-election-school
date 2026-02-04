import React from 'react';
import { Category } from '@/types';

interface CategorySelectorProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  completedCategories: string[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  onSelectCategory,
  completedCategories
}) => {
  const getCategoryIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      crown: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
        </svg>
      ),
      sparkles: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      heart: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ),
      book: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      star: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
    };
    return icons[icon] || icons.star;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Select a Category
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Choose a category to view candidates and cast your vote. You can vote for one candidate in each category.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Your Progress</span>
            <span className="text-yellow-400 font-bold">
              {completedCategories.length} / {categories.length} completed
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCategories.length / categories.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const isCompleted = completedCategories.includes(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`group relative bg-white rounded-2xl p-6 shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl text-left overflow-hidden ${
                  isCompleted ? 'ring-4 ring-green-400' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Completed Badge */}
                {isCompleted && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Voted
                  </div>
                )}

                {/* Background Decoration */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                {/* Icon */}
                <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-yellow-400 text-blue-900 group-hover:bg-blue-800 group-hover:text-yellow-400'
                }`}>
                  {getCategoryIcon(category.icon)}
                </div>

                {/* Content */}
                <h3 className="relative text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-800 transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="relative text-gray-600 text-sm mb-4">
                  {category.description}
                </p>

                {/* Action Indicator */}
                <div className="relative flex items-center text-blue-800 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>{isCompleted ? 'Change Vote' : 'Vote Now'}</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        {completedCategories.length === categories.length && (
          <div className="mt-12 text-center animate-bounce-in">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">All Categories Complete!</h3>
              <p className="text-blue-200 mb-6">You've voted in all categories. Ready to submit?</p>
              <button className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Submit All Votes
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default CategorySelector;
