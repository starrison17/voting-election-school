import React, { useState, useEffect } from 'react';
import { VotingProvider, useVoting } from '@/contexts/VotingContext';
import LoginPage from './voting/LoginPage';
import VotingPortal from './voting/VotingPortal';
import AdminDashboard from './voting/AdminDashboard';

// Main App Content Component - Handles routing between login, student portal, and admin dashboard
const AppContent: React.FC = () => {
  const { user } = useVoting();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);

  // Handle login with transition effect
  const handleLogin = () => {
    setPageTransition(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setPageTransition(false);
    }, 300);
  };

  // Handle logout with transition effect
  const handleLogout = () => {
    setPageTransition(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      setPageTransition(false);
    }, 300);
  };

  // Show login page if not logged in
  if (!user || !isLoggedIn) {
    return (
      <div className={`transition-opacity duration-300 ${pageTransition ? 'opacity-0' : 'opacity-100'}`}>
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  // Show appropriate dashboard based on role
  return (
    <div className={`transition-opacity duration-300 ${pageTransition ? 'opacity-0' : 'opacity-100'}`}>
      {user.role === 'admin' ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <VotingPortal onLogout={handleLogout} />
      )}
    </div>
  );
};

// Main App Layout Component - Wraps everything with VotingProvider context
const AppLayout: React.FC = () => {
  return (
    <VotingProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </VotingProvider>
  );
};

export default AppLayout;
