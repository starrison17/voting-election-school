import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, Candidate, User, Vote } from '@/types';

interface VotingContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  categories: Category[];
  candidates: Candidate[];
  votes: Record<string, string>;
  setVotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loading: boolean;
  fetchCategories: () => Promise<void>;
  fetchCandidates: () => Promise<void>;
  submitVotes: () => Promise<boolean>;
  hasVoted: boolean;
  setHasVoted: (value: boolean) => void;
  logout: () => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const VotingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('votingUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(() => {
    const saved = localStorage.getItem('hasVoted');
    return saved === 'true';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('votingUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('votingUser');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hasVoted', hasVoted.toString());
  }, [hasVoted]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitVotes = async (): Promise<boolean> => {
    if (!user?.studentId) return false;
    
    setLoading(true);
    try {
      const voteEntries = Object.entries(votes).map(([categoryId, candidateId]) => ({
        candidate_id: candidateId,
        category_id: categoryId,
        student_id: user.studentId,
      }));

      const { error } = await supabase
        .from('votes')
        .insert(voteEntries);

      if (error) throw error;
      
      setHasVoted(true);
      return true;
    } catch (error) {
      console.error('Error submitting votes:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setVotes({});
    localStorage.removeItem('votingUser');
  };

  return (
    <VotingContext.Provider value={{
      user,
      setUser,
      categories,
      candidates,
      votes,
      setVotes,
      loading,
      fetchCategories,
      fetchCandidates,
      submitVotes,
      hasVoted,
      setHasVoted,
      logout,
    }}>
      {children}
    </VotingContext.Provider>
  );
};

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};
