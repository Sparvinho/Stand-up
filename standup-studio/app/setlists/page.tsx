"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import {
  ListMusic, Plus, Save, Trash2, Check, MapPin, ArrowRight,
  FolderOpen, GripVertical, Eraser, Play, X, CornerDownRight,
  Search, Mic, Briefcase, Edit3, Film, Activity, Info, Loader2, ArrowUpDown, Sparkles,
  Filter, Clock, Pause, RotateCcw, Sliders, CalendarCheck, AlertOctagon, Printer, Flame,
  MessageSquare, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SkipForward
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

// --- SÄSONGS-KALENDERN ---
const SEASONAL_TAGS = ["jul", "nyår", "midsommar", "halloween", "påsk", "valborg", "alla hjärtans dag"];

const getActiveSeasons = () => {
  const m = new Date().getMonth(); // 0 = Jan, 8 = Sep, 11 = Dec
  const active = [];
  if (m === 8 || m === 9) active.push("halloween"); // Sep, Okt
  if (m === 10 || m === 11) active.push("jul", "nyår"); // Nov, Dec
  if (m === 0) active.push("nyår", "alla hjärtans dag"); // Jan
  if (m === 1) active.push("alla hjärtans dag"); // Feb
  if (m === 2 || m === 3) active.push("påsk"); // Mar, Apr
  if (m === 3 || m === 4) active.push("valborg"); // Apr, Maj
  if (m === 4 || m === 5) active.push("midsommar"); // Maj, Jun
  return active;
};

type MemoryCard = { start_bit_id: string; title: string };
type MemoryQuestion = { kind: 'card' | 'next'; index: number };

function SetlistsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addId = searchParams.get("add");
  const [savedSetlists, setSavedSetlists] = useState<any[]>([]);
  const [allBits, setAllBits] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [routineSnapshots, setRoutineSnapshots] = useState<Record<string, any>>({});
  const [libraryTab, setLibraryTab] = useState<'bits' | 'routines'>('bits');
  const [routineLoadError, setRoutineLoadError] = useState('');
  const [activeId, setActiveId] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [performedAt, setPerformedAt] = useState<string | null>(null);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(15);
  const [pacingBuffer, setPacingBuffer] = useState<number>(15);
  const [setlist, setSetlist] = useState<string[]>([]);
  const [cueOverrides, setCueOverrides] = useState<Record<string, string>>({});
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [memoryPractice, setMemoryPractice] = useState(false);
  const [practiceCard, setPracticeCard] = useState(0);
  const [revealCard, setRevealCard] = useState(false);
  const [revealCardOrder, setRevealCardOrder] = useState(false);
  const [randomMemoryPractice, setRandomMemoryPractice] = useState(false);
  const [memoryQuestion, setMemoryQuestion] = useState<MemoryQuestion | null>(null);
  const [isRehearsalMode, setIsRehearsalMode] = useState(false);
  const [rehearsalView, setRehearsalView] = useState<'script' | 'cues' | 'both'>('both');
  const [stageDensity, setStageDensity] = useState<'compact' | 'comfortable'>('compact');
  const [saveError, setSaveError] = useState('');
  const [hiddenBits, setHiddenBits] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- AI TEMA-SÖK STATE ---
  const [aiThemeQuery, setAiThemeQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSuggestedIds, setAiSuggestedIds] = useState<string[] | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("Alla");
  const [gigProfile, setGigProfile] = useState<string>("ingen");
  const [minPriority, setMinPriority] = useState<number>(0);
  const [focusOnly, setFocusOnly] = useState(false);
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
  const [overallGigScore, setOverallGigScore] = useState<number>(0);
  const [gigNotes, setGigNotes] = useState("");
  const [bitScores, setBitScores] = useState<Record<string, number>>({});
  const [currentEvalIndex, setCurrentEvalIndex] = useState(0);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printMemoryCards, setPrintMemoryCards] = useState(false);
  const [mobileView, setMobileView] = useState<'set' | 'library' | 'saved'>('set');
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [expandedBitId, setExpandedBitId] = useState<string | null>(null);
  const [expandedLibraryBitId, setExpandedLibraryBitId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isGigMode && gigPhase === 'live' && isTimerRunning) {
      interval = setInterval(() => { setLiveSeconds(sec => sec + 1); }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGigMode, gigPhase, isTimerRunning]);

  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Kunde inte låsa skärmen:', err);
      }
    };
    if (isGigMode && gigPhase === 'live') {
      requestWakeLock();
    } else if (wakeLock !== null) {
      wakeLock.release().then(() => { wakeLock = null; });
    }
    return () => { if (wakeLock !== null) wakeLock.release(); };
  }, [isGigMode, gigPhase]);

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
        premise: (b.premise || "").replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, ""),
        priority: Number(b.priority) || 1,
        duration_seconds: b.duration_seconds !== null && b.duration_seconds !== undefined ? Number(b.duration_seconds) : 0,
        tags: Array.isArray(b.tags) ? b.tags : [],
        comedy_tags: Array.isArray(b.comedy_tags) ? b.comedy_tags : [],
        stage_cues: typeof b.stage_cues === "string" ? b.stage_cues : ""
      }));
      setAllBits(safeBits);
    }
    const { data: routinesData, error: routinesError } = await supabase.from("routines").select("id,title,status,items").order("created_at", { ascending: false });
    if (routinesError) setRoutineLoadError(routinesError.message);
    else { setRoutineLoadError(''); setRoutines(routinesData || []); }
    const { data: setlistsData } = await supabase.from("setlists").select("*").order("created_at", { ascending: false });
    if (setlistsData) {
      const safeData = setlistsData.map(r => ({
        ...r,
        bit_ids: Array.isArray(r.bit_ids) ? r.bit_ids.map(String) : [],
        hidden_bit_ids: Array.isArray(r.hidden_bit_ids) ? r.hidden_bit_ids.map(String) : [],
        cue_overrides: r.cue_overrides && typeof r.cue_overrides === "object" && !Array.isArray(r.cue_overrides) ? r.cue_overrides : {},
        routine_snapshots: r.routine_snapshots && typeof r.routine_snapshots === "object" && !Array.isArray(r.routine_snapshots) ? r.routine_snapshots : {},
        memory_cards: Array.isArray(r.memory_cards) ? r.memory_cards.filter((card: any) => card && typeof card.start_bit_id === 'string' && typeof card.title === 'string') : [],
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
        setCueOverrides(prev => ({ ...prev, [String(bitToAdd.id)]: bitToAdd.stage_cues || "" }));
      }
    }
  }, [addId, allBits]);

  const loadSetlist = (setlistObj: any) => {
    setMobileView('set');
    setActiveId(setlistObj.id);
    setTitle(setlistObj.title || "");
    setVenue(setlistObj.venue || "");
    setPerformedAt(setlistObj.performed_at || null);
    setSetlist(Array.isArray(setlistObj.bit_ids) ? setlistObj.bit_ids.map(String) : []);
    setCueOverrides(setlistObj.cue_overrides && typeof setlistObj.cue_overrides === "object" ? setlistObj.cue_overrides : {});
    setMemoryCards(Array.isArray(setlistObj.memory_cards) ? setlistObj.memory_cards : []);
    setRoutineSnapshots(setlistObj.routine_snapshots || {});
    setSaveError("");
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
    setMobileView('set');
    setActiveId(null);
    setTitle("");
    setVenue("");
    setPerformedAt(null);
    setSetlist([]);
    setCueOverrides({});
    setMemoryCards([]);
    setRoutineSnapshots({});
    setSaveError("");
    setHiddenBits([]);
    setOverallGigScore(0);
    setGigNotes("");
    setBitScores({});
    setCopilotSuggestions([]);
  };

  // Copy missing entries from the library. This also freezes cues in older setlists
  // the first time they are saved, so future library edits cannot change a gig.
  const snapshottedCues = (ids: string[]) => Object.fromEntries(
    ids.map(id => [id, Object.prototype.hasOwnProperty.call(cueOverrides, id)
      ? cueOverrides[id] : (allBits.find(b => String(b.id) === id)?.stage_cues || "")])
  );
  const getSetCues = (bit: any): string =>
    Object.prototype.hasOwnProperty.call(cueOverrides, String(bit.id))
      ? cueOverrides[String(bit.id)] : (bit.stage_cues || "");

  // Store a complete, immutable routine snapshot inside this particular set.
  // IDs have a type prefix, so they cannot collide with regular bit UUIDs.
  const routineKey = (id: string) => `routine:${id}`;
  const routineToStageBlock = (routine: any) => {
    const items = Array.isArray(routine.items) ? routine.items : [];
    const text = items.map((item: any) => item?.type === 'bit'
      ? [item.title, item.premise].filter(Boolean).join('\n')
      : item?.type === 'segue' ? (item.text || '') : '').filter(Boolean).join('\n\n');
    const seconds = items.reduce((sum: number, item: any) => sum + (item?.type === 'bit'
      ? Math.max(0, Number(item.duration_seconds) || Math.round((String(item.premise || '').split(/\s+/).filter(Boolean).length / 130) * 60))
      : 0), 0);
    return { id: routineKey(String(routine.id)), title: routine.title || 'Namnlös rutin',
      premise: text, routine_items: items, is_routine: true, duration_seconds: seconds,
      status: routine.status || 'Råidé', stage_cues: '', priority: 1 };
  };
  const getRoutineSnapshotsForSave = (ids: string[]) => Object.fromEntries(
    ids.filter(id => id.startsWith('routine:')).map(id => [id, routineSnapshots[id]
      || (routines.find(r => routineKey(String(r.id)) === id) ? routineToStageBlock(routines.find(r => routineKey(String(r.id)) === id)) : null)])
      .filter((entry): entry is [string, any] => entry[1] !== null)
  );
  const addRoutine = (routine: any) => {
    if (performedAt) return;
    const block = routineToStageBlock(routine);
    if (setlist.includes(block.id)) return;
    setRoutineSnapshots(prev => ({ ...prev, [block.id]: block }));
    setSetlist(prev => [...prev, block.id]);
    setCueOverrides(prev => ({ ...prev, [block.id]: '' }));
    setMobileView('set');
  };
  const handleSave = async (markAsPerformed = false) => {
    setIsSaving(true);
    setSaveError("");
    const cleanBitIds = setlist.map(String);
    const cleanHiddenIds = hiddenBits.map(String);
    const cuesToSave = snapshottedCues(cleanBitIds);
    const cardsToSave = memoryCards.filter(card => cleanBitIds.includes(card.start_bit_id));
    if (activeId !== null && activeId !== undefined) {
      const { error } = await supabase.from("setlists").update({
        title, venue, bit_ids: cleanBitIds, hidden_bit_ids: cleanHiddenIds, cue_overrides: cuesToSave, routine_snapshots: getRoutineSnapshotsForSave(cleanBitIds), memory_cards: cardsToSave
      }).eq("id", activeId);
      if (!error) { setCueOverrides(cuesToSave); showSaved(); await fetchData(); }
      else setSaveError(error.message);
    } else {
      const { data, error } = await supabase.from("setlists").insert([{
        title, venue, bit_ids: cleanBitIds, hidden_bit_ids: cleanHiddenIds, cue_overrides: cuesToSave, routine_snapshots: getRoutineSnapshotsForSave(cleanBitIds), memory_cards: cardsToSave
      }]).select().single();
      if (data && !error) { setCueOverrides(cuesToSave); setActiveId(data.id); showSaved(); await fetchData(); }
      else if (error) setSaveError(error.message);
    }
    setIsSaving(false);
  };

  // Clone the SAVED database record, not the editable title/current form state.
  // A successful clone must have a distinct database ID before it is opened.
  const cloneSavedSetlist = async (source: any) => {
    if (isSaving) return;
    const sourceTitle = String(source.title || "Namnlös setlista");
    const proposed = window.prompt("Namn på kopian:", `${sourceTitle} – kopia`);
    if (proposed === null) return;
    const cloneTitle = proposed.trim();
    if (!cloneTitle) { setSaveError("Ange ett namn på kopian."); setMobileView("set"); return; }
    setIsSaving(true);
    setSaveError("");
    const sourceIds = Array.isArray(source.bit_ids) ? source.bit_ids.map(String) : [];
    const copyPayload = {
      title: cloneTitle,
      venue: source.venue || "",
      bit_ids: [...sourceIds],
      hidden_bit_ids: Array.isArray(source.hidden_bit_ids) ? [...source.hidden_bit_ids] : [],
      cue_overrides: structuredClone(source.cue_overrides || {}),
      routine_snapshots: structuredClone(source.routine_snapshots || {}),
      memory_cards: structuredClone(source.memory_cards || [])
    };
    try {
      const { data, error } = await supabase.from("setlists").insert([copyPayload]).select("*").single();
      if (error) throw error;
      if (!data?.id || String(data.id) === String(source.id)) {
        throw new Error("Databasen bekräftade inte att kopian fick ett eget ID.");
      }
      await fetchData();
      loadSetlist({ ...data, evaluations: {}, performed_at: null });
      window.alert(`Kopian ”${cloneTitle}” har skapats. Originalet finns kvar.`);
    } catch (err: any) {
      setSaveError(err?.message || "Kunde inte klona setlistan.");
      setMobileView("set");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloneCurrent = async () => {
    if (activeId == null) return;
    const source = savedSetlists.find(s => String(s.id) === String(activeId));
    if (!source) { setSaveError("Spara setlistan innan du klonar den."); return; }
    await cloneSavedSetlist(source);
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
        performed_at: currentPerformedAt, evaluations: evaluationData, cue_overrides: snapshottedCues(cleanBitIds), routine_snapshots: getRoutineSnapshotsForSave(cleanBitIds), memory_cards: memoryCards.filter(card => cleanBitIds.includes(card.start_bit_id))
      }).eq("id", activeId);
    } else {
      const { data } = await supabase.from("setlists").insert([{
        title, venue, bit_ids: cleanBitIds, hidden_bit_ids: hiddenBits.map(String),
        performed_at: currentPerformedAt, evaluations: evaluationData, cue_overrides: snapshottedCues(cleanBitIds), routine_snapshots: getRoutineSnapshotsForSave(cleanBitIds), memory_cards: memoryCards.filter(card => cleanBitIds.includes(card.start_bit_id))
      }]).select().single();
      if (data) setActiveId(data.id);
    }

    const bitIdsToUpdate = Object.keys(bitScores).filter(id => bitScores[id] > 0 && !id.startsWith("routine:"));
    if (bitIdsToUpdate.length > 0) {
      const { data: bitsToUpdate } = await supabase.from("bits").select("id, gig_stats").in("id", bitIdsToUpdate);
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
        if (score === 5) { newPriority = 3; newStatus = "Klubbklar"; } 
        else if (score === 4) { newPriority = 2; newStatus = "Redo"; } 
        else if (score === 1) { newPriority = 1; newStatus = "Omarbeta"; }
        
        await supabase.from("bits").update({ priority: newPriority, status: newStatus, gig_stats: stats }).eq("id", bit.id);
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
    if (!setlist.includes(idStr)) {
      setSetlist([...setlist, idStr]);
      const bit = allBits.find(b => String(b.id) === idStr);
      setCueOverrides(prev => ({ ...prev, [idStr]: bit?.stage_cues || "" }));
      setCopilotSuggestions([]);
    }
  };

  const removeBit = (e: React.MouseEvent, bitId: string) => {
    e.stopPropagation();
    if (performedAt) return;
    const idStr = String(bitId);
    setSetlist(setlist.filter(id => id !== idStr));
    setCueOverrides(prev => { const next = { ...prev }; delete next[idStr]; return next; });
    setMemoryCards(prev => prev.filter(card => card.start_bit_id !== idStr));
    setRoutineSnapshots(prev => { const next = { ...prev }; delete next[idStr]; return next; });
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

  const clearFilters = () => {
    setSelectedStatus("Alla");
    setGigProfile("ingen");
    setMinPriority(0);
    setFocusOnly(false);
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
    (focusOnly ? 1 : 0) +
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

  const setlistBits = setlist.map(id => id.startsWith('routine:')
    ? routineSnapshots[id] || (routines.find(r => routineKey(String(r.id)) === id)
      ? routineToStageBlock(routines.find(r => routineKey(String(r.id)) === id)) : null)
    : allBits.find(b => String(b.id) === String(id))).filter(Boolean);
  
  // Cards start at a particular bit; moving the bit moves the boundary with it.
  // First card is implicit when at least one explicit boundary exists.
  const orderedMemoryCards = useMemo(() => {
    if (!setlist.length || !memoryCards.length) return [];
    const boundaries = memoryCards.filter(card => setlist.includes(card.start_bit_id));
    const first = boundaries.find(card => card.start_bit_id === setlist[0]);
    const result: { title: string; bits: any[]; start_bit_id: string }[] = [];
    let current: { title: string; bits: any[]; start_bit_id: string } | null = null;
    for (const bit of setlistBits) {
      const boundary = boundaries.find(card => card.start_bit_id === String(bit.id));
      if (!current || boundary) {
        current = { title: boundary?.title || (result.length === 0 ? first?.title || 'Lapp 1' : `Lapp ${result.length + 1}`), bits: [], start_bit_id: String(bit.id) };
        result.push(current);
      }
      current.bits.push(bit);
    }
    return result;
  }, [memoryCards, setlist, allBits, routineSnapshots, routines]);

  // Move an entire memory card without changing the order of jokes within it.
  // Rebuild boundaries explicitly so even a formerly implicit first card keeps its title.
  const moveMemoryCard = (startId: string, direction: 'up' | 'down') => {
    if (performedAt || orderedMemoryCards.length < 2) return;
    const index = orderedMemoryCards.findIndex(card => card.start_bit_id === startId);
    const target = index + (direction === 'up' ? -1 : 1);
    if (index < 0 || target < 0 || target >= orderedMemoryCards.length) return;
    const groups = orderedMemoryCards.map(card => ({
      title: card.title,
      ids: card.bits.map(bit => String(bit.id)),
    }));
    [groups[index], groups[target]] = [groups[target], groups[index]];
    setSetlist(groups.flatMap(group => group.ids));
    setMemoryCards(groups.filter(group => group.ids.length > 0).map(group => ({
      start_bit_id: group.ids[0], title: group.title,
    })));
    setCopilotSuggestions([]);
  };

  // Mix two recall tasks: remember the jokes on a random card, or name the next card.
  // The last card cannot be the subject of a "what comes next?" question.
  const nextMemoryQuestion = (previous: MemoryQuestion | null = null) => {
    const candidates: MemoryQuestion[] = orderedMemoryCards.flatMap((_, index) => [
      { kind: 'card' as const, index },
      ...(index < orderedMemoryCards.length - 1 ? [{ kind: 'next' as const, index }] : []),
    ]);
    const fresh = candidates.filter(q => !previous || q.kind !== previous.kind || q.index !== previous.index);
    const pool = fresh.length ? fresh : candidates;
    setMemoryQuestion(pool.length ? pool[Math.floor(Math.random() * pool.length)] : null);
    setRevealCard(false);
  };

  const toggleMemoryBoundary = (id: string) => {
    if (performedAt) return;
    setMemoryCards(prev => {
      if (prev.some(card => card.start_bit_id === id)) return prev.filter(card => card.start_bit_id !== id);
      const withFirst = prev.length === 0 && setlist.length && setlist[0] !== id
        ? [{ start_bit_id: setlist[0], title: 'Lapp 1' }] : prev;
      return [...withFirst, { start_bit_id: id, title: `Lapp ${withFirst.length + 1}` }];
    });
  };

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

  // --- NY FUNKTION FÖR AI-SÖK ---
  const searchThemeWithAI = async () => {
    if (!aiThemeQuery.trim()) {
      setAiSuggestedIds(null);
      return;
    }
    setIsAiSearching(true);
    
    const available = allBits.filter(b => !setlist.includes(String(b.id)) && !hiddenBits.includes(String(b.id)));
    const simplifiedBits = available.map(b => ({ 
      id: b.id, 
      title: b.title, 
      premise: b.premise,
      tags: b.tags 
    }));
    
    try {
      const res = await fetch("/api/ai-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: aiThemeQuery, bits: simplifiedBits })
      });
      const data = await res.json();
      
      if (data.suggestedIds) {
        setAiSuggestedIds(data.suggestedIds);
      }
    } catch (err) {
      console.error("AI-sök misslyckades:", err);
    }
    setIsAiSearching(false);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    if (performedAt) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([tag]) => tag);
  }, [allBits]);

  // --- FILTER MOTORN ---
  const filteredAvailableBits = useMemo(() => {
    let list = allBits
      .filter(bit => !setlist.includes(String(bit.id)))
      .filter(bit => bit.status !== "Pensionerad")
      // Comedy Writer marks routine-only components as "I rutin".
      // Exclude them from available standalone stage material.
      .filter(bit => (bit.status || "").trim().toLowerCase() !== "i rutin");

    // 1. AI TEMA-FILTRET (Körs först)
    if (aiSuggestedIds !== null && Array.isArray(aiSuggestedIds)) {
      list = list.filter(bit => aiSuggestedIds.includes(String(bit.id)));
    }

    if (selectedStatus !== "Burned") {
      list = list.filter(bit => bit.status !== "Burned");
    }

    // 2. KÄLLAREN BY DEFAULT
    if (selectedStatus !== "Källaren") {
      list = list.filter(bit => bit.status !== "Källaren");
    }

    // 3. SÄSONGS-FILTRET
    if (gigProfile !== 'tema') {
      const activeSeasons = getActiveSeasons();
      list = list.filter(bit => {
        const bitTags = bit.tags?.map((t: string) => t.toLowerCase().trim()) || [];
        const hasSeasonalTag = bitTags.some((tag: string) => SEASONAL_TAGS.includes(tag));
        const isActiveSeason = bitTags.some((tag: string) => activeSeasons.includes(tag));
        return !hasSeasonalTag || isActiveSeason;
      });
    }

    // Gig profiles
    switch (gigProfile) {
      case 'foretag':
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

    // Standard filters
    if (minPriority > 0) list = list.filter(bit => (bit.priority || 1) >= minPriority);
    if (focusOnly) list = list.filter(bit => bit.is_focused === true);
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

  // GLÖM INTE aiSuggestedIds HÄR NERE!
  }, [allBits, setlist, searchQuery, selectedStatus, gigProfile, minPriority, focusOnly, sortBy, selectedRole, selectedRisk, selectedFormat, selectedMood, selectedTag, hiddenBits, aiSuggestedIds]);

  if (isPrintMode && printMemoryCards && orderedMemoryCards.length > 0) {
    return (
      <div className="memory-print-screen fixed inset-0 z-[100] bg-white text-black overflow-auto">
        <div className="memory-print-controls print:hidden sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-neutral-900 text-white p-3">
          <div className="text-sm">4 minneslappar per A4 (A6-format). Välj A4, stående, skala 100 % och inga marginaler i utskriftsdialogen.</div>
          <button onClick={() => setIsPrintMode(false)} className="rounded bg-neutral-700 p-2" aria-label="Stäng utskrift"><X size={20}/></button>
        </div>
        <div className="memory-print-pages">
          {Array.from({ length: Math.ceil(orderedMemoryCards.length / 4) }, (_, page) => (
            <div className="memory-print-page" key={page}>
              {orderedMemoryCards.slice(page * 4, page * 4 + 4).map((card, i) => (
                <section className="memory-print-card" key={card.start_bit_id}>
                  <header className="memory-print-card-heading">
                    <span className="memory-print-card-number">LAPP {page * 4 + i + 1}</span>
                    <h2>{card.title}</h2>
                    <span className="memory-print-card-count">{card.bits.length} skämt</span>
                  </header>
                  <ol className="memory-print-jokes">
                    {card.bits.map((bit: any) => <li key={bit.id}>{bit.title}</li>)}
                  </ol>
                </section>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isPrintMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-white text-black p-4 md:p-16 overflow-y-auto">
        <button onClick={() => setIsPrintMode(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-neutral-500 hover:text-black bg-neutral-200 rounded-full transition-colors print:hidden">
          <X size={24} />
        </button>
        <div className="max-w-3xl mx-auto font-sans">
          <div className="border-b-4 border-black pb-4 mb-6 md:mb-8 mt-8 md:mt-0">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight">{title || "Namnlös Setlist"}</h1>
            {venue && <div className="mt-2 text-xl md:text-2xl font-bold text-neutral-600">{venue}</div>}
          </div>
          <ol className="space-y-4 list-decimal list-inside text-2xl md:text-4xl font-black tracking-tight">
            {setlistBits.map((bit) => (
              <li key={bit.id} className="pl-2 border-b border-neutral-300 pb-3">
                <span className="leading-tight">{bit.title}</span>
                {getSetCues(bit) && <p className="font-normal text-base md:text-xl mt-1 text-neutral-700 whitespace-pre-wrap">{getSetCues(bit)}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  if (isRehearsalMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#111114] text-white overflow-y-auto p-4 md:p-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div><p className="text-xs uppercase tracking-widest text-purple-400 mb-1">Repetera</p><h1 className="font-bold text-xl md:text-3xl">{title || 'Namnlös setlist'}</h1></div>
            <button onClick={() => setIsRehearsalMode(false)} className="rounded-lg bg-neutral-800 px-3 py-2 text-sm flex gap-2 items-center"><X size={16}/> Stäng</button>
          </div>
          {orderedMemoryCards.length > 0 && (
            <div className="flex gap-2 mb-5">
              <button onClick={() => { setMemoryPractice(false); setRevealCard(false); }} className={`rounded-lg px-3 py-2 text-sm ${!memoryPractice ? 'bg-purple-600' : 'bg-neutral-800'}`}>Vanlig repetition</button>
              <button onClick={() => { setMemoryPractice(true); setPracticeCard(0); setRevealCard(false); setRevealCardOrder(false); }} className={`rounded-lg px-3 py-2 text-sm ${memoryPractice ? 'bg-purple-600' : 'bg-neutral-800'}`}>Minneslappar</button>
            </div>
          )}
          {memoryPractice && orderedMemoryCards.length > 0 ? (
            <div className="rounded-2xl border border-purple-800/50 bg-neutral-900 p-5 space-y-5">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Träningssätt för minneslappar">
                <button onClick={() => { setRandomMemoryPractice(false); setRevealCard(false); }} aria-pressed={!randomMemoryPractice} className={`rounded-lg px-3 py-2 text-sm ${!randomMemoryPractice ? 'bg-purple-600' : 'bg-neutral-800'}`}>Lapp för lapp</button>
                <button onClick={() => { setRandomMemoryPractice(true); nextMemoryQuestion(); }} aria-pressed={randomMemoryPractice} className={`rounded-lg px-3 py-2 text-sm ${randomMemoryPractice ? 'bg-purple-600' : 'bg-neutral-800'}`}>Slumpträning</button>
              </div>
              {randomMemoryPractice ? (
                memoryQuestion ? <>
                  <div className="text-xs uppercase tracking-widest text-purple-300">{memoryQuestion.kind === 'card' ? 'Minns skämten' : 'Minns nästa lapp'}</div>
                  <h2 className="text-2xl font-bold">{memoryQuestion.kind === 'card'
                    ? orderedMemoryCards[memoryQuestion.index].title
                    : `Vad kommer efter lappen ”${orderedMemoryCards[memoryQuestion.index].title}”?`}</h2>
                  <p className="text-neutral-400 text-sm">{memoryQuestion.kind === 'card'
                    ? 'Säg skämtnamnen i rätt ordning.'
                    : 'Säg namnet på lappen som kommer härnäst.'}</p>
                  {revealCard ? (
                    memoryQuestion.kind === 'card'
                      ? <ol className="list-decimal list-inside space-y-2 text-lg">{orderedMemoryCards[memoryQuestion.index].bits.map(bit => <li key={bit.id}>{bit.title}</li>)}</ol>
                      : <p className="rounded-lg border border-purple-800 bg-purple-950/30 px-4 py-5 text-xl font-semibold">{orderedMemoryCards[memoryQuestion.index + 1].title}</p>
                  ) : <p className="rounded-lg border border-dashed border-neutral-700 py-8 text-center text-neutral-500">Svaret är dolt</p>}
                  <button className="w-full rounded-lg bg-purple-600 py-3 font-bold" onClick={() => setRevealCard(v => !v)}>{revealCard ? 'Dölj svaret' : 'Visa svaret'}</button>
                  <button className="w-full rounded-lg bg-neutral-800 py-3 font-bold" onClick={() => nextMemoryQuestion(memoryQuestion)}>Nästa slumpfråga</button>
                  {orderedMemoryCards.length === 1 && <p className="text-neutral-400 text-xs">Lägg till en minneslapp för att även träna på lapparnas ordning.</p>}
                </> : <p className="text-neutral-400">Inga frågor finns för det här setet.</p>
              ) : <>
                <div className="text-sm text-purple-300">Lapp {practiceCard + 1} av {orderedMemoryCards.length}</div>
                <h2 className="text-2xl font-bold">{orderedMemoryCards[Math.min(practiceCard, orderedMemoryCards.length - 1)].title}</h2>
                <p className="text-neutral-400 text-sm">Försök säga skämtnamnen i rätt ordning innan du visar svaret.</p>
                {revealCard ? (
                  <ol className="list-decimal list-inside space-y-2 text-lg">
                    {orderedMemoryCards[Math.min(practiceCard, orderedMemoryCards.length - 1)].bits.map(bit => <li key={bit.id}>{bit.title}</li>)}
                  </ol>
                ) : <p className="rounded-lg border border-dashed border-neutral-700 py-8 text-center text-neutral-500">Skämten är dolda</p>}
                <button className="w-full rounded-lg bg-purple-600 py-3 font-bold" onClick={() => setRevealCard(v => !v)}>{revealCard ? 'Dölj skämten' : 'Visa skämten'}</button>
                <div className="flex gap-2">
                  <button disabled={practiceCard === 0} className="flex-1 bg-neutral-800 rounded-lg py-3 disabled:opacity-30" onClick={() => { setPracticeCard(v => v - 1); setRevealCard(false); }}>Föregående</button>
                  <button disabled={practiceCard >= orderedMemoryCards.length - 1} className="flex-1 bg-neutral-800 rounded-lg py-3 disabled:opacity-30" onClick={() => { setPracticeCard(v => v + 1); setRevealCard(false); }}>Nästa lapp</button>
                </div>
                <div className="border-t border-neutral-800 pt-4">
                  <p className="text-xs uppercase text-neutral-500 mb-2">Lapparnas ordning</p>
                  <button className="text-purple-300 text-sm underline" onClick={() => setRevealCardOrder(v => !v)}>{revealCardOrder ? orderedMemoryCards.map(c => c.title).join(' → ') : 'Visa ordningen på alla lappar'}</button>
                </div>
              </>}
            </div>
          ) : <>
          <div className="flex gap-2 mb-6" role="group" aria-label="Visa i repetitionsläge">
            {([['script', 'Manus'], ['cues', 'Stödord'], ['both', 'Båda']] as const).map(([mode, label]) => (
              <button key={mode} onClick={() => setRehearsalView(mode)} aria-pressed={rehearsalView === mode} className={`rounded-lg px-3 py-2 text-sm ${rehearsalView === mode ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>{label}</button>
            ))}
          </div>
          <div className="space-y-4 pb-16">
            {setlistBits.map((bit, i) => (
              <article key={bit.id} className="border border-neutral-800 bg-neutral-900/70 rounded-xl p-4">
                <div className="flex items-baseline justify-between gap-3 mb-2"><h2 className="text-lg font-bold"><span className="text-purple-400 mr-2">{i + 1}.</span>{bit.title}</h2><span className="text-xs text-neutral-500 shrink-0">{Math.round((bit.duration_seconds || 0) / 60 * 10) / 10} min</span></div>
                {rehearsalView !== 'script' && <p className="text-purple-200 whitespace-pre-wrap text-sm mb-2">{getSetCues(bit) || 'Inga stödord ännu'}</p>}
                {rehearsalView !== 'cues' && <p className="text-neutral-300 whitespace-pre-wrap text-sm leading-relaxed">{bit.premise || 'Ingen skämttext'}</p>}
              </article>
            ))}
          </div>
          </>}
        </div>
      </div>
    );
  }

  if (isGigMode) {
    if (gigPhase === 'live') {
      const liveMin = Math.floor(liveSeconds / 60);
      const liveSec = liveSeconds % 60;
      const timeLeft = targetSeconds - liveSeconds;
      const timerColor = timeLeft < 0 ? "text-red-500 animate-pulse" : timeLeft <= 120 ? "text-yellow-400" : "text-green-400";
      
      return (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col p-3 md:p-12 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 pb-2 mb-2 md:pb-4 md:mb-4 gap-2 md:gap-6 text-left">
            <div>
              <h1 className="text-sm md:text-2xl font-bold text-neutral-300 uppercase tracking-wider">{title || "Namnlös Setlist"}</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4 bg-neutral-950 border border-neutral-800 px-2 md:px-4 py-1 md:py-2 rounded-xl shadow-xl justify-between">
              <div className="flex flex-col items-center">
                <span className={`text-xl md:text-3xl font-mono font-black ${timerColor}`}>{String(liveMin).padStart(2, '0')}:{String(liveSec).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-2 border-l border-neutral-800 pl-4">
                {/* Timer only. The old microphone icon did not make an audio recording. */}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-2 md:p-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-colors">
                  {isTimerRunning ? <Pause size={20} /> : <Play size={20} className="fill-white" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 w-auto mt-0">
              {!performedAt && (
                <button onClick={() => { setGigPhase('eval-overall'); setIsTimerRunning(false); }} className="justify-center px-2 md:px-4 py-2 bg-neutral-800 hover:bg-green-700 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                  <Check size={14} /> Avsluta
                </button>
              )}
            </div>
          </div>
          <div className="max-w-4xl mx-auto w-full flex justify-end gap-2 pb-2">
            <button onClick={() => setStageDensity('compact')} aria-pressed={stageDensity === 'compact'} className={`text-xs rounded px-3 py-1.5 ${stageDensity === 'compact' ? 'bg-neutral-700' : 'bg-neutral-900 text-neutral-400'}`}>Kompakt</button>
            <button onClick={() => setStageDensity('comfortable')} aria-pressed={stageDensity === 'comfortable'} className={`text-xs rounded px-3 py-1.5 ${stageDensity === 'comfortable' ? 'bg-neutral-700' : 'bg-neutral-900 text-neutral-400'}`}>Stor text</button>
          </div>
          <div className={`max-w-4xl mx-auto w-full ${stageDensity === 'compact' ? 'space-y-2' : 'space-y-5'} pb-8`}>
            {setlistBits.map((bit, index) => (
              <div key={bit.id}>
              {memoryCards.find(card => card.start_bit_id === String(bit.id)) && <div className="mt-2 mb-1 border-t border-purple-900/60 pt-1 text-xs uppercase tracking-widest text-purple-300 font-semibold">{memoryCards.find(card => card.start_bit_id === String(bit.id))?.title}</div>}
              <div className={`border-l-2 border-neutral-700 ${stageDensity === 'compact' ? 'pl-3 py-1' : 'pl-4 py-2'}`}>
                <div className="flex items-baseline gap-3 justify-between">
                  <h2 className={`${stageDensity === 'compact' ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-extrabold tracking-tight leading-tight`}><span className="text-purple-400 mr-2">{index + 1}.</span>{bit.title}{bit.is_routine && <span className="text-[9px] font-bold text-orange-300 border border-orange-800 rounded px-1">RUTIN</span>}</h2>
                  <span className="shrink-0 text-xs text-neutral-500">{Math.round((bit.duration_seconds || 0) / 60 * 10) / 10} min</span>
                </div>
                {getSetCues(bit) && <p className={`${stageDensity === 'compact' ? 'text-sm' : 'text-base sm:text-lg'} text-neutral-300 mt-1 whitespace-pre-wrap leading-snug`}>{getSetCues(bit)}</p>}
              </div>
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
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Bra jobbat på scen!</h2>
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
                <span className="font-bold text-[10px] md:text-xs uppercase text-center leading-tight">Guld<br className="hidden md:block" />(★★★)</span>
              </button>
              <div />
              <button onClick={() => handleSwipe(currentBit.id, 'left')} className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors">
                <ChevronLeft size={32} className="md:w-[40px] md:h-[40px]" />
                <span className="font-bold text-[10px] md:text-xs uppercase text-center leading-tight">Bomb<br className="hidden md:block" />(★)</span>
              </button>
              <button onClick={() => handleSwipe(currentBit.id, 'down')} className="flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-4 text-neutral-500 hover:bg-neutral-800 rounded-2xl transition-colors">
                <SkipForward size={20} className="md:w-[24px] md:h-[24px]" />
                <span className="font-bold text-[10px] md:text-xs uppercase mt-1 md:mt-2">Hoppa</span>
              </button>
              <button onClick={() => handleSwipe(currentBit.id, 'right')} className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 text-green-500 hover:bg-green-500/10 rounded-2xl transition-colors">
                <ChevronRight size={32} className="md:w-[40px] md:h-[40px]" />
                <span className="font-bold text-[10px] md:text-xs uppercase text-center leading-tight">Bra<br className="hidden md:block" />(★★)</span>
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
      <nav className="md:hidden sticky top-0 z-30 flex w-full shrink-0 gap-1 border-b border-purple-900/40 bg-[#101016] p-2" aria-label="Setbyggarens mobilvy">
        {([['set', 'Setlista'], ['library', 'Bibliotek'], ['saved', 'Sparade']] as const).map(([view, label]) => (
          <button key={view} onClick={() => setMobileView(view)} aria-pressed={mobileView === view} className={`flex-1 rounded-lg px-2 py-3 text-sm font-bold ${mobileView === view ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
            {label}{view === 'set' && setlist.length > 0 ? ` (${setlist.length})` : ''}
          </button>
        ))}
      </nav>
      {/* Vänster Meny: Sparade Setlists */}
      <div className={`${mobileView === 'saved' ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-b md:border-b-0 md:border-r border-indigo-950/40 bg-neutral-900/40 p-4 md:p-6 flex-col h-[calc(100dvh-64px)] md:h-full shrink-0`}>
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
                className={`p-3 md:p-4 rounded-xl cursor-pointer border transition-all group ${activeId === setlistObj.id ? 'bg-purple-950/20 border-purple-500/50 shadow-md' : isPerformed ? 'bg-neutral-900/20 border-neutral-800/50 opacity-60 hover:opacity-100 hover:border-purple-900/50' : 'bg-neutral-900/60 border-neutral-800 hover:border-purple-900/50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate pr-2 text-xs md:text-sm flex items-center gap-2">
                    {setlistObj.title || "Namnlös Setlist"}
                    {isPerformed && <span title={`Genomfört! Betyg: ${score}/5`} className="flex items-center gap-0.5 text-orange-500"><Flame size={12} className="fill-orange-500" /></span>}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" disabled={isSaving} title="Klona setlistan" aria-label={`Klona ${setlistObj.title || 'setlista'}`} onClick={(e) => { e.stopPropagation(); void cloneSavedSetlist(setlistObj); }} className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-100 disabled:opacity-50"><Plus size={15} /> Klona</button>
                    <button type="button" onClick={(e) => deleteSetlist(e, setlistObj.id)} className="text-neutral-500 hover:text-red-400" aria-label="Radera setlista"><Trash2 size={15} /></button>
                  </div>
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
      <div className={`${mobileView === 'saved' ? 'hidden' : 'flex'} md:flex flex-1 p-3 md:p-10 flex-col min-w-0 md:h-full md:overflow-y-auto`}>
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
            {setlistBits.length > 0 && <button onClick={() => setIsRehearsalMode(true)} className="flex items-center justify-center flex-1 lg:flex-none gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-lg font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs md:text-sm"><Edit3 size={16} /> Repetera</button>}
            {setlistBits.length > 0 && <button onClick={() => { setPrintMemoryCards(false); setIsPrintMode(true); }} className="flex items-center justify-center flex-1 lg:flex-none gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-lg font-bold transition-all bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs md:text-sm"><Printer size={16} /> <span className="hidden lg:inline">Fusklapp</span></button>}
            {orderedMemoryCards.length > 0 && <button onClick={() => { setPrintMemoryCards(true); setIsPrintMode(true); }} className="flex items-center justify-center flex-1 lg:flex-none gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-lg font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-purple-800 text-xs md:text-sm"><Printer size={16} /> Skriv ut A6-lappar</button>}
            {setlistBits.length > 0 && !performedAt && <button onClick={() => { setIsGigMode(true); setIsTimerRunning(false); }} className="flex items-center justify-center flex-1 lg:flex-none gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg text-xs md:text-sm"><Play size={16} className="fill-white" /> Starta Gig</button>}
            {activeId !== null && <button onClick={handleCloneCurrent} disabled={isSaving} className="flex items-center justify-center flex-1 lg:flex-none gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-indigo-900/60 hover:bg-indigo-800 text-white border border-indigo-700 disabled:opacity-50"><Plus size={16} /> Klona</button>}
            {!performedAt && <button onClick={() => handleSave()} disabled={isSaving || !title} className={`flex items-center justify-center flex-1 lg:flex-none gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 ${(isSaving || !title) ? "opacity-50 cursor-not-allowed" : ""}`}>{saved ? <Check size={16} /> : <Save size={16} />} Spara</button>}
          </div>
        </div>

        {saveError && <p role="alert" className="mb-3 rounded-lg border border-red-700 bg-red-950/40 text-red-200 px-3 py-2 text-sm">Setlistan kunde inte sparas: {saveError}. Kontrollera att databasmigreringen är installerad.</p>}

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
            <div className={`${mobileView === 'library' ? 'flex' : 'hidden'} md:flex flex-1 bg-neutral-900/50 border border-neutral-800/80 rounded-xl flex-col overflow-hidden h-[calc(100dvh-320px)] xl:h-auto min-h-[350px]`}>
              <div className="p-3 md:p-4 border-b border-neutral-800 space-y-2 md:space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-neutral-300 text-xs md:text-sm flex items-center gap-2">
                    <FolderOpen size={14} className="text-purple-400" /> Bibliotek ({filteredAvailableBits.length})
                  </h3>
                </div>
                
                {/* UPPDATERAT SÖK-BLOCK MED BÅDE VANLIG SÖK OCH AI-SÖK */}
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 w-full">
                    <div className="flex gap-1 bg-neutral-950 rounded-lg border border-neutral-800 p-1 shrink-0">
                    <button type="button" onClick={() => setLibraryTab('bits')} className={`px-2 py-1 rounded text-xs ${libraryTab === 'bits' ? 'bg-purple-700 text-white' : 'text-neutral-400'}`}>Skämt</button>
                    <button type="button" onClick={() => setLibraryTab('routines')} className={`px-2 py-1 rounded text-xs ${libraryTab === 'routines' ? 'bg-purple-700 text-white' : 'text-neutral-400'}`}>Rutiner</button>
                  </div>
                  <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input type="text" placeholder="Sök text..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" />
                      {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"><X size={12} /></button>}
                    </div>
                    <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${showAdvancedFilters || activeFilterCount > 0 ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}>
                      <Filter size={14} /> <span className="hidden sm:inline">Filter</span>
                      {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                  </div>

                  {libraryTab === 'bits' && <button
                    type="button"
                    onClick={() => setFocusOnly(value => !value)}
                    aria-pressed={focusOnly}
                    className={`self-start flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${focusOnly ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-amber-300'}`}
                    title="Visa bara skämt markerade Fokus i Comedy Writer"
                  >
                    <Flame size={14} fill={focusOnly ? 'currentColor' : 'none'} /> Bara Fokus
                  </button>}

                  {libraryTab === 'bits' && <div className="relative w-full">
                    <Sparkles size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${aiSuggestedIds !== null ? 'text-pink-400 animate-pulse' : 'text-pink-600/50'}`} />
                    <input 
                      type="text" 
                      placeholder="✨ AI-sök på tema (t.ex. bakfylla, ångest, pengar)..." 
                      value={aiThemeQuery}
                      onChange={(e) => setAiThemeQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchThemeWithAI()}
                      className={`w-full bg-neutral-950 border rounded-lg pl-9 pr-20 py-1.5 text-xs text-white outline-none transition-colors ${aiSuggestedIds !== null ? 'border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-pink-900/30 focus:border-pink-600/60'}`} 
                    />
                    
                    {aiSuggestedIds !== null && (
                      <button onClick={() => { setAiSuggestedIds(null); setAiThemeQuery(""); }} className="absolute right-14 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                        <X size={12} />
                      </button>
                    )}
                    
                    <button 
                      onClick={searchThemeWithAI}
                      disabled={isAiSearching || !aiThemeQuery.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-pink-600 hover:bg-pink-500 disabled:opacity-30 disabled:hover:bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center justify-center min-w-[40px]"
                    >
                      {isAiSearching ? <Loader2 size={12} className="animate-spin" /> : "Hitta"}
                    </button>
                  </div>}
                </div>

                {/* INFÄLLBARA FILTER */}
                {libraryTab === 'bits' && showAdvancedFilters && (
                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-3 space-y-3 text-xs animate-in fade-in">
                    <div className="flex justify-between items-center border-b border-neutral-800/60 pb-2">
                      <span className="font-bold text-neutral-400">Filtrera skämt</span>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-red-400 hover:text-red-300 flex items-center gap-1"><Eraser size={12} /> Töm</button>
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
                        <option value="Testa">Testa</option>
                        <option value="Redo">Redo</option>
                        <option value="Råidé">Råidé</option>
                        <option value="Omarbeta">Omarbeta</option>
                        <option value="Burned">Burned</option>
                        <option value="Källaren">Källaren</option>
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
                        <option value="Roastskämt">Roastskämt</option>
                        <option value="Nyhetsskämt">Nyhetsskämt</option>
                        <option value="Listskämt">Listskämt</option>
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
                        <button onClick={() => handleProfileChange('ingen')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'ingen' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><X size={10} /> Ingen</button>
                        <button onClick={() => handleProfileChange('klubb')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'klubb' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Mic size={10} /> Klubb</button>
                        <button onClick={() => handleProfileChange('foretag')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'foretag' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Briefcase size={10} /> Företag</button>
                        <button onClick={() => handleProfileChange('test')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'test' ? 'bg-orange-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Edit3 size={10} /> Test</button>
                        <button onClick={() => handleProfileChange('tema')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'tema' ? 'bg-pink-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Sparkles size={10} /> Temagig</button>
                        <button onClick={() => handleProfileChange('special')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${gigProfile === 'special' ? 'bg-purple-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}><Film size={10} /> Special</button>
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
                {libraryTab === 'routines' && <>
                  {routineLoadError && <p className="text-red-400 text-xs">Rutiner kunde inte hämtas: {routineLoadError}</p>}
                  {routines.filter(r => !setlist.includes(routineKey(String(r.id))) &&
                    `${r.title || ''} ${r.status || ''}`.toLowerCase().includes(searchQuery.toLowerCase())).map(r => (
                    <div key={r.id} className="border border-orange-900/50 bg-neutral-950 p-3 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div><h4 className="text-sm font-semibold text-orange-200">{r.title || 'Namnlös rutin'}</h4>
                          <p className="text-xs text-neutral-500">{(r.items || []).filter((item: any) => item.type === 'bit').length} skämt · {r.status || 'Råidé'}</p>
                        </div>
                        <button type="button" title="Lägg till hela rutinen" onClick={() => addRoutine(r)} className="p-2 rounded bg-orange-900/30 hover:bg-orange-800/50 text-orange-200"><Plus size={16}/></button>
                      </div>
                    </div>
                  ))}
                </>}
                {libraryTab === 'bits' && filteredAvailableBits.map(bit => {
                  const powerScore = calculatePowerScore(bit.gig_stats);
                  const hasSwipes = bit.gig_stats && bit.gig_stats.current && (bit.gig_stats.current.guld > 0 || bit.gig_stats.current.bra > 0 || bit.gig_stats.current.bomb > 0);
                  
                  return (
                    <div
                      key={bit.id}
                      onClick={() => setExpandedLibraryBitId(expandedLibraryBitId === bit.id ? null : bit.id)}
                      className="p-2.5 md:p-3 border border-neutral-800/80 bg-neutral-950 hover:border-purple-500/50 rounded-lg cursor-pointer flex flex-col group transition-all"
                    >
                      <div className="flex items-center justify-between">
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
                        <button
                          onClick={(e) => { e.stopPropagation(); addBit(bit.id); }}
                          className="text-neutral-600 hover:text-purple-400 bg-neutral-900 p-1.5 rounded shrink-0 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {expandedLibraryBitId === bit.id && (
                        <div className="mt-2 pt-2 border-t border-neutral-800/60 text-xs md:text-sm text-neutral-400 leading-relaxed">
                          {bit.premise || "Ingen text tillagd för detta skämt."}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HÖGER: Setlistan */}
          <div className={`${mobileView === 'set' ? 'flex' : 'hidden'} md:flex ${performedAt ? 'w-full max-w-3xl mx-auto h-[65dvh]' : 'flex-1 h-[65dvh] xl:h-auto min-h-[400px]'} bg-purple-950/10 border border-purple-900/30 rounded-xl flex flex-col overflow-hidden shadow-inner`}>
            <div className="p-3 md:p-4 border-b border-purple-950/30 bg-neutral-900/80 flex justify-between items-center">
              <h3 className="font-semibold text-purple-300 text-xs md:text-sm flex items-center gap-2"><ListMusic size={14} className="text-purple-400 md:w-4 md:h-4" /> Ordning</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3">
              {setlistBits.map((bit, index) => {
                const collisionInfo = getCollisionWarning(bit.id);
                const powerScore = calculatePowerScore(bit.gig_stats);
                const hasSwipes = bit.gig_stats && bit.gig_stats.current && (bit.gig_stats.current.guld > 0 || bit.gig_stats.current.bra > 0 || bit.gig_stats.current.bomb > 0);
                
                return (
                  <div key={bit.id} className="space-y-1">
                    {(orderedMemoryCards.some(card => card.start_bit_id === String(bit.id))) && (
                      <div className="rounded-lg border border-purple-800/50 bg-purple-950/30 p-2 flex items-center gap-2">
                        <span className="text-purple-300 text-xs font-bold shrink-0">Minneslapp</span>
                        <input aria-label="Minneslappens tema" disabled={!!performedAt} className="min-w-0 flex-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-white" value={orderedMemoryCards.find(card => card.start_bit_id === String(bit.id))?.title || ''} onChange={e => setMemoryCards(prev => prev.some(card => card.start_bit_id === String(bit.id)) ? prev.map(card => card.start_bit_id === String(bit.id) ? {...card, title: e.target.value} : card) : [...prev, {start_bit_id: String(bit.id), title: e.target.value}])} />
                        {!performedAt && orderedMemoryCards.length > 1 && (
                          <div className="flex items-center gap-1 shrink-0" aria-label="Flytta hela minneslappen">
                            <button type="button" title="Flytta hela lappen upp" aria-label="Flytta hela lappen upp" onClick={() => moveMemoryCard(String(bit.id), 'up')} disabled={orderedMemoryCards[0]?.start_bit_id === String(bit.id)} className="p-1 text-purple-300 hover:text-white disabled:opacity-25"><ChevronUp size={16}/></button>
                            <button type="button" title="Flytta hela lappen ned" aria-label="Flytta hela lappen ned" onClick={() => moveMemoryCard(String(bit.id), 'down')} disabled={orderedMemoryCards[orderedMemoryCards.length - 1]?.start_bit_id === String(bit.id)} className="p-1 text-purple-300 hover:text-white disabled:opacity-25"><ChevronDown size={16}/></button>
                          </div>
                        )}
                        {!performedAt && memoryCards.some(card => card.start_bit_id === String(bit.id)) && <button title="Ta bort lappgräns" onClick={() => toggleMemoryBoundary(String(bit.id))}><X size={14}/></button>}
                      </div>
                    )}
                    {!performedAt && !memoryCards.some(card => card.start_bit_id === String(bit.id)) && <button onClick={() => toggleMemoryBoundary(String(bit.id))} className="text-[10px] text-purple-400/70 hover:text-purple-200 px-2">+ Ny minneslapp här</button>}
                  <div draggable={!performedAt} onDragStart={(e) => onDragStart(e, index)} onDragOver={(e) => onDragOver(e, index)} onDrop={(e) => onDrop(e, index)} className={`p-2.5 md:p-3 bg-neutral-950 border-l-4 border-neutral-800 border-y border-r rounded-lg flex items-center justify-between ${!performedAt ? 'cursor-grab active:cursor-grabbing hover:border-purple-500/40' : ''}`}>
                    <div className="flex items-center gap-2 md:gap-2.5 w-full">
                      {!performedAt && <GripVertical size={16} className="text-neutral-600 hidden md:block" />}
                      {!performedAt && (
                        <div className="flex flex-col gap-1 md:hidden bg-neutral-900 rounded p-1">
                          <button onClick={(e) => { e.stopPropagation(); moveBit(index, 'up'); }} disabled={index === 0} className="text-neutral-500 hover:text-white disabled:opacity-20"><ChevronUp size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); moveBit(index, 'down'); }} disabled={index === setlistBits.length - 1} className="text-neutral-500 hover:text-white disabled:opacity-20"><ChevronDown size={16} /></button>
                        </div>
                      )}
                      
                      {/* KLICKBAR DEL FÖR ATT FÄLLA UT SKÄMTET */}
                      <div className="flex-1 cursor-pointer" onClick={() => setExpandedBitId(expandedBitId === bit.id ? null : bit.id)}>
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
                        {!performedAt && collisionInfo && <div className="mt-1 text-red-400 text-[9px] md:text-[10px] font-bold"><AlertOctagon size={10} className="inline mr-1" />{collisionInfo}</div>}
                        
                        {/* Setets egna stödord – originalet i biblioteket förblir oförändrat. */}
                        {!performedAt && (
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                            <label htmlFor={`set-cue-${bit.id}`} className="block text-[10px] uppercase tracking-wide font-bold text-purple-400 mb-1">Stödord i detta set</label>
                            <textarea
                              id={`set-cue-${bit.id}`}
                              rows={2}
                              value={getSetCues(bit)}
                              onChange={e => setCueOverrides(prev => ({ ...prev, [String(bit.id)]: e.target.value }))}
                              placeholder="Egna stödord till det här giget…"
                              className="w-full resize-y bg-neutral-900 border border-neutral-700 rounded-md p-2 text-xs text-white outline-none focus:border-purple-500"
                            />
                            <button onClick={() => setCueOverrides(prev => ({ ...prev, [String(bit.id)]: bit.stage_cues || '' }))} className="text-[10px] text-neutral-400 hover:text-purple-300 mt-1">Återställ från biblioteket</button>
                          </div>
                        )}
                        {/* HÄR FÄLLS TEXTEN UT */}
                        {expandedBitId === bit.id && (
                          <div className="mt-2 p-2.5 md:p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs md:text-sm text-neutral-300 leading-relaxed shadow-inner">
                            {bit.premise || "Ingen text tillagd för detta skämt."}
                          </div>
                        )}
                      </div>
                    </div>
                    {!performedAt && <button onClick={(e) => removeBit(e, bit.id)} className="text-neutral-600 hover:text-red-400 p-1 md:p-1.5 ml-1 md:ml-2"><Trash2 size={14} className="md:w-[15px] md:h-[15px]" /></button>}
                  </div>
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