"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  ListMusic, Plus, Save, Trash2, Check, MapPin, ArrowRight, 
  FolderOpen, GripVertical, Eraser, Play, X, CornerDownRight, 
  Search, Mic, Briefcase, Edit3, Film, Activity, Info, Loader2, ArrowUpDown, Sparkles, Filter, Clock, Pause, RotateCcw, Sliders, CalendarCheck, AlertOctagon, Printer, Flame, MessageSquare, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SkipForward
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function SetlistsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addId = searchParams.get("add");
  
  const [savedSetlists, setSavedSetlists] = useState<any[]>([]);
  const [allBits, setAllBits] = useState<any[]>([]);
  
  const [activeId, setActiveId] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [performedAt, setPerformedAt] = useState<string | null>(null);
  
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(15); 
  const [pacingBuffer, setPacingBuffer] = useState<number>(15);

  const [setlist, setSetlist] = useState<string[]>([]);
  const [hiddenBits, setHiddenBits] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Alla");
  const [gigProfile, setGigProfile] = useState<string>("ingen");
  const [minPriority, setMinPriority] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("priority-desc");
  const [selectedRole, setSelectedRole] = useState("Alla");
  const [selectedRisk, setSelectedRisk] = useState("Alla");
  const [selectedFormat, setSelectedFormat] = useState("Alla");
  const [selectedMood, setSelectedMood] = useState("Alla");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [copilotSuggestions, setCopilotSuggestions] = useState<any[]>([]);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [isGigMode, setIsGigMode] = useState(false);
  const [gigPhase, setGigPhase] = useState<'live' | 'eval-overall' | 'eval-bits'>('live');
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [overallGigScore, setOverallGigScore] = useState<number>(0);
  const [gigNotes, setGigNotes] = useState("");
  const [bitScores, setBitScores] = useState<Record<string, number>>({});
  const [currentEvalIndex, setCurrentEvalIndex] = useState(0);

  const [isPrintMode, setIsPrintMode] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isGigMode && gigPhase === 'live' && isTimerRunning) {
      interval = setInterval(() => {
        setLiveSeconds(sec => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGigMode, gigPhase, isTimerRunning]);

  useEffect(() => {
    if (isPrintMode) {
      const timer = setTimeout(() => { window.print(); }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintMode]);

  const fetchData = async () => {
    const { data: bitsData } = await supabase.from("bits").select("*").order("created_at", { ascending: false });

    if (bitsData) {
      const safeBits = bitsData.map(b => ({
        ...b,
        id: String(b.id),
        priority: Number(b.priority) || 1,
        duration_seconds: b.duration_seconds !== null && b.duration_seconds !== undefined ? Number(b.duration_seconds) : 0,
        tags: Array.isArray(b.tags) ? b.tags : [],
        comedy_tags: Array.isArray(b.comedy_tags) ? b.comedy_tags : []
      }));
      setAllBits(safeBits);
    }

    const { data: setlistsData } = await supabase.from("setlists").select("*").order("created_at", { ascending: false });

    if (setlistsData) {
      const safeData = setlistsData.map(r => ({
        ...r,
        bit_ids: Array.isArray(r.bit_ids) ? r.bit_ids.map(String) : [],
        hidden_bit_ids: Array.isArray(r.hidden_bit_ids) ? r.hidden_bit_ids.map(String) : [],
        evaluations: r.evaluations || {}
      }));
      setSavedSetlists(safeData);
    }
  };

  useEffect(() => {
    if (addId && allBits.length > 0) {
      const bitToAdd = allBits.find(b => String(b.id) === String(addId));
      if (bitToAdd && !setlist.includes(String(bitToAdd.id))) {
        setSetlist(prev => [...prev, String(bitToAdd.id)]);
      }
    }
  }, [addId, allBits]);

  const loadSetlist = (setlistObj: any) => {
    setActiveId(setlistObj.id);
    setTitle(setlistObj.title || "");
    setVenue(setlistObj.venue || "");
    setPerformedAt(setlistObj.performed_at || null);
    setSetlist(Array.isArray(setlistObj.bit_ids) ? setlistObj.bit_ids.map(String) : []);
    setHiddenBits(Array.isArray(setlistObj.hidden_bit_ids) ? setlistObj.hidden_bit_ids.map(String) : []);
    
    if (setlistObj.evaluations) {
      setOverallGigScore(setlistObj.evaluations.overall || 0);
      setGigNotes(setlistObj.evaluations.notes || "");
      setBitScores(setlistObj.evaluations.bits || {});
    } else {
      setOverallGigScore(0);
      setGigNotes("");
      setBitScores({});
    }
    setCopilotSuggestions([]);
  };

  const startNew = () => {
    setActiveId(null);
    setTitle("");
    setVenue("");
    setPerformedAt(null);
    setSetlist([]);
    setHiddenBits([]);
    setOverallGigScore(0);
    setGigNotes("");
    setBitScores({});
    setCopilotSuggestions([]);
  };

  const handleSave = async (markAsPerformed = false) => {
    setIsSaving(true);
    const cleanBitIds = setlist.map(String);
    const cleanHiddenIds = hiddenBits.map(String);

    if (activeId !== null && activeId !== undefined) {
      const { error } = await supabase.from("setlists").update({ 
        title, venue, bit_ids: cleanBitIds, hidden_bit_ids: cleanHiddenIds 
      }).eq("id", activeId);
      if (!error) { showSaved(); await fetchData(); }
    } else {
      const { data, error } = await supabase.from("setlists").insert([{ 
        title, venue, bit_ids: cleanBitIds, hidden_bit_ids: cleanHiddenIds 
      }]).select().single();
      if (data && !error) { setActiveId(data.id); showSaved(); await fetchData(); }
    }
    setIsSaving(false);
  };

  const handleRecordingToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsTimerRunning(true);
    } else {
      setIsRecording(false);
    }
  };

  const handleSwipe = (bitId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    let score = 0;
    if (direction === 'up') score = 5;      
    if (direction === 'right') score = 4;   
    if (direction === 'left') score = 1;    
    if (direction === 'down') score = 0;    

    setBitScores(prev => ({ ...prev, [bitId]: score }));
    setCurrentEvalIndex(prev => prev + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, bitId: string) => {
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    
    if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) handleSwipe(bitId, 'right');
        else handleSwipe(bitId, 'left');
      } else {
        if (dy > 0) handleSwipe(bitId, 'down');
        else handleSwipe(bitId, 'up');
      }
    }
  };

  const finishEvaluationAndSave = async () => {
    setIsSaving(true);
    const currentPerformedAt = new Date().toISOString();
    const cleanBitIds = setlist.map(String);
    
    const evaluationData = { overall: overallGigScore, notes: gigNotes, bits: bitScores };

    if (activeId) {
      await supabase.from("setlists").update({ 
        performed_at: currentPerformedAt, evaluations: evaluationData 
      }).eq("id", activeId);
    } else {
      const { data } = await supabase.from("setlists").insert([{ 
        title, venue, bit_ids: cleanBitIds, hidden_bit_ids: hiddenBits.map(String),
        performed_at: currentPerformedAt, evaluations: evaluationData 
      }]).select().single();
      if (data) setActiveId(data.id);
    }

    const bitIdsToUpdate = Object.keys(bitScores).filter(id => bitScores[id] > 0);

    if (bitIdsToUpdate.length > 0) {
      const { data: bitsToUpdate } = await supabase
        .from("bits")
        .select("id, gig_stats")
        .in("id", bitIdsToUpdate);

      for (const bit of bitsToUpdate || []) {
        const score = bitScores[bit.id];
        const stats = bit.gig_stats || { current: { guld: 0, bra: 0, bomb: 0 }, historical: { guld: 0, bra: 0, bomb: 0 } };
        
        if (!stats.current) stats.current = { guld: 0, bra: 0, bomb: 0 };
        if (!stats.historical) stats.historical = { guld: 0, bra: 0, bomb: 0 };

        if (score === 5) { stats.current.guld++; stats.historical.guld++; }
        if (score === 4) { stats.current.bra++; stats.historical.bra++; }
        if (score === 1) { stats.current.bomb++; stats.historical.bomb++; }

        let newPriority = 2; 
        let newStatus = "Redo";

        if (score === 5) {
          newPriority = 3; 
          newStatus = "Klubbklar";
        } else if (score === 4) {
          newPriority = 2; 
          newStatus = "Redo";
        } else if (score === 1) {
          newPriority = 1; 
          newStatus = "Omarbeta";
        }

        await supabase.from("bits").update({
          priority: newPriority,
          status: newStatus,
          gig_stats: stats
        }).eq("id", bit.id);
      }
    }

    setPerformedAt(currentPerformedAt);
    await fetchData();
    setIsGigMode(false);
    setGigPhase('live');
    setCurrentEvalIndex(0);
    setIsSaving(false);
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteSetlist = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    if (window.confirm("Radera denna setlist?")) {
      const { error } = await supabase.from("setlists").delete().eq("id", id);
      if (!error) { if (activeId === id) startNew(); fetchData(); }
    }
  };

  const addBit = (bitId: string) => {
    if (performedAt) return;
    const idStr = String(bitId);
    if (!setlist.includes(idStr)) { setSetlist([...setlist, idStr]); setCopilotSuggestions([]); }
  };

  const removeBit = (e: React.MouseEvent, bitId: string) => {
    e.stopPropagation();
    if (performedAt) return;
    const idStr = String(bitId);
    setSetlist(setlist.filter(id => id !== idStr));
    setCopilotSuggestions([]);
  };

  const moveBit = (index: number, direction: 'up' | 'down') => {
    if (performedAt) return;
    const newSetlist = [...setlist];
    
    if (direction === 'up' && index > 0) {
      const temp = newSetlist[index - 1];
      newSetlist[index - 1] = newSetlist[index];
      newSetlist[index] = temp;
    } else if (direction === 'down' && index < newSetlist.length - 1) {
      const temp = newSetlist[index + 1];
      newSetlist[index + 1] = newSetlist[index];
      newSetlist[index] = temp;
    }
    
    setSetlist(newSetlist);
    setCopilotSuggestions([]);
  };

  const toggleHidden = (e: React.ChangeEvent<HTMLInputElement>, bitId: string) => {
    const idStr = String(bitId);
    if (e.target.checked) setHiddenBits([...hiddenBits, idStr]);
    else setHiddenBits(hiddenBits.filter(id => id !== idStr));
  };

  const clearHiddenBits = () => {
    setHiddenBits([]);
  };

  const clearFilters = () => {
    setSelectedStatus("Alla");
    setGigProfile("ingen");
    setMinPriority(0);
    setSortBy("priority-desc");
    setSelectedRole("Alla");
    setSelectedRisk("Alla");
    setSelectedFormat("Alla");
    setSelectedMood("Alla");
    setSelectedTag(null);
    setSearchQuery("");
  };

  const handleProfileChange = (profile: string) => {
    setGigProfile(profile);
    if (profile !== 'test' && selectedStatus === 'Testa') {
      setSelectedStatus('Alla');
    }
  };

  const activeFilterCount = 
    (gigProfile !== "ingen" ? 1 : 0) +
    (minPriority > 0 ? 1 : 0) +
    (selectedStatus !== "Alla" ? 1 : 0) +
    (selectedRole !== "Alla" ? 1 : 0) +
    (selectedRisk !== "Alla" ? 1 : 0) +
    (selectedFormat !== "Alla" ? 1 : 0) +
    (selectedMood !== "Alla" ? 1 : 0) +
    (selectedTag ? 1 : 0);

  const calculatePowerScore = (stats: any) => {
    if (!stats || !stats.current) return 0;
    const { guld, bra, bomb } = stats.current;
    const total = (guld || 0) + (bra || 0) + (bomb || 0);
    if (total === 0) return 0;
    return (((guld || 0) * 5) + ((bra || 0) * 4) + ((bomb || 0) * 1)) / total;
  };

  const setlistBits = setlist.map(id => allBits.find(b => String(b.id) === String(id))).filter(Boolean);

  const rawMaterialSeconds = useMemo(() => {
    return setlistBits.reduce((acc, bit) => acc + (bit.duration_seconds ?? 0), 0);
  }, [setlistBits]);

  const adjustedSeconds = Math.round(rawMaterialSeconds * (1 + pacingBuffer / 100));
  const totalMinutes = Math.floor(adjustedSeconds / 60);
  const remainingSeconds = adjustedSeconds % 60;
  const targetSeconds = targetDurationMinutes * 60;
  const isOverTime = adjustedSeconds > targetSeconds;

  const getCollisionWarning = (bitId: string) => {
    if (gigProfile === 'test') return null; 
    if (!venue || venue.trim() === "") return null;
    const pastGigsAtVenue = savedSetlists.filter(s => s.id !== activeId && s.performed_at && s.venue?.toLowerCase().includes(venue.toLowerCase()));
    for (const gig of pastGigsAtVenue) {
      if (gig.bit_ids?.includes(String(bitId))) {
        const dateStr = new Date(gig.performed_at).toLocaleDateString("sv-SE", { day: 'numeric', month: 'short', year: 'numeric' });
        return `Körd här ${dateStr}`;
      }
    }
    return null;
  };

  const fetchCopilotSuggestions = async () => {
    if (setlistBits.length === 0) return;
    setIsCopilotLoading(true);
    const lastBit = setlistBits[setlistBits.length - 1];
    const available = allBits.filter(b => !setlist.includes(String(b.id)) && !hiddenBits.includes(String(b.id)));
    try {
      const res = await fetch("/api/copilot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentBit: lastBit, availableBits: available }),
      });
      const data = await res.json();
      if (data.suggestions) setCopilotSuggestions(data.suggestions);
    } catch (err) { console.error("Fel vid Copilot-anrop:", err); }
    setIsCopilotLoading(false);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    if (performedAt) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
  };
  
  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (performedAt || draggedIndex === null || draggedIndex === dropIndex) return;
    const newSetlist = [...setlist];
    const draggedBitId = newSetlist.splice(draggedIndex, 1)[0];
    newSetlist.splice(dropIndex, 0, draggedBitId);
    setSetlist(newSetlist);
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
    // Dölj skämt som redan är i setlistan, och göm "Burned" såvida vi inte explicit valt det
    let list = allBits
      .filter(bit => !setlist.includes(String(bit.id)))
      .filter(bit => bit.status !== "Pensionerad");
      
    if (selectedStatus !== "Burned") {
      list = list.filter(bit => bit.status !== "Burned");
    }

    switch (gigProfile) {
      case 'foretag':
      // ... resten av koden förblir orörd!
        list = list.filter(b => (b.priority ?? 0) >= 2 && b.status !== 'Råidé' && b.status !== 'Omarbeta' && b.status !== 'Testa');
        break;
      case 'test':
        list = list.filter(b => b.status === 'Råidé' || b.status === 'Omarbeta' || b.status === 'Testa');
        break;
      case 'special':
        list = list.filter(b => b.priority === 3);
        break;
      case 'klubb':
      case 'ingen':
      default:
        break;
    }

    if (minPriority > 0) list = list.filter(bit => (bit.priority || 1) >= minPriority);
    
    if (selectedStatus !== "Alla") {
      list = list.filter(bit => {
        const s = bit.status?.toLowerCase();
        const target = selectedStatus.toLowerCase();
        if (target === "redo") return s === "redo" || s === "testad";
        return s === target;
      });
    }

    if (selectedRole !== "Alla") list = list.filter(bit => bit.role?.toLowerCase() === selectedRole.toLowerCase());
    if (selectedRisk !== "Alla") list = list.filter(bit => bit.risk_level?.toLowerCase() === selectedRisk.toLowerCase());
    if (selectedFormat !== "Alla") list = list.filter(bit => bit.format?.toLowerCase() === selectedFormat.toLowerCase());
    if (selectedMood !== "Alla") list = list.filter(bit => bit.mood?.toLowerCase() === selectedMood.toLowerCase());
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
  }, [allBits, setlist, searchQuery, selectedStatus, gigProfile, minPriority, sortBy, selectedRole, selectedRisk, selectedFormat, selectedMood, selectedTag, hiddenBits]);


  if (isPrintMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-white text-black p-4 md:p-16 overflow-y-auto">
        <button onClick={() => setIsPrintMode(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-neutral-500 hover:text-black bg-neutral-200 rounded-full transition-colors print:hidden">
          <X size={24} />
        </button>
        <div className="max-w-3xl mx-auto font-sans">
          <div className="border-b-4 border-black pb-4 mb-6 md:mb-8 mt-8 md:mt-0">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight">{title || "Namnlös Setlist"}</h1>
            {venue && <div className="mt-2 text-xl md:text-2xl font-bold text-neutral-600">📍 {venue}</div>}
          </div>
          <ol className="space-y-4 list-decimal list-inside text-2xl md:text-4xl font-black tracking-tight">
            {setlistBits.map((bit) => (
              <li key={bit.id} className="pl-2 border-b border-neutral-300 pb-3">
                <span className="leading-tight">{bit.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  if (isGigMode) {
    
    if (gigPhase === 'live') {
      const liveMin = Math.floor(liveSeconds / 60);
      const liveSec = liveSeconds % 60;
      const timeLeft = targetSeconds - liveSeconds;
      const timerColor = timeLeft < 0 ? "text-red-500 animate-pulse" : timeLeft <= 120 ? "text-yellow-400" : "textgreen-400";

      return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col p-4 md:p-12 overflow-y-auto">
          <div className="flex flex-col md:flex-row items-center md:justify-between border-b border-neutral-800 pb-6 mb-6 md:mb-8 gap-4 md:gap-6 text-center md:text-left">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-neutral-500 uppercase tracking-widest">{title || "Namnlös Setlist"}</h1>
            </div>

            <div className="flex items-center gap-4 md:gap-6 bg-neutral-950 border border-neutral-800 px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-xl w-full md:w-auto justify-between md:justify-center">
              <div className="flex flex-col items-center">
                <span className={`text-4xl md:text-5xl font-mono font-black ${timerColor}`}>{String(liveMin).padStart(2, '0')}:{String(liveSec).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-2 border-l border-neutral-800 pl-4">
                
                <button 
                  onClick={handleRecordingToggle} 
                  className={`p-2 md:p-3 rounded-full transition-all ${isRecording ? 'bg-red-600/20 text-red-500 animate-pulse' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
                  title={isRecording ? "Inspelning rullar" : "Starta Inspelning & Timer"}
                >
                  <Mic size={24} />
                </button>

                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-2 md:p-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-colors">
                  {isTimerRunning ? <Pause size={20} /> : <Play size={20} className="fill-white" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
              {!performedAt && (
                <button onClick={() => { setGigPhase('eval-overall'); setIsTimerRunning(false); setIsRecording(false); }} className="w-full md:w-auto justify-center px-4 md:px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                  <Check size={18} /> Avsluta Gig
                </button>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto w-full space-y-8 md:space-y-10 pb-24">
            {setlistBits.map((bit, index) => (
              <div key={bit.id} className="flex gap-4 md:gap-6 items-start border-l-4 border-neutral-800 pl-4 md:pl-8">
                <span className="text-2xl md:text-3xl font-black text-neutral-700 shrink-0 mt-1 md:mt-2">{index + 1}.</span>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">{bit.title}</h2>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (gigPhase === 'eval-overall') {
      return (
        <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 max-w-xl w-full">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Bra jobbat på scen! 🎤</h2>
            <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">Dags att utvärdera giget medan det är färskt i minnet.</p>

            <div className="mb-6 md:mb-8">
              <label className="block text-xs md:text-sm font-bold text-neutral-300 mb-3">Hur kändes giget i sin helhet?</label>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button 
                    key={s} onClick={() => setOverallGigScore(s)}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all ${overallGigScore >= s ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-neutral-700 bg-neutral-950 text-neutral-600 hover:border-neutral-500'}`}
                  >
                    <Flame size={28} className={`md:w-[32px] md:h-[32px] ${overallGigScore >= s ? 'fill-orange-500' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 md:mb-8">
              <label className="block text-xs md:text-sm font-bold text-neutral-300 mb-3 flex items-center gap-2">
                <MessageSquare size={16} /> Snabba tankar (Publiken, rummet)
              </label>
              <textarea 
                value={gigNotes} onChange={e => setGigNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 md:p-4 text-sm md:text-base text-white outline-none focus:border-purple-500 min-h-[100px] md:min-h-[120px] resize-none"
                placeholder="T.ex: Mikrofonen glappade, men de älskade dejting-blocket..."
              />
            </div>

            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4">
              <button onClick={() => { setIsGigMode(false); setGigPhase('live'); }} className="w-full md:w-auto text-neutral-500 hover:text-white px-4 py-3 md:py-2">Avbryt</button>
              <button onClick={() => { setGigPhase('eval-bits'); setCurrentEvalIndex(0); }} disabled={overallGigScore === 0} className="w-full md:w-auto justify-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50">
                Swipa Skämten <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (gigPhase === 'eval-bits') {
      const isFinished = currentEvalIndex >= setlistBits.length;
      
      if (isFinished) {
        return (
          <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 max-w-sm w-full text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Utvärdering Klar!</h2>
              <p className="text-sm md:text-base text-neutral-400 mb-8">Din statistik är uppdaterad och sparad i valvet.</p>
              <button onClick={finishEvaluationAndSave} disabled={isSaving} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lås och stäng
              </button>
            </div>
          </div>
        );
      }

      const currentBit = setlistBits[currentEvalIndex];

      return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center p-4 md:p-6 touch-none">
          <div className="mb-6 md:mb-8 text-neutral-500 font-bold uppercase tracking-widest text-xs md:text-sm">
            Skämt {currentEvalIndex + 1} av {setlistBits.length}
          </div>

          <div 
            className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 md:p-10 max-w-md w-full shadow-2xl relative select-none cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, currentBit.id)}
          >
            <h2 className="text-2xl md:text-3xl font-black text-center leading-tight mb-4">{currentBit.title}</h2>
            <p className="text-neutral-500 text-center text-xs md:text-sm mb-8 md:mb-10 line-clamp-4 md:line-clamp-3">{currentBit.premise}</p>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div />
              <button onClick={() => handleSwipe(currentBit.id, 'up')} className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 text-yellow-500 hover:bg-yellow-500/10 rounded-2xl transition-colors">
                <ChevronUp size={32} className="md:w-[40px] md:h-[40px]" />
                <span className="font-bold text-[10px] md:text-xs uppercase text-center leading-tight">Guld<br className="hidden md:block"/>(★★★)</span>
              </button>
              <div />

              <button onClick={() => handleSwipe(currentBit.id, 'left')} className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors">
                <ChevronLeft size={32} className="md:w-[40px] md:h-[40px]" />
                <span className="font-bold text-[10px] md:text-xs uppercase text-center leading-tight">Bomb<br className="hidden md:block"/>(★)</span>
              </button>

              <button onClick={() => handleSwipe(currentBit.id, 'down')} className="flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-4 text-neutral-500 hover:bg-neutral-800 rounded-2xl transition-colors">
                <SkipForward size={20} className="md:w-[24px] md:h-[24px]" />
                <span className="font-bold text-[10px] md:text-xs uppercase mt-1 md:mt-2">Hoppa</span>
              </button>

              <button onClick={() => handleSwipe(currentBit.id, 'right')} className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 text-green-500 hover:bg-green-500/10 rounded-2xl transition-colors">
                <ChevronRight size={32} className="md:w-[40px] md:h-[40px]" />
                <span className="font-bold text-[10px] md:text-xs uppercase text-center leading-tight">Bra<br className="hidden md:block"/>(★★)</span>
              </button>
            </div>
            
            <p className="text-center text-neutral-600 text-[9px] md:text-[10px] uppercase font-bold mt-8 md:mt-10 tracking-widest">
              Använd knapparna eller Swipa skärmen
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex flex-col md:flex-row bg-[#08080c] text-white md:overflow-hidden">
      
      {/* Vänster Meny: Sparade Setlists */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-indigo-950/40 bg-neutral-900/40 p-4 md:p-6 flex flex-col h-[35dvh] md:h-full shrink-0">
        <div className="mb-4 md:mb-6 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-indigo-400 flex items-center gap-2 tracking-wide">
            <ListMusic className="text-purple-500" size={18} /> Setlists
          </h2>
        </div>
        
        <button onClick={startNew} className="w-full mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-2 md:py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-950/40 text-xs md:text-sm">
          <Plus size={16} /> Ny Setlist
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 pr-1 md:pr-2 scrollbar-hide">
          {savedSetlists.map((setlistObj) => {
            const isPerformed = !!setlistObj.performed_at;
            const score = setlistObj.evaluations?.overall || 0;

            return (
              <div 
                key={setlistObj.id} onClick={() => loadSetlist(setlistObj)}
                className={`p-3 md:p-4 rounded-xl cursor-pointer border transition-all group ${
                  activeId === setlistObj.id ? 'bg-purple-950/20 border-purple-500/50 shadow-md' : isPerformed ? 'bg-neutral-900/20 border-neutral-800/50 opacity-60 hover:opacity-100 hover:border-purple-900/50' : 'bg-neutral-900/60 border-neutral-800 hover:border-purple-900/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate pr-2 text-xs md:text-sm flex items-center gap-2">
                    {setlistObj.title || "Namnlös Setlist"}
                    {isPerformed && <span title={`Genomfört! Betyg: ${score}/5`} className="flex items-center gap-0.5 text-orange-500"><Flame size={12} className="fill-orange-500"/></span>}
                  </h3>
                  <button onClick={(e) => deleteSetlist(e, setlistObj.id)} className="text-neutral-600 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={15} /></button>
                </div>
                <p className="text-[10px] md:text-xs text-neutral-500 flex items-center gap-1"><MapPin size={10} /> {setlistObj.venue || "Ingen plats"}</p>
                <div className="flex items-center gap-2 mt-2 md:mt-3">
                  <span className="text-[9px] md:text-[10px] text-purple-300 font-bold bg-purple-950/40 border border-purple-900/40 px-2 py-0.5 rounded">
                    {setlistObj.bit_ids ? setlistObj.bit_ids.length : 0} bitar
                  </span>
                  {isPerformed && (
                    <span className="text-[9px] md:text-[10px] text-green-500 font-medium">
                      Körd {new Date(setlistObj.performed_at).toLocaleDateString("sv-SE", { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Höger Sida: Byggaren */}
      <div className="flex-1 p-4 md:p-10 flex flex-col md:h-full md:overflow-y-auto">
        
        {/* Setlist Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 shrink-0 border-b border-purple-950/20 pb-4 gap-4">
          <div className="flex-1 w-full max-w-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-purple-400/80">Live Show</span>
              {performedAt && <span className="text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-950/50 text-green-400 border border-green-900/50 flex items-center gap-1"><CalendarCheck size={10} /> Genomförd (Låst)</span>}
            </div>
            <input type="text" placeholder="Namn på gig..." disabled={!!performedAt} className={`bg-transparent text-xl md:text-3xl font-bold outline-none text-white w-full mb-1 ${performedAt ? 'opacity-70' : ''}`} value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex items-center gap-2 text-neutral-400">
              <MapPin size={12} className="text-purple-400 md:w-4 md:h-4" />
              <input type="text" placeholder="Plats, stad eller scen..." disabled={!!performedAt} className={`bg-transparent outline-none text-xs md:text-sm w-full transition-colors ${performedAt ? 'opacity-70' : 'focus:text-purple-300'}`} value={venue} onChange={(e) => setVenue(e.target.value)} />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-end w-full lg:w-auto">
            {setlistBits.length > 0 && <button onClick={() => setIsPrintMode(true)} className="flex items-center justify-center flex-1 lg:flex-none gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-lg font-bold transition-all bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs md:text-sm"><Printer size={16} /> <span className="hidden lg:inline">Fusklapp</span></button>}
            {setlistBits.length > 0 && !performedAt && <button onClick={() => { setIsGigMode(true); setIsTimerRunning(false); setIsRecording(false); }} className="flex items-center justify-center flex-1 lg:flex-none gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg text-xs md:text-sm"><Play size={16} className="fill-white" /> Starta Gig</button>}
            {!performedAt && <button onClick={() => handleSave()} disabled={isSaving || !title} className={`flex items-center justify-center flex-1 lg:flex-none gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 ${(isSaving || !title) ? "opacity-50 cursor-not-allowed" : ""}`}>{saved ? <Check size={16} /> : <Save size={16} />} Spara</button>}
          </div>
        </div>

        {/* TIDSBUDGET */}
        {!performedAt && (
          <div className="mb-4 bg-neutral-900/60 border border-neutral-800 p-3 md:p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <Clock size={20} className={isOverTime ? "text-red-400 shrink-0" : "text-purple-400 shrink-0"} />
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm md:text-base font-bold font-mono ${isOverTime ? "text-red-400" : "text-white"}`}>~{totalMinutes} min {remainingSeconds > 0 ? `${remainingSeconds}s` : ""}</span>
                </div>
                <p className="text-[10px] md:text-[11px] text-neutral-400 mt-0.5">
                  (Ren materialtid: {Math.floor(rawMaterialSeconds / 60)}m {rawMaterialSeconds % 60}s)
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
              <div className="flex items-center gap-2 md:gap-4 bg-neutral-950/80 border border-neutral-800 px-2.5 md:px-3.5 py-1.5 rounded-lg flex-1 md:flex-none justify-between md:justify-start">
                <div className="flex items-center gap-1 md:gap-1.5 text-neutral-400"><Sliders size={13} className="text-purple-400" /><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Tempo:</span></div>
                <div className="flex items-center gap-0.5 md:gap-1">
                  {[{ label: "Tight", val: 0 }, { label: "Med", val: 15 }, { label: "Slappt", val: 30 }].map(p => (
                    <button key={p.val} onClick={() => setPacingBuffer(p.val)} className={`px-2 md:px-2.5 py-1 rounded text-[10px] md:text-xs font-bold transition-all ${pacingBuffer === p.val ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"}`}>{p.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] md:text-[10px] font-bold text-neutral-500 uppercase">Mål:</span>
                <input type="number" min="1" value={targetDurationMinutes} onChange={(e) => setTargetDurationMinutes(Number(e.target.value) || 0)} className="w-12 md:w-14 bg-neutral-950 border border-neutral-800 text-xs font-bold text-white rounded px-1.5 md:px-2 py-1 outline-none text-center" />
              </div>
            </div>
          </div>
        )}

        <div className="flex-none xl:flex-1 flex flex-col xl:flex-row gap-4 md:gap-6 mt-2 xl:mt-0 pb-10 xl:pb-0">
          
          {/* VÄNSTER: Bibliotek (Döljs om genomförd) */}
          {!performedAt && (
            <div className="flex-1 bg-neutral-900/50 border border-neutral-800/80 rounded-xl flex flex-col overflow-hidden h-[50dvh] xl:h-auto min-h-[350px]">
              <div className="p-3 md:p-4 border-b border-neutral-800 space-y-2 md:space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-neutral-300 text-xs md:text-sm flex items-center gap-2">
                    <FolderOpen size={14} className="text-purple-400" /> Bibliotek ({filteredAvailableBits.length})
                  </h3>
                </div>

                <div className="flex gap-2 w-full">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder="Sök..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"><X size={12}/></button>}
                  </div>
                  <button 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${showAdvancedFilters || activeFilterCount > 0 ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}
                  >
                    <Filter size={14} /> <span className="hidden sm:inline">Filter</span> {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </button>
                </div>

                {/* INFÄLLBARA FILTER */}
                {showAdvancedFilters && (
                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-3 space-y-3 text-xs animate-in fade-in">
                    <div className="flex justify-between items-center border-b border-neutral-800/60 pb-2">
                      <span className="font-bold text-neutral-400">Filtrera skämt</span>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-red-400 hover:text-red-300 flex items-center gap-1"><Eraser size={12}/> Töm</button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 outline-none">
                        <option value="priority-desc">Bäst först (★★★)</option>
                        <option value="priority-asc">Lägst prioritet (★)</option>
                        <option value="newest">Senast skapade</option>
                        <option value="title">Titel (A-Ö)</option>
                      </select>
                      <select value={minPriority} onChange={(e) => setMinPriority(Number(e.target.value))} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 outline-none">
                        <option value={0}>Alla Betyg</option>
                        <option value={1}>★ 1+</option>
                        <option value={2}>★★ 2+</option>
                        <option value={3}>★★★ 3</option>
                      </select>
                      <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 outline-none">
                        <option value="Alla">Alla statusar</option>
                        <option value="Klubbklar">Klubbklar</option>
                        <option value= "Testa">Testa</option>
                        <option value="Redo">Redo</option>
                        <option value="Råidé">Råidé</option>
                        <option value="Burned">Burned</option>
                        {gigProfile === 'test' && <option value="Testa">Testa</option>}
                        <option value="Omarbeta">Omarbeta</option>
                      </select>
                      <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 outline-none">
                        <option value="Alla">Alla känslor</option>
                        <option value="Avmätt">Avmätt</option>
                        <option value="Entusiastisk">Entusiastisk</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Deppig">Deppig</option>
                        <option value="Arrogant">Arrogant</option>
                        <option value="Spelat oskuldsfull">Oskyldig</option>
                        <option value="Sarkastisk">Sarkastisk</option>
                        <option value="Upprörd">Upprörd</option>
                        <option value="Retstickig">Retstickig</option>
                      </select>
                      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 outline-none">
                        <option value="Alla">Alla roller</option>
                        <option value="Öppnare">Öppnare</option>
                        <option value="Story">Mellanbit / Story</option>
                        <option value="Callback">Callback</option>
                        <option value="Stängare">Stängare</option>
                      </select>
                      <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 outline-none">
                        <option value="Alla">Alla risknivåer</option>
                        <option value="Familj/Företag">Trygg/Företag</option>
                        <option value="Klubb">Klubb standard</option>
                        <option value="Mörkt">Late Night / Mörkt</option>
                      </select>
                      <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-300 outline-none col-span-2">
                        <option value="Alla">Alla format</option>
                        <option value="oneliner">Oneliner</option>
                        <option value="observation">Observation</option>
                        <option value="story">Lång Story</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/60">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">Gig-Profil</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => handleProfileChange('ingen')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'ingen' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><X size={10}/> Ingen</button>
                        <button onClick={() => handleProfileChange('klubb')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'klubb' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Mic size={10}/> Klubb</button>
                        <button onClick={() => handleProfileChange('foretag')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'foretag' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Briefcase size={10}/> Företag</button>
                        <button onClick={() => handleProfileChange('test')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'test' ? 'bg-orange-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Edit3 size={10}/> Test</button>
                        <button onClick={() => handleProfileChange('special')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'special' ? 'bg-purple-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Film size={10}/> Special</button>
                      </div>
                    </div>

                    {topTags.length > 0 && (
                      <div className="pt-2 border-t border-neutral-800/60">
                        <div className="flex flex-wrap gap-1.5">
                          {topTags.map(t => (
                            <button key={t} onClick={() => setSelectedTag(selectedTag === t ? null : t)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${selectedTag === t ? 'bg-purple-600 text-white font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'}`}>#{t}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2">
                {filteredAvailableBits.map(bit => {
                  const powerScore = calculatePowerScore(bit.gig_stats);
                  const hasSwipes = bit.gig_stats && bit.gig_stats.current && (bit.gig_stats.current.guld > 0 || bit.gig_stats.current.bra > 0 || bit.gig_stats.current.bomb > 0);
                  
                  return (
                    <div key={bit.id} onClick={() => addBit(bit.id)} className="p-2.5 md:p-3 border border-neutral-800/80 bg-neutral-950 hover:border-purple-500/50 rounded-lg cursor-pointer flex items-center justify-between group">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                          {bit.title}
                          {hasSwipes && (
                            <span title="Power Ranking" className="flex items-center gap-0.5 text-[9px] font-black text-orange-400 bg-orange-500/10 px-1 rounded border border-orange-500/20">
                              <Activity size={8} /> {powerScore.toFixed(1)}
                            </span>
                          )}
                        </h4>
                      </div>
                      <button className="text-neutral-600 group-hover:text-purple-400 bg-neutral-900 p-1.5 rounded shrink-0"><Plus size={14}/></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HÖGER: Setlistan */}
          <div className={`${performedAt ? 'w-full max-w-3xl mx-auto h-[60dvh]' : 'flex-1 h-[60dvh] xl:h-auto min-h-[400px]'} bg-purple-950/10 border border-purple-900/30 rounded-xl flex flex-col overflow-hidden shadow-inner`}>
            <div className="p-3 md:p-4 border-b border-purple-950/30 bg-neutral-900/80 flex justify-between items-center">
              <h3 className="font-semibold text-purple-300 text-xs md:text-sm flex items-center gap-2"><ListMusic size={14} className="text-purple-400 md:w-4 md:h-4" /> Ordning</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3">
              {setlistBits.map((bit, index) => {
                const collisionInfo = getCollisionWarning(bit.id);
                const powerScore = calculatePowerScore(bit.gig_stats);
                const hasSwipes = bit.gig_stats && bit.gig_stats.current && (bit.gig_stats.current.guld > 0 || bit.gig_stats.current.bra > 0 || bit.gig_stats.current.bomb > 0);
                
                return (
                  <div key={bit.id} draggable={!performedAt} onDragStart={(e) => onDragStart(e, index)} onDragOver={(e) => onDragOver(e, index)} onDrop={(e) => onDrop(e, index)} className={`p-2.5 md:p-3 bg-neutral-950 border-l-4 border-neutral-800 border-y border-r rounded-lg flex items-center justify-between ${!performedAt ? 'cursor-grab active:cursor-grabbing hover:border-purple-500/40' : ''}`}>
                    <div className="flex items-center gap-2 md:gap-2.5 w-full">
                      
                      {!performedAt && <GripVertical size={16} className="text-neutral-600 hidden md:block" />}
                      
                      {!performedAt && (
                        <div className="flex flex-col gap-1 md:hidden bg-neutral-900 rounded p-1">
                          <button onClick={(e) => { e.stopPropagation(); moveBit(index, 'up'); }} disabled={index === 0} className="text-neutral-500 hover:text-white disabled:opacity-20"><ChevronUp size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); moveBit(index, 'down'); }} disabled={index === setlistBits.length - 1} className="text-neutral-500 hover:text-white disabled:opacity-20"><ChevronDown size={16}/></button>
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center justify-between pr-1 md:pr-2 mb-0.5 md:mb-1">
                          <h4 className="text-xs md:text-sm font-semibold text-white flex items-center gap-2">
                            <span className="text-purple-400 mr-1 md:mr-2">{index + 1}.</span>{bit.title}
                            {hasSwipes && (
                              <span title="Power Ranking" className="flex items-center gap-0.5 text-[9px] font-black text-orange-400 bg-orange-500/10 px-1 rounded border border-orange-500/20">
                                <Activity size={8} /> {powerScore.toFixed(1)}
                              </span>
                            )}
                          </h4>
                          {!performedAt && <span className="text-[10px] md:text-[11px] font-mono text-neutral-500">~{Math.round((bit.duration_seconds || 0) / 60 * 10) / 10}m</span>}
                        </div>
                        {!performedAt && collisionInfo && <div className="mt-1 text-red-400 text-[9px] md:text-[10px] font-bold"><AlertOctagon size={10} className="inline mr-1"/>{collisionInfo}</div>}
                      </div>
                    </div>
                    {!performedAt && <button onClick={(e) => removeBit(e, bit.id)} className="text-neutral-600 hover:text-red-400 p-1 md:p-1.5 ml-1 md:ml-2"><Trash2 size={14} className="md:w-[15px] md:h-[15px]" /></button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Setlists() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex justify-center p-20"><Loader2 className="animate-spin text-purple-500" size={32} /></div>}>
      <SetlistsContent />
    </Suspense>
  );
}