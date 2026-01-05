'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface Brand {
  id: string;
  name: string;
  description: string;
}

interface Account {
  id: string;
  handle: string;
  brand_id: string;
  is_active: boolean;
  brands?: { name: string };
}

export default function ManagePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Brand form state
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  // Account form state
  const [newAccountHandle, setNewAccountHandle] = useState('');

  useEffect(() => {
    loadBrands();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadAccounts(selectedBrand);
    } else {
      loadAccounts();
    }
  }, [selectedBrand]);

  const loadBrands = async () => {
    const res = await fetch('/api/brands');
    const data = await res.json();
    setBrands(data);
    setLoading(false);
  };

  const loadAccounts = async (brandId?: string) => {
    const url = brandId ? `/api/accounts?brandId=${brandId}` : '/api/accounts';
    const res = await fetch(url);
    const data = await res.json();
    setAccounts(data);
  };

  const createBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;

    await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBrandName, description: newBrandDesc })
    });

    setNewBrandName('');
    setNewBrandDesc('');
    loadBrands();
  };

  const deleteBrand = async (id: string) => {
    if (!confirm('Delete this brand? This will also delete all associated accounts.')) return;

    await fetch(`/api/brands?id=${id}`, { method: 'DELETE' });
    loadBrands();
    loadAccounts();
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountHandle || !selectedBrand) return;

    await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: newAccountHandle, brand_id: selectedBrand })
    });

    setNewAccountHandle('');
    loadAccounts(selectedBrand);
  };

  const toggleAccount = async (account: Account) => {
    await fetch('/api/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: account.id, is_active: !account.is_active })
    });

    loadAccounts(selectedBrand);
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this account?')) return;

    await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    loadAccounts(selectedBrand);
  };

  const runScraper = async (scraper: string) => {
    const res = await fetch('/api/run-scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scraper, brandId: selectedBrand })
    });
    const data = await res.json();
    alert(data.message || data.note);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth provider will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Brands & Accounts</h1>
          <div className="flex gap-4 items-center">
            <div className="text-gray-400 text-sm">
              {user.email}
            </div>
            <Link href="/" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
              Back to Dashboard
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Brands Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Brands</h2>

            {/* Create Brand Form */}
            <form onSubmit={createBrand} className="bg-gray-800 rounded-lg p-4 mb-4">
              <input
                type="text"
                placeholder="Brand name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded mb-2"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newBrandDesc}
                onChange={(e) => setNewBrandDesc(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded mb-2"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700"
              >
                Add Brand
              </button>
            </form>

            {/* Brands List */}
            <div className="space-y-2">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 ${
                    selectedBrand === brand.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedBrand(brand.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{brand.name}</div>
                      {brand.description && (
                        <div className="text-gray-400 text-sm">{brand.description}</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBrand(brand.id);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Accounts Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Competitor Accounts
              {selectedBrand && brands.find(b => b.id === selectedBrand) && (
                <span className="text-lg text-gray-400 ml-2">
                  for {brands.find(b => b.id === selectedBrand)?.name}
                </span>
              )}
            </h2>

            {selectedBrand ? (
              <>
                {/* Create Account Form */}
                <form onSubmit={createAccount} className="bg-gray-800 rounded-lg p-4 mb-4">
                  <input
                    type="text"
                    placeholder="TikTok handle (e.g., cleanmyphone)"
                    value={newAccountHandle}
                    onChange={(e) => setNewAccountHandle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded mb-2"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                  >
                    Add Account
                  </button>
                </form>

                {/* Run Scrapers */}
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2">Run Scrapers</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => runScraper('competitor')}
                      className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                    >
                      Videos
                    </button>
                    <button
                      onClick={() => runScraper('comments')}
                      className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                    >
                      Comments
                    </button>
                    <button
                      onClick={() => runScraper('trends')}
                      className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                    >
                      Trends
                    </button>
                    <button
                      onClick={() => runScraper('all')}
                      className="flex-1 px-3 py-2 bg-purple-600 rounded hover:bg-purple-700 text-sm"
                    >
                      All
                    </button>
                  </div>
                </div>

                {/* Accounts List */}
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-gray-800 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">@{account.handle}</div>
                        <div className={`text-sm ${account.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAccount(account)}
                          className={`px-3 py-1 rounded text-sm ${
                            account.is_active
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {account.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteAccount(account.id)}
                          className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="text-gray-400 text-center py-8">
                      No accounts yet. Add one above!
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Select a brand to manage accounts
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
