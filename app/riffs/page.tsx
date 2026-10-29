"use client";

import { useState, useEffect } from "react";
import { 
  Lightbulb, Trash2, Plus, MessageCircle, Mic, Zap, Search, X, Loader2 
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// Kategoriernas färger och ikoner
const CATEGORIES = [
  { name: "Crowdwork", icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { name: "Oneliner", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { name: "Råidé", icon: Lightbulb, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { name: "Scen-anteckning", icon: Mic, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
];

export default function RiffsVault() {
  const [riffs, setRiffs] = useState<any[]>([]);
  const [newContent, setNewContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Alla");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRiffs();
  }, []);

  const fetchRiffs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("riffs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setRiffs(data);
    }
    setIsLoading(false);
  };

  const handleSaveRiff = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newContent.trim()) return;

    setIsSaving(true);
    const { data, error } = await supabase
      .from("riffs")
      .insert([{ 
        content: newContent.trim(), 
        category: selectedCategory 
      }])
      .select()
      .single();

    if (data && !error) {
      setRiffs([data, ...riffs]);
      setNewContent(""); // Töm inmatningsfältet
    } else {
      alert("Kunde inte spara riffet.");
    }
    setIsSaving(false);
  };

  const deleteRiff = async (id: string) => {
    if (window.confirm("Kasta lappen?")) {
      const { error } = await supabase.from("riffs").delete().eq("id", id);
      if (!error) {
        setRiffs(riffs.filter(r => r.id !== id));
      }
    }
  };

  // Filtrera riff baserat på sökning och aktiva kategorifilter
  const filteredRiffs = riffs.filter(riff => {
    const matchesSearch = riff.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "Alla" || riff.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-[100dvh] bg-[#08080c] text-white flex flex-col">
      
      {/* HEADER & INMATNING */}
      <div className="bg-neutral-900/60 border-b border-indigo-950/40 p-4 md:p-8 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="text-yellow-400" size={24} />
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-100">Riff-valvet</h1>
          </div>

          {/* Snabbinmatning */}
          <form onSubmit={handleSaveRiff} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-xl">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Vad tänker du på? (Crowdwork, en skev iakttagelse, en oneliner...)"
              className="w-full bg-transparent text-sm md:text-base text-neutral-200 placeholder-neutral-600 outline-none resize-none min-h-[80px]"
              onKeyDown={(e) => {
                // Spara med Ctrl+Enter eller Cmd+Enter
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSaveRiff();
                }
              }}
            />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-neutral-800/60">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive 
                          ? `${cat.bg} ${cat.border} border ${cat.color}` 
                          : 'bg-neutral-900 text-neutral-500 border border-transparent hover:bg-neutral-800'
                      }`}
                    >
                      <Icon size={12} /> {cat.name}
                    </button>
                  );
                })}
              </div>

              <button 
                type="submit" 
                disabled={isSaving || !newContent.trim()}
                className="bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Kasta in i valvet
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FILTER & SÖKNING */}
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter("Alla")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === "Alla" ? "bg-neutral-200 text-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
              }`}
            >
              Alla
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveFilter(cat.name)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeFilter === cat.name ? "bg-neutral-200 text-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text"
              placeholder="Sök i valvet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* POST-IT GRID */}
        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-neutral-500" size={32} />
          </div>
        ) : filteredRiffs.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-neutral-800 rounded-2xl">
            <Lightbulb className="mx-auto mb-3 text-neutral-600 opacity-50" size={40} />
            <p className="text-neutral-400 text-sm">Valvet ekar tomt.</p>
            <p className="text-neutral-600 text-xs mt-1">Skriv en tanke i boxen ovan för att spara den.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRiffs.map(riff => {
              const categoryDef = CATEGORIES.find(c => c.name === riff.category) || CATEGORIES[2];
              const Icon = categoryDef.icon;

              return (
                <div key={riff.id} className="bg-neutral-900/50 border border-neutral-800 hover:border-neutral-600 transition-colors p-5 rounded-2xl flex flex-col h-full group relative">
                  
                  <div className="flex items-start justify-between mb-3">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${categoryDef.bg} ${categoryDef.color}`}>
                      <Icon size={10} /> {riff.category}
                    </span>
                    <button 
                      onClick={() => deleteRiff(riff.id)}
                      className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap flex-1">
                    {riff.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-neutral-800/50 text-[10px] text-neutral-600 font-mono">
                    {new Date(riff.created_at).toLocaleDateString("sv-SE", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}