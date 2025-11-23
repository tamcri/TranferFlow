import React, { useEffect, useState } from 'react';
import { TransferItem, AIAnalysisResult } from '../types';
import { analyzeMarketTrends } from '../services/geminiService';
import { Sparkles, RefreshCw } from 'lucide-react';

interface MarketInsightsProps {
  items: TransferItem[];
}

export const MarketInsights: React.FC<MarketInsightsProps> = ({ items }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeMarketTrends(items);
    setAnalysis(result);
    setLoading(false);
  };

  // Auto-analyze on mount if not empty
  useEffect(() => {
    if (items.length > 0 && !analysis) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={24} />
          <h2 className="text-xl font-bold">AI Market Insights</h2>
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Aggiorna Analisi"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
        </div>
      ) : analysis ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Panoramica</h4>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Trending</h4>
            <p className="text-lg font-bold text-indigo-300">{analysis.trendingCategory}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Consiglio AI</h4>
            <p className="text-sm text-emerald-300 italic">"{analysis.suggestion}"</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Nessuna analisi disponibile. Clicca aggiorna per analizzare il mercato.</p>
      )}
    </div>
  );
};