"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FolderOpen, Search, Mic, Briefcase, Edit3, Film, X, 
  ArrowUpDown, Filter, Hash, Plus, ArrowRight, Loader2, Activity, Trash2 
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Library() {
  const router = useRouter();
  const [allBits, setAllBits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Alla");
  const [gigProfile, setGigProfile] = useState<string>("ingen");
  const [minPriority, setMinPriority] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("priority-desc");
  
  const [selectedRole, setSelectedRole] = useState("Alla");
  const [selectedRisk, setSelectedRisk] = useState("Alla");
  const [selectedFormat, setSelectedFormat] = useState("Alla");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchBits();
  }, []);

  const fetchBits = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bits")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (data) {
      const safeBits = data.map(b => ({
        ...b,
        id: String(b.id),
        priority: Number(b.priority) || 1,
        tags: Array.isArray(b.tags) ? b.tags : [],
        comedy_tags: Array.isArray(b.comedy_tags) ? b.comedy_tags : []
      }));
      setAllBits(safeBits);
    } else if (error) {
      console.error("Fel vid hämtning av skämt:", error);
    }
    setIsLoading(false);
  };

  // NYTT: Funktion för att slänga skämt direkt från valvet
  const handleDeleteBit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Viktigt! Hindrar kortet från att öppnas i Workshopen när vi klickar på papperskorgen
    
    if (window.confirm("Är du säker på att du vill slänga det här skämtet? Det går inte att ångra.")) {
      const { error } = await supabase.from("bits").delete().eq("id", id);
      
      if (!error) {
        // Filtrera bort det raderade skämtet direkt så vi slipper ladda om hela sidan
        setAllBits(prev => prev.filter(bit => bit.id !== id));
      } else {
        alert("Kunde inte radera skämtet: " + error.message);
      }
    }
  };

  const getMoodStyle = (mood: string) => {
    switch(mood) {
      case "Trött": return { bg: "bg-slate-500", border: "border-slate-500/50", text: "text-slate-400", badge: "bg-slate-900 border-slate-700 text-slate-300" };
      case "Deppig": return { bg: "bg-blue-500", border: "border-blue-500/50", text: "text-blue-400", badge: "bg-blue-900 border-blue-700 text-blue-300" };
      case "Arrogant": return { bg: "bg-purple-500", border: "border-purple-500/50", text: "text-purple-400", badge: "bg-purple-900 border-purple-700 text-purple-300" };
      case "Spelat oskuldsfull": return { bg: "bg-cyan-500", border: "border-cyan-500/50", text: "text-cyan-400", badge: "bg-cyan-950 border-cyan-800 text-cyan-400" };
      case "Sarkastisk": return { bg: "bg-orange-500", border: "border-orange-500/50", text: "text-orange-400", badge: "bg-orange-950 border-orange-800 text-orange-400" };
      case "Upprörd": return { bg: "bg-red-500", border: "border-red-500/50", text: "text-red-400", badge: "bg-red-950 border-red-800 text-red-400" };
      case "Retstickig": return { bg: "bg-pink-500", border: "border-pink-500/50", text: "text-pink-400", badge: "bg-pink-950 border-pink-800 text-pink-400" };
      default: return { bg: "bg-neutral-800", border: "border-neutral-700/50", text: "text-neutral-500", badge: "bg-neutral-900 border-neutral-800 text-neutral-500" };
    }
  };

  const calculatePowerScore = (stats: any) => {
    if (!stats || !stats.current) return 0;
    const { guld, bra, bomb } = stats.current;
    const total = (guld || 0) + (bra || 0) + (bomb || 0);
    if (total === 0) return 0;
    return (((guld || 0) * 5) + ((bra || 0) * 4) + ((bomb || 0) * 1)) / total;
  };

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    allBits.forEach(b => {
      (b.tags || []).forEach((t: string) => {
        const clean = t.trim().toLowerCase();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag]) => tag);
  }, [allBits]);

  const filteredBits = useMemo(() => {
    let list = allBits.filter(bit => bit.status !== "Pensionerad" && bit.status !== "Burned");
    
    switch (gigProfile) {
      case 'foretag': list = list.filter(b => (b.priority ?? 0) >= 2 && b.status !== 'Råidé' && b.status !== 'Omarbeta'); break;
      case 'test': list = list.filter(b => b.status === 'Råidé' || b.status === 'Omarbeta'); break;
      case 'special': list = list.filter(b => b.priority === 3); break;
      case 'klubb': case 'ingen': default: break;
    }
    
    if (minPriority > 0) list = list.filter(bit => (bit.priority || 1) >= minPriority);
    if (selectedStatus !== "Alla") list = list.filter(bit => bit.status?.toLowerCase() === selectedStatus.toLowerCase());
    if (selectedRole !== "Alla") list = list.filter(bit => bit.role?.toLowerCase() === selectedRole.toLowerCase());
    if (selectedRisk !== "Alla") list = list.filter(bit => bit.risk_level?.toLowerCase() === selectedRisk.toLowerCase());
    if (selectedFormat !== "Alla") list = list.filter(bit => bit.format?.toLowerCase() === selectedFormat.toLowerCase());
    if (selectedTag) list = list.filter(bit => bit.tags?.some((t: string) => t.toLowerCase() === selectedTag.toLowerCase()));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(bit => {
        const matchTitle = bit.title?.toLowerCase().includes(q);
        const matchPremise = bit.premise?.toLowerCase().includes(q);
        const matchTags = bit.tags?.some((t: string) => t.toLowerCase().includes(q));
        const matchComedyTags = bit.comedy_tags?.some((ct: string) => ct.toLowerCase().includes(q));
        return matchTitle || matchPremise || matchTags || matchComedyTags;
      });
    }
    
    list = [...list].sort((a, b) => {
      if (sortBy === "priority-desc") return (b.priority || 1) - (a.priority || 1);
      if (sortBy === "priority-asc") return (a.priority || 1) - (b.priority || 1);
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0;
    });
    
    return list;
  }, [allBits, searchQuery, selectedStatus, gigProfile, minPriority, sortBy, selectedRole, selectedRisk, selectedFormat, selectedTag]);

  return (
    <div className="h-full flex flex-col bg-neutral-950 p-6 md:p-10 overflow-hidden text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="text-blue-500" size={32} /> Bibliotek
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Visar {filteredBits.length} av {allBits.length} skämt</p>
        </div>
        <button onClick={() => router.push("/workshop")} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm">
          <Plus size={16} /> Skapa Nytt Skämt
        </button>
      </div>

      {/* Filtersektion */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4 mb-6 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">Gig-Profil</label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setGigProfile('ingen')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${gigProfile === 'ingen' ? 'bg-neutral-700 text-white' : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'}`}><X size={12}/> Ingen profil</button>
              <button onClick={() => setGigProfile('klubb')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${gigProfile === 'klubb' ? 'bg-blue-600 text-white' : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'}`}><Mic size={12}/> Klubb</button>
              <button onClick={() => setGigProfile('foretag')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${gigProfile === 'foretag' ? 'bg-indigo-600 text-white' : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'}`}><Briefcase size={12}/> Företag</button>
              <button onClick={() => setGigProfile('test')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${gigProfile === 'test' ? 'bg-orange-600 text-white' : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'}`}><Edit3 size={12}/> Test-mick</button>
              <button onClick={() => setGigProfile('special')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${gigProfile === 'special' ? 'bg-purple-600 text-white' : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'}`}><Film size={12}/> Special</button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mr-1">Betyg:</span>
              {[{ label: "Alla", val: 0 }, { label: "★ 1+", val: 1 }, { label: "★★ 2+", val: 2 }, { label: "★★★ 3", val: 3 }].map((p) => (
                <button key={p.val} onClick={() => setMinPriority(p.val)} className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${minPriority === p.val ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" : "bg-neutral-950 text-neutral-500 hover:text-neutral-300 border border-neutral-800"}`}>{p.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <ArrowUpDown size={14} className="text-neutral-500" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-neutral-700">
                <option value="priority-desc">Bäst först (★★★ → ★)</option>
                <option value="priority-asc">Lägst prioritet (★ → ★★★)</option>
                <option value="newest">Senast skapade</option>
                <option value="title">Titel (A-Ö)</option>
              </select>
            </div>
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${showAdvancedFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}>
              <Filter size={14} /> Fler Filter
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3 space-y-3 text-xs animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Roll</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-300 outline-none"><option value="Alla">Alla roller</option><option value="Öppnare">Öppnare</option><option value="Story">Mellanbit / Story</option><option value="Callback">Callback</option><option value="Stängare">Stängare</option></select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Risknivå</label>
                <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-300 outline-none"><option value="Alla">Alla nivåer</option><option value="Familj/Företag">Trygg/Företag</option><option value="Klubb">Klubb standard</option><option value="Mörkt">Late Night / Mörkt</option></select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Format</label>
                <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-300 outline-none"><option value="Alla">Alla format</option><option value="oneliner">Oneliner</option><option value="observation">Kort observation</option><option value="story">Lång bit / Story</option></select>
              </div>
            </div>
            {topTags.length > 0 && (
              <div className="pt-2 border-t border-neutral-800/60">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1"><Hash size={12} /> Populära tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map(t => (
                    <button key={t} onClick={() => setSelectedTag(selectedTag === t ? null : t)} className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${selectedTag === t ? 'bg-blue-600 text-white font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'}`}>#{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input type="text" placeholder="Sök bland skämt (titel, text, tags)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500/50" />
            {searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"><X size={14}/></button>)}
          </div>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-300 rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-neutral-700">
            <option value="Alla">Alla statusar</option><option value="Klubbklar">Klubbklar</option><option value="Testad">Testad</option><option value="Råidé">Råidé</option><option value="Omarbeta">Omarbeta</option>
          </select>
        </div>
      </div>

      {/* Skämtlistan / Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : filteredBits.length === 0 ? (
          <div className="text-center text-neutral-600 mt-20">
            <FolderOpen size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-base font-medium">Inga skämt matchade din filtrering.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
            {filteredBits.map((bit) => {
              const mood = getMoodStyle(bit.mood);
              const powerScore = calculatePowerScore(bit.gig_stats);
              const totalSwipes = bit.gig_stats?.current ? (bit.gig_stats.current.guld + bit.gig_stats.current.bra + bit.gig_stats.current.bomb) : 0;

              return (
                <div key={bit.id} onClick={() => router.push(`/workshop?id=${bit.id}`)} className={`p-4 bg-neutral-900 border ${mood.border} hover:border-blue-500/50 rounded-xl cursor-pointer transition-all flex flex-col justify-between group shadow-sm`}>
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors truncate">{bit.title || "Namnlös"}</h3>
                      <div className="flex items-center gap-1.5 shrink-0 mt-1">
                        {totalSwipes > 0 && (
                          <div title="Power Ranking" className="flex items-center gap-1 text-[10px] font-black text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 mr-1">
                            <Activity size={10} /> {powerScore.toFixed(1)}
                          </div>
                        )}
                        {[1, 2, 3].map((s) => (
                          <div key={s} className={`w-1.5 h-1.5 rounded-full ${bit.priority >= s ? "bg-yellow-500" : "bg-neutral-800"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-neutral-400 text-xs line-clamp-2 mb-3">{bit.premise || "Ingen text"}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 mt-auto">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {bit.mood && <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${mood.badge}`}>{bit.mood}</span>}
                      {bit.status && <span className="text-[10px] px-2 py-0.5 bg-neutral-950 text-neutral-400 border border-neutral-800 rounded">{bit.status}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Papperskorgen - dyker bara upp när man hovrar över kortet */}
                      <button 
                        onClick={(e) => handleDeleteBit(e, bit.id)}
                        className="text-neutral-600 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1"
                        title="Släng skämt"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ArrowRight size={14} className="text-neutral-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
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