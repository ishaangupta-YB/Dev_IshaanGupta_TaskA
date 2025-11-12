"use client";

import { useState } from "react";

interface FAQ {
  id: string;
  title: string;
  body: string;
}

interface SearchResponse {
  results: FAQ[];
  message?: string;
  summary?: string;
  sources?: string[];
  error?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setMessage(null);
    setSummary(null);
    setSources([]);

    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setSubmitted(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data: SearchResponse = await response.json();

      if (response.ok) {
        setResults(data.results || []);
        setMessage(data.message || null);
        setSummary(data.summary || null);
        setSources(data.sources || []);
      } else {
        setError(data.error || "An error occurred while searching");
        setResults([]);
      }
    } catch (err) {
      setError("Failed to connect to the search service");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getSnippet = (body: string): string => {
    return body.length > 150 ? body.substring(0, 150) + "..." : body;
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8 text-center">
          Mini Full-Stack Search
        </h1>

        <form onSubmit={handleSearch} className="mb-8">
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="w-full px-4 py-3 border-2 border-black text-black placeholder-gray-500 focus:outline-none mb-4"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {loading && (
          <div className="border-2 border-black p-6 text-center">
            <p className="text-black font-medium">Searching...</p>
          </div>
        )}

        {!loading && error && (
          <div className="border-2 border-black p-6">
            <p className="text-black font-semibold mb-2">Error</p>
            <p className="text-black">{error}</p>
          </div>
        )}

        {!loading && !error && submitted && results.length === 0 && (
          <div className="border-2 border-black p-6 text-center">
            <p className="text-black font-semibold mb-2">No Results Found</p>
            <p className="text-gray-600">
              {message || "No matches found for your query. Please try different keywords."}
            </p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {summary && (
              <div className="border-2 border-black p-4 mb-4">
                <p className="text-black font-semibold mb-2">Summary</p>
                <p className="text-black">{summary}</p>
                {sources.length > 0 && (
                  <p className="text-gray-600 text-sm mt-2">
                    Sources: {sources.join(", ")}
                  </p>
                )}
              </div>
            )}

            <p className="text-black font-semibold mb-4">
              {message || `Found ${results.length} result${results.length !== 1 ? "s" : ""}`}
            </p>

            {results.map((result) => (
              <div key={result.id} className="border-2 border-black p-6">
                <h3 className="text-lg font-semibold text-black mb-2">
                  {result.title}
                </h3>
                <p className="text-gray-700 mb-2">
                  {getSnippet(result.body)}
                </p>
                <p className="text-xs text-gray-500">ID: {result.id}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && !submitted && (
          <div className="border-2 border-black p-8 text-center">
            <p className="text-black">
              Enter a search query above to find relevant FAQ articles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}