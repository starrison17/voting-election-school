export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  display_order: number;
  created_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  category_id: string;
  image_url: string;
  manifesto: string;
  class_level: string;
  created_at: string;
}

export interface Vote {
  id: string;
  candidate_id: string;
  category_id: string;
  student_id: string;
  created_at: string;
}

export interface VoteResult {
  candidate_id: string;
  candidate_name: string;
  category_name: string;
  vote_count: number;
  percentage: number;
}

export interface User {
  role: 'admin' | 'student';
  studentId?: string;
  username?: string;
}
