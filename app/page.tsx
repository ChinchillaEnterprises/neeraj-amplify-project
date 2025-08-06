'use client';

import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import type { Schema } from '@/amplify/data/resource';

// Dynamic import for amplify_outputs
let client: any;
if (typeof window !== 'undefined') {
  import('@/amplify_outputs.json').then((outputs) => {
    Amplify.configure(outputs.default);
    client = generateClient<Schema>();
  }).catch(() => {
    console.log('Amplify outputs not found - running in development mode');
  });
}

export default function LeadScoutPro() {
  const { user, signOut } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('search');
  const [searchParams, setSearchParams] = useState({
    industry: '',
    location: '',
    companySize: '',
    keywords: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchParams.industry && !searchParams.location && !searchParams.keywords) {
      alert('Please enter at least one search parameter');
      return;
    }

    setIsSearching(true);
    try {
      // Create a new search
      const search = await client.models.LeadSearch.create({
        searchName: `${searchParams.industry || 'All'} - ${new Date().toLocaleDateString()}`,
        industry: searchParams.industry,
        location: searchParams.location,
        companySize: searchParams.companySize,
        keywords: searchParams.keywords ? searchParams.keywords.split(',').map(k => k.trim()) : [],
        status: 'pending',
        maxResults: 100,
        includeEmails: true,
        includePhones: true,
        includeSocial: true
      });

      // Trigger the Lambda function (in a real app, this would be done via GraphQL mutation)
      // For now, we'll simulate the search
      setTimeout(async () => {
        // Simulate lead generation
        const mockLeads = generateMockLeads(searchParams);
        
        // Save leads to database
        for (const lead of mockLeads) {
          await client.models.Lead.create({
            ...lead,
            searchId: search.data?.id,
            status: 'new',
            score: Math.floor(Math.random() * 100),
            tags: searchParams.keywords ? searchParams.keywords.split(',').map(k => k.trim()) : []
          });
        }

        // Update search status
        await client.models.LeadSearch.update({
          id: search.data?.id || '',
          status: 'completed',
          totalFound: mockLeads.length,
          processedCount: mockLeads.length,
          completedAt: new Date().toISOString()
        });

        // Refresh the UI
        loadRecentSearches();
        loadLeads();
      }, 3000);

      // Load recent searches
      loadRecentSearches();
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const searches = await client.models.LeadSearch.list({
        limit: 10,
        // sort by createdAt desc
      });
      setRecentSearches(searches.data || []);
    } catch (error) {
      console.error('Error loading searches:', error);
    }
  };

  const loadLeads = async () => {
    try {
      const leadsList = await client.models.Lead.list({
        limit: 100,
      });
      setLeads(leadsList.data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  // Load data on component mount
  useState(() => {
    if (user) {
      loadRecentSearches();
      loadLeads();
    }
  });

  function generateMockLeads(params: any) {
    const leads = [];
    const count = Math.floor(Math.random() * 15) + 5;
    
    for (let i = 0; i < count; i++) {
      leads.push({
        companyName: `${params.industry || 'Tech'} Solutions ${i + 1}`,
        website: `https://${params.industry?.toLowerCase() || 'tech'}company${i + 1}.com`,
        email: `info@company${i + 1}.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        industry: params.industry || 'Technology',
        companySize: ['1-10', '11-50', '51-200', '201-500', '500+'][Math.floor(Math.random() * 5)],
        location: params.location || 'San Francisco, CA',
        city: params.location?.split(',')[0] || 'San Francisco',
        state: params.location?.split(',')[1]?.trim() || 'CA',
        country: 'USA',
        contactName: `Executive ${i + 1}`,
        contactTitle: ['CEO', 'CTO', 'VP Sales', 'CMO'][Math.floor(Math.random() * 4)],
        contactEmail: `contact${i + 1}@company${i + 1}.com`,
        linkedinUrl: `https://linkedin.com/company/company${i + 1}`,
        description: `Leading ${params.industry || 'technology'} company.`,
        founded: String(2010 + Math.floor(Math.random() * 14)),
        employees: Math.floor(Math.random() * 500) + 10,
        source: 'Web Search',
        scrapedAt: new Date().toISOString()
      });
    }
    
    return leads;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6">LeadScout Pro</h1>
          <p className="text-center mb-4">Please sign in to access the lead generation tool</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">LeadScout Pro</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.signInDetails?.loginId}</span>
              <button
                onClick={() => signOut()}
                className="text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New Search
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('searches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'searches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Searches
            </button>
          </nav>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Find New Leads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={searchParams.industry}
                  onChange={(e) => setSearchParams({...searchParams, industry: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={searchParams.companySize}
                  onChange={(e) => setSearchParams({...searchParams, companySize: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Any Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={searchParams.keywords}
                  onChange={(e) => setSearchParams({...searchParams, keywords: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., SaaS, B2B, startup (comma separated)"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search for Leads'}
            </button>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">All Leads</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.companyName}</div>
                          <div className="text-sm text-gray-500">{lead.website}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{lead.contactName}</div>
                          <div className="text-sm text-gray-500">{lead.contactEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.industry}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.companySize}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No leads found. Start a new search to find leads.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Searches Tab */}
        {activeTab === 'searches' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Recent Searches</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentSearches.map((search) => (
                <div key={search.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{search.searchName}</h3>
                      <p className="text-sm text-gray-500">
                        {search.industry && `Industry: ${search.industry}`}
                        {search.location && ` • Location: ${search.location}`}
                        {search.companySize && ` • Size: ${search.companySize}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{search.totalFound || 0} leads found</p>
                      <p className="text-sm text-gray-500">
                        Status: <span className={`font-medium ${
                          search.status === 'completed' ? 'text-green-600' : 
                          search.status === 'running' ? 'text-blue-600' : 
                          search.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                        }`}>{search.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {recentSearches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No searches yet. Start your first search above.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}