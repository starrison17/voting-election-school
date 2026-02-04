import React, { useState, useEffect } from 'react';
import { useVoting } from '@/contexts/VotingContext';
import { supabase } from '@/lib/supabase';
import { Category, Candidate } from '@/types';
import ResultsExport from './ResultsExport';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface VoteResult {
  candidate_id: string;
  candidate_name: string;
  category_id: string;
  category_name: string;
  vote_count: number;
}

interface ArchivedElection {
  id: string;
  election_name: string;
  archived_at: string;
  total_voters: number;
  results: any;
  archived_by: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { categories, candidates, fetchCategories, fetchCandidates, logout } = useVoting();
  const [activeTab, setActiveTab] = useState<'candidates' | 'categories' | 'results'>('results');
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showArchivedListModal, setShowArchivedListModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Reset/Archive states
  const [archiveName, setArchiveName] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archivedElections, setArchivedElections] = useState<ArchivedElection[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedElection | null>(null);
  
  // Form states
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    category_id: '',
    image_url: '',
    manifesto: '',
    class_level: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'star',
    display_order: 0
  });

  useEffect(() => {
    fetchCategories();
    fetchCandidates();
    fetchResults();
    fetchArchivedElections();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data: votes, error } = await supabase
        .from('votes')
        .select('candidate_id, category_id');

      if (error) throw error;

      const { data: uniqueVotes } = await supabase
        .from('votes')
        .select('student_id');
      
      const uniqueStudents = new Set(uniqueVotes?.map(v => v.student_id));
      setTotalVoters(uniqueStudents.size);

      const voteCounts: Record<string, number> = {};
      votes?.forEach(vote => {
        voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1;
      });

      setResults(
        Object.entries(voteCounts).map(([candidateId, count]) => ({
          candidate_id: candidateId,
          candidate_name: '',
          category_id: '',
          category_name: '',
          vote_count: count
        }))
      );
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedElections = async () => {
    try {
      const { data, error } = await supabase
        .from('archived_elections')
        .select('*')
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedElections(data || []);
    } catch (error) {
      console.error('Error fetching archived elections:', error);
    }
  };

  const handleArchiveResults = async () => {
    if (!archiveName.trim()) {
      alert('Please enter a name for this archive');
      return;
    }

    setArchiving(true);
    try {
      // Build complete results data
      const resultsData = categories.map(category => {
        const categoryCandidates = candidates.filter(c => c.category_id === category.id);
        return {
          category_id: category.id,
          category_name: category.name,
          candidates: categoryCandidates.map(candidate => ({
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            class_level: candidate.class_level,
            vote_count: getVoteCount(candidate.id),
            percentage: getPercentage(candidate.id, category.id)
          }))
        };
      });

      const { error } = await supabase
        .from('archived_elections')
        .insert([{
          election_name: archiveName,
          total_voters: totalVoters,
          results: resultsData,
          archived_by: 'admin'
        }]);

      if (error) throw error;

      setShowArchiveModal(false);
      setArchiveName('');
      fetchArchivedElections();
      alert('Election results archived successfully!');
    } catch (error) {
      console.error('Error archiving results:', error);
      alert('Failed to archive results. Please try again.');
    } finally {
      setArchiving(false);
    }
  };

  const handleResetVotes = async () => {
    if (resetConfirmText !== 'RESET ALL VOTES') {
      alert('Please type "RESET ALL VOTES" to confirm');
      return;
    }

    setResetting(true);
    try {
      // Delete all votes from the database
      const { error } = await supabase
        .from('votes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) throw error;

      // Clear localStorage voting records
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('voted_') || key === 'hasVoted')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      setShowResetModal(false);
      setResetConfirmText('');
      setResults([]);
      setTotalVoters(0);
      fetchResults();
      alert('All votes have been reset successfully!');
    } catch (error) {
      console.error('Error resetting votes:', error);
      alert('Failed to reset votes. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleAddCandidate = async () => {
    try {
      if (editingCandidate) {
        await supabase
          .from('candidates')
          .update(candidateForm)
          .eq('id', editingCandidate.id);
      } else {
        await supabase
          .from('candidates')
          .insert([candidateForm]);
      }
      
      setShowCandidateModal(false);
      setCandidateForm({ name: '', category_id: '', image_url: '', manifesto: '', class_level: '' });
      setEditingCandidate(null);
      fetchCandidates();
    } catch (error) {
      console.error('Error saving candidate:', error);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    
    try {
      await supabase.from('candidates').delete().eq('id', id);
      fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
    }
  };

  const handleAddCategory = async () => {
    try {
      if (editingCategory) {
        await supabase
          .from('categories')
          .update(categoryForm)
          .eq('id', editingCategory.id);
      } else {
        await supabase
          .from('categories')
          .insert([categoryForm]);
      }
      
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '', icon: 'star', display_order: 0 });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All candidates in this category will also be deleted.')) return;
    
    try {
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
      fetchCandidates();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDeleteArchive = async (id: string) => {
    if (!confirm('Are you sure you want to delete this archived election?')) return;
    
    try {
      await supabase.from('archived_elections').delete().eq('id', id);
      fetchArchivedElections();
      if (selectedArchive?.id === id) {
        setSelectedArchive(null);
      }
    } catch (error) {
      console.error('Error deleting archive:', error);
    }
  };

  const openEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setCandidateForm({
      name: candidate.name,
      category_id: candidate.category_id,
      image_url: candidate.image_url,
      manifesto: candidate.manifesto,
      class_level: candidate.class_level
    });
    setShowCandidateModal(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
      display_order: category.display_order
    });
    setShowCategoryModal(true);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const getVoteCount = (candidateId: string) => {
    const result = results.find(r => r.candidate_id === candidateId);
    return result?.vote_count || 0;
  };

  const getCategoryVotes = (categoryId: string) => {
    const categoryCandidates = candidates.filter(c => c.category_id === categoryId);
    return categoryCandidates.reduce((sum, c) => sum + getVoteCount(c.id), 0);
  };

  const getPercentage = (candidateId: string, categoryId: string) => {
    const totalCategoryVotes = getCategoryVotes(categoryId);
    if (totalCategoryVotes === 0) return 0;
    return Math.round((getVoteCount(candidateId) / totalCategoryVotes) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-200 text-sm">Manage elections and view results</p>
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

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Voters</p>
                <p className="text-3xl font-bold text-gray-800">{totalVoters}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Categories</p>
                <p className="text-3xl font-bold text-gray-800">{categories.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Candidates</p>
                <p className="text-3xl font-bold text-gray-800">{candidates.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Archives</p>
                <p className="text-3xl font-bold text-gray-800">{archivedElections.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            {(['results', 'candidates', 'categories'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-blue-800 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-8 animate-fade-in">
                {/* Action Buttons */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <h3 className="text-xl font-bold text-gray-800">Election Results</h3>
                  <div className="flex flex-wrap gap-3">
                    <ResultsExport
                      categories={categories}
                      candidates={candidates}
                      getVoteCount={getVoteCount}
                      totalVoters={totalVoters}
                    />
                    <button
                      onClick={() => setShowArchivedListModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      View Archives
                    </button>
                    <button
                      onClick={() => setShowArchiveModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Archive Results
                    </button>
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Reset Votes
                    </button>
                  </div>
                </div>

                {totalVoters === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-500 mb-2">No Votes Yet</h4>
                    <p className="text-gray-400">Votes will appear here once students start voting.</p>
                  </div>
                ) : (
                  categories.map(category => {
                    const categoryCandidates = candidates.filter(c => c.category_id === category.id);
                    const sortedCandidates = [...categoryCandidates].sort(
                      (a, b) => getVoteCount(b.id) - getVoteCount(a.id)
                    );
                    
                    return (
                      <div key={category.id} className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <span className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-blue-900">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </span>
                          {category.name}
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            ({getCategoryVotes(category.id)} total votes)
                          </span>
                        </h3>
                        
                        <div className="space-y-4">
                          {sortedCandidates.map((candidate, index) => {
                            const percentage = getPercentage(candidate.id, category.id);
                            const isWinner = index === 0 && getVoteCount(candidate.id) > 0;
                            
                            return (
                              <div 
                                key={candidate.id} 
                                className={`bg-white rounded-lg p-4 ${isWinner ? 'ring-2 ring-yellow-400' : ''}`}
                              >
                                <div className="flex items-center gap-4 mb-3">
                                  <img
                                    src={candidate.image_url}
                                    alt={candidate.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=1e40af&color=fbbf24`;
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-800">{candidate.name}</span>
                                      {isWinner && (
                                        <span className="px-2 py-1 bg-yellow-400 text-blue-900 text-xs font-bold rounded-full">
                                          Leading
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-500">{candidate.class_level}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-2xl font-bold text-blue-800">{getVoteCount(candidate.id)}</span>
                                    <span className="text-gray-500 text-sm ml-1">votes</span>
                                  </div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                      isWinner ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-blue-800'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <div className="text-right mt-1 text-sm text-gray-500">{percentage}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Candidates Tab */}
            {activeTab === 'candidates' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Manage Candidates</h3>
                  <button
                    onClick={() => {
                      setEditingCandidate(null);
                      setCandidateForm({ name: '', category_id: '', image_url: '', manifesto: '', class_level: '' });
                      setShowCandidateModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Candidate
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {candidates.map(candidate => {
                    const category = categories.find(c => c.id === candidate.category_id);
                    return (
                      <div key={candidate.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <img
                            src={candidate.image_url}
                            alt={candidate.name}
                            className="w-16 h-16 rounded-xl object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=1e40af&color=fbbf24`;
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{candidate.name}</h4>
                            <p className="text-sm text-gray-500">{candidate.class_level}</p>
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {category?.name}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{candidate.manifesto}</p>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => openEditCandidate(candidate)}
                            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-300 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Manage Categories</h3>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', description: '', icon: 'star', display_order: 0 });
                      setShowCategoryModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(category => (
                    <div key={category.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-blue-900">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{category.name}</h4>
                            <p className="text-sm text-gray-500">Order: {category.display_order}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {candidates.filter(c => c.category_id === category.id).length} candidates
                        </span>
                      </div>
                      <p className="text-gray-600 mt-4">{category.description}</p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => openEditCategory(category)}
                          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-300 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={candidateForm.category_id}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Level</label>
                <input
                  type="text"
                  value={candidateForm.class_level}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, class_level: e.target.value }))}
                  placeholder="e.g., Form 3A"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={candidateForm.image_url}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
                <textarea
                  value={candidateForm.manifesto}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, manifesto: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowCandidateModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCandidate}
                className="flex-1 py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
              >
                {editingCandidate ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <select
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                >
                  <option value="crown">Crown (Prefects)</option>
                  <option value="sparkles">Sparkles (Sanitation)</option>
                  <option value="heart">Heart (Health)</option>
                  <option value="book">Book (Library)</option>
                  <option value="star">Star (Chaplain)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
              >
                {editingCategory ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Archive Election Results</h3>
              <p className="text-gray-600">Save the current election results for future reference before resetting.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Archive Name</label>
              <input
                type="text"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="e.g., 2024 First Term Elections"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Summary:</strong> {totalVoters} voters, {categories.length} categories, {candidates.length} candidates
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setArchiveName('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveResults}
                disabled={archiving || !archiveName.trim()}
                className="flex-1 py-3 bg-yellow-500 text-blue-900 rounded-xl font-semibold hover:bg-yellow-400 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {archiving ? (
                  <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Archive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Votes Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Reset All Votes</h3>
              <p className="text-gray-600">This action will permanently delete all votes and cannot be undone.</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm font-medium mb-2">Warning:</p>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• All {totalVoters} votes will be permanently deleted</li>
                <li>• Students will be able to vote again</li>
                <li>• This action cannot be reversed</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">RESET ALL VOTES</span> to confirm
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET ALL VOTES"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResetVotes}
                disabled={resetting || resetConfirmText !== 'RESET ALL VOTES'}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Reset Votes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archived Elections List Modal */}
      {showArchivedListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Archived Elections</h3>
              <button
                onClick={() => {
                  setShowArchivedListModal(false);
                  setSelectedArchive(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {archivedElections.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <h4 className="text-xl font-semibold text-gray-500 mb-2">No Archives Yet</h4>
                <p className="text-gray-400">Archive your election results to view them here.</p>
              </div>
            ) : selectedArchive ? (
              <div>
                <button
                  onClick={() => setSelectedArchive(null)}
                  className="flex items-center gap-2 text-blue-800 hover:text-blue-600 mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Archives
                </button>
                
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{selectedArchive.election_name}</h4>
                  <p className="text-gray-500 text-sm">
                    Archived on {new Date(selectedArchive.archived_at).toLocaleDateString()} • {selectedArchive.total_voters} voters
                  </p>
                </div>

                <div className="space-y-6">
                  {selectedArchive.results.map((categoryResult: any) => (
                    <div key={categoryResult.category_id} className="bg-gray-50 rounded-xl p-4">
                      <h5 className="font-bold text-gray-800 mb-3">{categoryResult.category_name}</h5>
                      <div className="space-y-2">
                        {categoryResult.candidates
                          .sort((a: any, b: any) => b.vote_count - a.vote_count)
                          .map((candidate: any, index: number) => (
                            <div key={candidate.candidate_id} className="flex items-center justify-between bg-white rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-400 text-blue-900' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {index + 1}
                                </span>
                                <div>
                                  <span className="font-medium text-gray-800">{candidate.candidate_name}</span>
                                  <span className="text-gray-500 text-sm ml-2">({candidate.class_level})</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-blue-800">{candidate.vote_count}</span>
                                <span className="text-gray-500 text-sm ml-1">({candidate.percentage}%)</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedElections.map(archive => (
                  <div key={archive.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{archive.election_name}</h4>
                        <p className="text-gray-500 text-sm">
                          {new Date(archive.archived_at).toLocaleDateString()} • {archive.total_voters} voters
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedArchive(archive)}
                          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-all duration-300 text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteArchive(archive.id)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-300 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
