'use client';

import { useState, useEffect } from 'react';
import { getProductImage } from '@/lib/getProductImage';
import { Button } from '@/components/ui/button';

export default function TestImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string>('');
  const [envStatus, setEnvStatus] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Check environment variables
    setEnvStatus({
      SERPAPI_KEY: !!process.env.NEXT_PUBLIC_SERPAPI_KEY,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_KEY
    });
  }, []);

  const testProduct = {
    name: "Coca Cola",
    category: "Beverages"
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setImageSource('');
    
    try {
      const result = await getProductImage(testProduct.name, testProduct.category);
      if (result.error) {
        setError(result.error);
      }
      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
        setImageSource(result.fromCache ? 'Cache' : result.error ? 'Fallback' : 'SerpAPI');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch image');
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Image Fetching Test</h1>
      
      {/* Environment Variables Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Variables Status:</h2>
        <ul className="space-y-1">
          {Object.entries(envStatus).map(([key, exists]) => (
            <li key={key} className={exists ? "text-green-600" : "text-red-600"}>
              {key}: {exists ? "✅ Loaded" : "❌ Missing"}
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={handleTest} disabled={loading}>
        {loading ? 'Loading...' : 'Test Image Fetch'}
      </Button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {imageUrl && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">Source:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              imageSource === 'Cache' ? 'bg-blue-100 text-blue-700' :
              imageSource === 'SerpAPI' ? 'bg-green-100 text-green-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {imageSource}
            </span>
          </div>
          <img 
            src={imageUrl} 
            alt={testProduct.name}
            className="w-64 h-64 object-cover rounded border"
          />
        </div>
      )}
    </div>
  );
} 