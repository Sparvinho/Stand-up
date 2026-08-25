"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  GitMerge, Plus, Save, Trash2, Check, ArrowRight, 
  FolderOpen, GripVertical, Eraser, X, CornerDownRight, 
  Search, Mic, Briefcase, Edit3, Film, Activity, Info, Zap, Loader2, ArrowUpDown, 
  Sparkles, Filter, Hash, Layers, ChevronUp, ChevronDown 
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function RutinbyggarenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addId = searchParams.get("add");
  
  const [savedRoutines, setSavedRoutines] = useState<any[]>([]);
  const [allBits, setAllBits] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [routineBits, setRoutineBits] = useState<string[]>([]);
  const [hiddenBits, setHiddenBits] = useState<string[]>([]);
  
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
  
  const [copilotSuggestions, setCopilotSuggestions] = useState<any[]>([]);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Hämta skämten
    const { data: bitsData } = await supabase
      .from("bits")
      .select("*")
      .order("created_at", { ascending: false });

    if (bitsData) {
      const safeBits = bitsData.map(b => ({
        ...b,
        id: String(b.id),
        priority: Number(b.priority) || 1,
        tags: Array.isArray(b.tags) ? b.tags : [],
        comedy_tags: Array.isArray(b.comedy_tags) ? b.comedy_tags : []
      }));
      setAllBits(safeBits);
    }

    // NYTT: Hämta från "routines" istället för "setlists"
    const { data: routinesData } = await supabase
      .from("routines")
      .select("*")
      .order("created_at", { ascending: false });

    if (routinesData) {
      const safeData = routinesData.map(r => ({
        ...r,
        bit_ids: Array.isArray(r.bit_ids) ? r.bit_ids.map(String) : [],
        hidden_bit_ids: Array.isArray(r.hidden_bit_ids) ? r.hidden_bit_ids.map(String) : []
      }));
      setSavedRoutines(safeData);
    }
  };

  useEffect(() => {
    if (addId && allBits.length > 0) {
      const bitToAdd = allBits.find(b => String(b.id) === String(addId));
      if (bitToAdd && !routineBits.includes(String(bitToAdd.id))) {
        setRoutineBits(prev => [...prev, String(bitToAdd.id)]);
      }
    }
  }, [addId, allBits]);

  const loadRoutine = (routineObj: any) => {
    setActiveId(routineObj.id);
    setTitle(routineObj.title || "");
    setNotes(routineObj.notes || ""); // Ändrat från venue till notes
    setRoutineBits(Array.isArray(routineObj.bit_ids) ? routineObj.bit_ids.map(String) : []);
    setHiddenBits(Array.isArray(routineObj.hidden_bit_ids) ? routineObj.hidden_bit_ids.map(String) : []);
    setCopilotSuggestions([]);
  };

  const startNew = () => {
    setActiveId(null);
    setTitle("");
    setNotes("");
    setRoutineBits([]);
    setHiddenBits([]);
    setCopilotSuggestions([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const cleanBitIds = routineBits.map(String);
    const cleanHiddenIds = hiddenBits.map(String);

    if (activeId !== null && activeId !== undefined) {
      const { error } = await supabase
        .from("routines")
        .update({
          title,
          notes, // Spara i notes
          bit_ids: cleanBitIds,
          hidden_bit_ids: cleanHiddenIds
        })
        .eq("id", activeId);
        
      if (!error) {
        showSaved();
        await fetchData();
      } else {
        alert("Databasfel: " + error.message);
      }
    } else {
      const { data, error } = await supabase
        .from("routines")
        .insert([{
          title,
          notes, // Spara i notes
          bit_ids: cleanBitIds,
          hidden_bit_ids: cleanHiddenIds
        }])
        .select()
        .single();
        
      if (data && !error) {
        setActiveId(data.id);
        showSaved();
        await fetchData();
      } else if (error) {
        alert("Databasfel: " + error.message);
      }
    }
    setIsSaving(false);
  };

  const handleSaveAndNavigate = async (bitId: string) => {
    if (!title) {
      alert("Ge din rutin en titel först!");
      return;
    }
    setIsSaving(true);
    const cleanBitIds = routineBits.map(String);
    const cleanHiddenIds = hiddenBits.map(String);

    if (activeId !== null && activeId !== undefined) {
      await supabase.from("routines").update({
        title,
        notes,
        bit_ids: cleanBitIds,
        hidden_bit_ids: cleanHiddenIds
      }).eq("id", activeId);
    } else {
      const { data } = await supabase.from("routines").insert([{
        title,
        notes,
        bit_ids: cleanBitIds,
        hidden_bit_ids: cleanHiddenIds
      }]).select().single();
      if (data) setActiveId(data.id);
    }
    setIsSaving(false);
    router.push(`/workshop?id=${bitId}`);
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteRoutine = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    if (window.confirm("Radera denna rutin?")) {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (!error) {
        if (activeId === id) startNew();
        fetchData();
      }
    }
  };

  const addBit = (bitId: string) => {
    const idStr = String(bitId);
    if (!routineBits.includes(idStr)) {
      setRoutineBits([...routineBits, idStr]);
      setCopilotSuggestions([]);
    }
  };

  const removeBit = (e: React.MouseEvent, bitId: string) => {
    e.stopPropagation();
    const idStr = String(bitId);
    setRoutineBits(routineBits.filter(id => id !== idStr));
    setCopilotSuggestions([]);
  };

  const moveBit = (index: number, direction: 'up' | 'down') => {
    const newRoutine = [...routineBits];
    
    if (direction === 'up' && index > 0) {
      const temp = newRoutine[index - 1];
      newRoutine[index - 1] = newRoutine[index];
      newRoutine[index] = temp;
    } else if (direction === 'down' && index < newRoutine.length - 1) {
      const temp = newRoutine[index + 1];
      newRoutine[index + 1] = newRoutine[index];
      newRoutine[index] = temp;
    }
    
    setRoutineBits(newRoutine);
    setCopilotSuggestions([]);
  };

  const toggleHidden = (e: React.ChangeEvent<HTMLInputElement>, bitId: string) => {
    const idStr = String(bitId);
    if (e.target.checked) {
      setHiddenBits([...hiddenBits, idStr]);
    } else {
      setHiddenBits(hiddenBits.filter(id => id !== idStr));
    }
  };

  const clearHiddenBits = () => {
    setHiddenBits([]);
  };

  const getMoodStyle = (mood: string) => {
    switch(mood) {
      case "Trött": return { bg: "bg-slate-500", border: "border-slate-500/50", badge: "bg-slate-900 border-slate-700 text-slate-300" };
      case "Deppig": return { bg: "bg-blue-500", border: "border-blue-500/50", badge: "bg-blue-900 border-blue-700 text-blue-300" };
      case "Arrogant": return { bg: "bg-purple-500", border: "border-purple-500/50", badge: "bg-purple-900 border-purple-700 text-purple-300" };
      case "Spelat oskuldsfull": return { bg: "bg-cyan-500", border: "border-cyan-500/50", badge: "bg-cyan-950 border-cyan-800 text-cyan-400" };
      case "Sarkastisk": return { bg: "bg-orange-500", border: "border-orange-500/50", badge: "bg-orange-950 border-orange-800 text-orange-400" };
      case "Upprörd": return { bg: "bg-red-500", border: "border-red-500/50", badge: "bg-red-950 border-red-800 text-red-400" };
      case "Retstickig": return { bg: "bg-pink-500", border: "border-pink-500/50", badge: "bg-pink-950 border-pink-800 text-pink-400" };
      default: return { bg: "bg-neutral-800", border: "border-neutral-700/50", badge: "bg-neutral-900 border-neutral-800 text-neutral-500" };
    }
  };

  const activeBitsList = routineBits.map(id => allBits.find(b => String(b.id) === String(id))).filter(Boolean);

  const fetchCopilotSuggestions = async () => {
    if (activeBitsList.length === 0) return;
    setIsCopilotLoading(true);
    const lastBit = activeBitsList[activeBitsList.length - 1];
    const available = allBits.filter(b => !routineBits.includes(String(b.id)) && !hiddenBits.includes(String(b.id)));
    
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentBit: lastBit, availableBits: available }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setCopilotSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Fel vid Copilot-anrop:", err);
    }
    setIsCopilotLoading(false);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newRoutine = [...routineBits];
    const draggedBitId = newRoutine.splice(draggedIndex, 1)[0];
    newRoutine.splice(dropIndex, 0, draggedBitId);
    setRoutineBits(newRoutine);
    setDraggedIndex(null);
    setCopilotSuggestions([]);
  };

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    allBits.forEach(b => {
      (b.tags || []).forEach((t: string) => {
        const clean = t.trim().toLowerCase();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);
  }, [allBits]);

  const filteredAvailableBits = useMemo(() => {
    let list = allBits
      .filter(bit => !routineBits.includes(String(bit.id)))
      .filter(bit => bit.status !== "Pensionerad" && bit.status !== "Burned");

    switch (gigProfile) {
      case 'foretag':
        list = list.filter(b => (b.priority ?? 0) >= 2 && b.status !== 'Råidé' && b.status !== 'Omarbeta');
        break;
      case 'test':
        list = list.filter(b => b.status === 'Råidé' || b.status === 'Omarbeta');
        break;
      case 'special':
        list = list.filter(b => b.priority === 3);
        break;
      case 'klubb':
      case 'ingen':
      default:
        break;
    }

    if (minPriority > 0) {
      list = list.filter(bit => (bit.priority || 1) >= minPriority);
    }
    if (selectedStatus !== "Alla") {
      list = list.filter(bit => bit.status?.toLowerCase() === selectedStatus.toLowerCase());
    }
    if (selectedRole !== "Alla") {
      list = list.filter(bit => bit.role?.toLowerCase() === selectedRole.toLowerCase());
    }
    if (selectedRisk !== "Alla") {
      list = list.filter(bit => bit.risk_level?.toLowerCase() === selectedRisk.toLowerCase());
    }
    if (selectedFormat !== "Alla") {
      list = list.filter(bit => bit.format?.toLowerCase() === selectedFormat.toLowerCase());
    }
    if (selectedTag) {
      list = list.filter(bit => bit.tags?.some((t: string) => t.toLowerCase() === selectedTag.toLowerCase()));
    }
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

    return list.sort((a, b) => {
      const aHidden = hiddenBits.includes(String(a.id));
      const bHidden = hiddenBits.includes(String(b.id));
      if (aHidden && !bHidden) return 1;
      if (!aHidden && bHidden) return -1;
      if (sortBy === "priority-desc") return (b.priority || 1) - (a.priority || 1);
      if (sortBy === "priority-asc") return (a.priority || 1) - (b.priority || 1);
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0;
    });
  }, [allBits, routineBits, searchQuery, selectedStatus, gigProfile, minPriority, sortBy, selectedRole, selectedRisk, selectedFormat, selectedTag, hiddenBits]);


  return (
    // FULL HÖJD MED 100DVH OCH OVERFLOW-HANTERING
    <div className="min-h-[100dvh] md:h-[100dvh] flex flex-col md:flex-row bg-[#0c0a09] text-neutral-100 md:overflow-hidden">
      
      {/* Vänster Meny: Sparade Rutiner (Amber / Orange Tema) */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-amber-950/30 bg-neutral-900/40 p-4 md:p-6 flex flex-col h-[35dvh] md:h-full shrink-0">
        <div className="mb-4 md:mb-6 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-amber-400 flex items-center gap-2 tracking-wide">
            <GitMerge className="text-amber-500" size={18} /> Rutin-Arkiv
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Block-labb
          </span>
        </div>
        
        <button
          onClick={startNew}
          className="w-full mb-4 md:mb-6 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold py-2 md:py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-950/30 text-xs md:text-sm"
        >
          <Plus size={16} /> Nytt Rutin-Block
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 pr-1 md:pr-2 scrollbar-hide">
          {savedRoutines.map((routineObj) => (
            <div
              key={routineObj.id}
              onClick={() => loadRoutine(routineObj)}
              className={`p-3 md:p-4 rounded-xl cursor-pointer border transition-all group ${
                activeId === routineObj.id
                  ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-amber-900/50'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-stone-200 group-hover:text-amber-300 transition-colors truncate pr-2 text-xs md:text-sm">
                  {routineObj.title || "Namnlöst block"}
                </h3>
                <button
                  onClick={(e) => deleteRoutine(e, routineObj.id)}
                  className="text-neutral-600 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="text-[10px] md:text-xs text-stone-500 truncate">
                {routineObj.notes || "Inga anteckningar"}
              </p>
              <div className="flex items-center gap-2 mt-2 md:mt-3">
                <span className="text-[9px] md:text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded">
                  {routineObj.bit_ids ? routineObj.bit_ids.length : 0} länkade bitar
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Höger Sida: Byggaren (Rutin-arkitektur) */}
      <div className="flex-1 p-4 md:p-10 flex flex-col md:h-full md:overflow-y-auto">
        
        {/* Rutin Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 shrink-0 border-b border-amber-950/20 pb-4 gap-4">
          <div className="flex-1 w-full max-w-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Rutin / Materialkedja</span>
            </div>
            <input
              type="text"
              placeholder="Namn på rutinen (t.ex. Dejting-blocket)..."
              className="bg-transparent text-xl md:text-3xl font-bold outline-none text-stone-100 placeholder-neutral-700 w-full mb-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Konceptuell tanke, övergångar eller mål med rutinen..."
              className="bg-transparent outline-none text-xs md:text-sm text-neutral-400 w-full placeholder-neutral-700"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleSave}
              disabled={isSaving || !title}
              className={`flex-1 lg:flex-none justify-center items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                saved ? "bg-green-600 text-white" : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-950/30"
              } ${(isSaving || !title) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? "Sparat!" : "Spara Rutin"}
            </button>
          </div>
        </div>

        <div className="flex-none xl:flex-1 flex flex-col xl:flex-row gap-4 md:gap-6 mt-2 xl:mt-0 pb-10 xl:pb-0">
          
          {/* VÄNSTER: Materialpalett */}
          <div className="flex-1 bg-neutral-900/50 border border-neutral-800/80 rounded-xl flex flex-col overflow-hidden h-[50dvh] xl:h-auto min-h-[350px]">
            <div className="p-3 md:p-4 border-b border-neutral-800 space-y-2 md:space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-stone-300 text-xs md:text-sm flex items-center gap-2">
                  <FolderOpen size={14} className="text-amber-500" /> Välj Bitar ({filteredAvailableBits.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-1 text-[10px] md:text-xs font-medium px-2 py-1 md:px-2.5 md:py-1 rounded-md border transition-colors ${
                      showAdvancedFilters ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Filter size={10} className="md:w-3 md:h-3" /> Filter
                  </button>
                  {hiddenBits.length > 0 && (
                    <button
                      onClick={clearHiddenBits}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800 transition-colors"
                    >
                      <Eraser size={12} /> Återställ {hiddenBits.length}
                    </button>
                  )}
                </div>
              </div>

              {/* Betyg & Sortering */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/50">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mr-1">Betyg:</span>
                  {[
                    { label: "Alla", val: 0 },
                    { label: "★ 1+", val: 1 },
                    { label: "★★ 2+", val: 2 },
                    { label: "★★★ 3", val: 3 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => setMinPriority(p.val)}
                      className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold transition-all ${
                        minPriority === p.val ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "bg-neutral-950 text-neutral-500 hover:text-neutral-300 border border-neutral-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUpDown size={12} className="text-neutral-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 text-[10px] md:text-xs text-neutral-300 rounded px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="priority-desc">Bäst först (★★★ → ★)</option>
                    <option value="priority-asc">Lägst prioritet (★ → ★★★)</option>
                    <option value="newest">Senast skapade</option>
                    <option value="title">Titel (A-Ö)</option>
                  </select>
                </div>
              </div>

              {/* Avancerade filter */}
              {showAdvancedFilters && (
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-3 space-y-2.5 text-xs animate-in fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Roll</label>
                      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 outline-none">
                        <option value="Alla">Alla roller</option>
                        <option value="Öppnare">Öppnare</option>
                        <option value="Story">Mellanbit / Story</option>
                        <option value="Callback">Callback</option>
                        <option value="Stängare">Stängare</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Risknivå</label>
                      <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 outline-none">
                        <option value="Alla">Alla nivåer</option>
                        <option value="Familj/Företag">Trygg/Företag</option>
                        <option value="Klubb">Klubb standard</option>
                        <option value="Mörkt">Late Night / Mörkt</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Format</label>
                      <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 outline-none">
                        <option value="Alla">Alla format</option>
                        <option value="oneliner">Oneliner</option>
                        <option value="observation">Kort observation</option>
                        <option value="story">Lång bit / Story</option>
                      </select>
                    </div>
                  </div>
                  {topTags.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800/60">
                      <div className="flex flex-wrap gap-1">
                        {topTags.map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              selectedTag === t ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                            }`}
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sökfält & Status */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Sök bitar att bygga kedjan med..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-[10px] md:text-xs text-neutral-300 rounded-lg px-2 md:px-2.5 py-1.5 outline-none"
                >
                  <option value="Alla">Alla statusar</option>
                  <option value="Klubbklar">Klubbklar</option>
                  <option value="Testad">Testad</option>
                  <option value="Råidé">Råidé</option>
                  <option value="Omarbeta">Omarbeta</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2">
              {filteredAvailableBits.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center mt-10">Inga bitar matchade din sökning.</p>
              ) : (
                filteredAvailableBits.map(bit => {
                  const isHidden = hiddenBits.includes(String(bit.id));
                  return (
                    <div
                      key={bit.id}
                      onClick={() => addBit(bit.id)}
                      className={`p-2.5 md:p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                        isHidden ? 'bg-neutral-950/40 border-neutral-900 opacity-40 grayscale' : 'bg-neutral-950 border-neutral-800/80 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 pr-3 flex-1 overflow-hidden">
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isHidden}
                            onChange={(e) => toggleHidden(e, bit.id)}
                            className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 truncate">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs font-semibold truncate ${isHidden ? 'text-neutral-600 line-through' : 'text-stone-200'}`}>
                              {bit.title}
                            </h4>
                            <div className="flex items-center gap-1 shrink-0">
                              {[1, 2, 3].map(s => (
                                <div key={s} className={`w-1.5 h-1.5 rounded-full ${bit.priority >= s ? 'bg-amber-500' : 'bg-neutral-800'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">{bit.premise}</p>
                        </div>
                      </div>
                      {!isHidden && (
                        <button className="text-neutral-600 group-hover:text-amber-400 bg-neutral-900 p-1.5 rounded shrink-0">
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* HÖGER: Rutinkedjan */}
          <div className="flex-1 h-[60dvh] xl:h-auto min-h-[400px] bg-amber-950/10 border border-amber-900/30 rounded-xl flex flex-col overflow-hidden shadow-inner">
            <div className="p-3 md:p-4 border-b border-amber-950/30 bg-neutral-900/80 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-amber-300 text-xs md:text-sm flex items-center gap-2">
                  <Layers size={14} className="text-amber-400 md:w-4 md:h-4" /> Bit-kedja i Rutinen
                </h3>
                <p className="text-[10px] md:text-xs text-neutral-500 mt-0.5">{activeBitsList.length} sammanlänkade bitar</p>
              </div>
              {activeBitsList.length > 0 && (
                <button
                  onClick={fetchCopilotSuggestions}
                  disabled={isCopilotLoading}
                  className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/30 px-2 py-1 md:px-3 md:py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {isCopilotLoading ? <Loader2 size={10} className="animate-spin md:w-[13px] md:h-[13px]" /> : <Sparkles size={10} className="md:w-[13px] md:h-[13px]" />}
                  Föreslå länk
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3">
              {activeBitsList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-neutral-800/80 rounded-lg p-6 text-center">
                  <GitMerge size={32} className="mb-2 opacity-20 text-amber-500" />
                  <p className="text-sm font-medium">Rutinkedjan är tom.</p>
                  <p className="text-xs text-neutral-600 mt-1">Klicka in bitar från vänster för att skapa tematiska block!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {activeBitsList.map((bit, index) => {
                      const mood = getMoodStyle(bit.mood);
                      return (
                        <div
                          key={bit.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, index)}
                          onDragOver={(e) => onDragOver(e, index)}
                          onDrop={(e) => onDrop(e, index)}
                          onDoubleClick={() => handleSaveAndNavigate(bit.id)}
                          className={`p-2.5 md:p-3 bg-neutral-950 border-l-4 ${mood.border} border-y border-r border-neutral-800 rounded-lg flex items-center justify-between shadow-sm cursor-grab active:cursor-grabbing hover:border-amber-500/40 transition-colors ${draggedIndex === index ? 'opacity-50 border-dashed' : 'opacity-100'}`}
                        >
                          <div className="flex items-center gap-2 md:gap-2.5 w-full">
                            <GripVertical size={16} className="text-neutral-600 hidden md:block" />
                            
                            {/* Mobila Upp/Ner-pilar */}
                            <div className="flex flex-col gap-1 md:hidden bg-neutral-900 rounded p-1 mr-1">
                              <button onClick={(e) => { e.stopPropagation(); moveBit(index, 'up'); }} disabled={index === 0} className="text-neutral-500 hover:text-white disabled:opacity-20">
                                <ChevronUp size={16}/>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); moveBit(index, 'down'); }} disabled={index === activeBitsList.length - 1} className="text-neutral-500 hover:text-white disabled:opacity-20">
                                <ChevronDown size={16}/>
                              </button>
                            </div>

                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] md:text-xs font-mono font-bold text-amber-500/80">#{index + 1}</span>
                                <h4 className="text-xs md:text-sm font-semibold text-stone-200">{bit.title}</h4>
                                {bit.mood && (
                                  <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${mood.badge}`}>
                                    {bit.mood}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => removeBit(e, bit.id)}
                            className="text-neutral-600 hover:text-red-400 p-1 md:p-1.5 transition-colors shrink-0 ml-1 md:ml-2"
                          >
                            <Trash2 size={14} className="md:w-[15px] md:h-[15px]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {copilotSuggestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-amber-950/40">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles size={11} /> Föreslagna övergångar
                        </label>
                        <button onClick={() => setCopilotSuggestions([])} className="text-neutral-500 text-xs hover:text-white">Dölj</button>
                      </div>
                      <div className="space-y-1.5">
                        {copilotSuggestions.map((sug, idx) => {
                          const candidate = allBits.find(b => String(b.id) === String(sug.bitId));
                          if (!candidate) return null;
                          return (
                            <div
                              key={idx}
                              onClick={() => addBit(candidate.id)}
                              className="p-2.5 bg-neutral-950 border border-amber-900/30 hover:border-amber-500/60 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                            >
                              <div className="flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                                    {sug.track}
                                  </span>
                                  <span className="text-xs font-semibold text-stone-200">{candidate.title}</span>
                                </div>
                                <p className="text-[11px] text-neutral-400 italic mt-0.5">"{sug.reason}"</p>
                              </div>
                              <Plus size={14} className="text-amber-500 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Rutinbyggaren() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex justify-center p-20"><Loader2 className="animate-spin text-amber-500" size={32} /></div>}>
      <RutinbyggarenContent />
    </Suspense>
  );
}