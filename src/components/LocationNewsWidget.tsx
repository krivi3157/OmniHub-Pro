import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw } from 'lucide-react';

interface LocationNewsWidgetProps {
  city: string;
}

export default function LocationNewsWidget({ city }: LocationNewsWidgetProps) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectedCity, setDetectedCity] = useState(city || 'Mahbubnagar');

  const fetchNews = async (targetCity: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news/location?location=${encodeURIComponent(targetCity)}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {
      console.error('Failed to fetch local news:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const city = 'Mahbubnagar';
    setDetectedCity(city);
    fetchNews(city);
  }, []);

  const getTimeElapsed = (publishedAt: string) => {
    const diff = Date.now() - new Date(publishedAt).getTime();
    const hours = Math.floor(diff / 3600000);
    return `${hours}h`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 h-full flex flex-col" id="location_news_widget">
      {/* News Section */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-emerald-500" />
            {detectedCity} News
          </h3>
          <button onClick={() => fetchNews(detectedCity)} className="text-slate-500 hover:text-white cursor-pointer transition-colors"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500 font-mono animate-pulse">Syncing local bulletins...</div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {articles.length > 0 ? (
              articles.map((a, i) => (
                <div key={i} className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-3 flex gap-3">
                  {a.urlToImage && (
                    <img src={a.urlToImage} alt={a.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className='flex flex-col justify-center'>
                      <h4 className="text-xs font-bold text-slate-100 leading-tight mb-1">{a.title}</h4>
                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span>{a.source?.name}</span>
                        <span>{getTimeElapsed(a.publishedAt)}</span>
                      </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-600 font-mono">No local news found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
