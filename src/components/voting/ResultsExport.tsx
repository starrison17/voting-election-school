import React from 'react';
import { Category, Candidate } from '@/types';

interface ResultsExportProps {
  categories: Category[];
  candidates: Candidate[];
  getVoteCount: (candidateId: string) => number;
  totalVoters: number;
}

const ResultsExport: React.FC<ResultsExportProps> = ({
  categories,
  candidates,
  getVoteCount,
  totalVoters
}) => {
  const exportToCSV = () => {
    const headers = ['Category', 'Candidate Name', 'Class', 'Votes', 'Percentage'];
    const rows: string[][] = [];

    categories.forEach(category => {
      const categoryCandidates = candidates.filter(c => c.category_id === category.id);
      const totalCategoryVotes = categoryCandidates.reduce((sum, c) => sum + getVoteCount(c.id), 0);

      categoryCandidates.forEach(candidate => {
        const votes = getVoteCount(candidate.id);
        const percentage = totalCategoryVotes > 0 
          ? Math.round((votes / totalCategoryVotes) * 100) 
          : 0;

        rows.push([
          category.name,
          candidate.name,
          candidate.class_level,
          votes.toString(),
          `${percentage}%`
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `election_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printResults = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Election Results</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; text-align: center; }
          h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #fbbf24; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #1e40af; color: white; }
          tr:hover { background-color: #f5f5f5; }
          .winner { background-color: #fef3c7; font-weight: bold; }
          .summary { background-color: #f0f9ff; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
          .summary h3 { margin: 0 0 10px 0; color: #1e40af; }
          .progress-bar { height: 20px; background-color: #e5e7eb; border-radius: 10px; overflow: hidden; }
          .progress-fill { height: 100%; background-color: #1e40af; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Student Election Results</h1>
        <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
        
        <div class="summary">
          <h3>Summary</h3>
          <p><strong>Total Voters:</strong> ${totalVoters}</p>
          <p><strong>Categories:</strong> ${categories.length}</p>
          <p><strong>Total Candidates:</strong> ${candidates.length}</p>
        </div>
    `;

    categories.forEach(category => {
      const categoryCandidates = candidates.filter(c => c.category_id === category.id);
      const totalCategoryVotes = categoryCandidates.reduce((sum, c) => sum + getVoteCount(c.id), 0);
      const sortedCandidates = [...categoryCandidates].sort((a, b) => getVoteCount(b.id) - getVoteCount(a.id));

      html += `
        <h2>${category.name}</h2>
        <p style="color: #666;">Total votes in category: ${totalCategoryVotes}</p>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate</th>
              <th>Class</th>
              <th>Votes</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
      `;

      sortedCandidates.forEach((candidate, index) => {
        const votes = getVoteCount(candidate.id);
        const percentage = totalCategoryVotes > 0 
          ? Math.round((votes / totalCategoryVotes) * 100) 
          : 0;
        const isWinner = index === 0 && votes > 0;

        html += `
          <tr class="${isWinner ? 'winner' : ''}">
            <td>${index + 1}</td>
            <td>${candidate.name}${isWinner ? ' (Winner)' : ''}</td>
            <td>${candidate.class_level}</td>
            <td>${votes}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="progress-bar" style="width: 100px;">
                  <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
                ${percentage}%
              </div>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    });

    html += `
        <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
          <p>This is an official document generated by the Student Election System</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
      </button>
      <button
        onClick={printResults}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Results
      </button>
    </div>
  );
};

export default ResultsExport;
