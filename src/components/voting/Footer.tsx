import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold">Student Elections</span>
            </div>
            <p className="text-blue-200 text-sm">
              A secure and transparent electronic voting system for student elections. 
              Every vote counts, every voice matters.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li className="hover:text-yellow-400 transition-colors cursor-pointer">How to Vote</li>
              <li className="hover:text-yellow-400 transition-colors cursor-pointer">Election Rules</li>
              <li className="hover:text-yellow-400 transition-colors cursor-pointer">Candidate Guidelines</li>
              <li className="hover:text-yellow-400 transition-colors cursor-pointer">Contact Support</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                elections@school.edu
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +233 XX XXX XXXX
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-700 mt-8 pt-6 text-center text-blue-300 text-sm">
          <p>&copy; {new Date().getFullYear()} Student Election System. All rights reserved.</p>
          <p className="mt-1">Designed with integrity and transparency in mind.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
