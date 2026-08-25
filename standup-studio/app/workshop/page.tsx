"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, Save, Check, Plus, Tag as TagIcon, Loader2,
  BotMessageSquare, X, CornerDownRight, Star, ShieldAlert,
  Layers, Smile, AlignLeft, Clock, History, Activity, RotateCcw, Trash2
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import ReactMarkdown from "react-markdown";

function WorkshopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [status, setStatus] = useState("Råidé");
  const [priority, setPriority] = useState<number>(1);
  const [mood, setMood] = useState("Avmätt");
  const [role, setRole] = useState("Story");
  const [riskLevel, setRiskLevel] = useState("Klubb");
  const [format, setFormat] = useState("observation");
  const [durationSeconds, setDurationSeconds] = useState<number>(20);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [comedyTags, setComedyTags] = useState<string[]>([]);
  const [history, setHistory] = useState<{ date: string, text: string }[]>([]);
  const [lastSavedPremise, setLastSavedPremise] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [gigStats, setGigStats] = useState<any>({
    current: { guld: 0, bra: 0, bomb: 0 },
    historical: { guld: 0, bra: 0, bomb: 0 }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (urlId) {
      setActiveId(urlId);
      fetchBit(urlId);
    } else {
      startNew();
    }
  }, [urlId]);

  const fetchBit = async (id: string) => {
    const { data, error } = await supabase.from("bits").select("*").eq("id", id).single();
    if (data) {
      setTitle(data.title || "");
      setPremise(data.premise || "");
      setLastSavedPremise(data.premise || "");
      setStatus(data.status || "Råidé");
      setPriority(Number(data.priority) || 1);
      setMood(data.mood || "Avmätt");
      setRole(data.role || "Story");
      setRiskLevel(data.risk_level || "Klubb");
      setFormat(data.format || "observation");
      setDurationSeconds(data.duration_seconds !== null ? Number(data.duration_seconds) : 20);
      setTags(Array.isArray(data.tags) ? data.tags : []);
      setComedyTags(Array.isArray(data.comedy_tags) ? data.comedy_tags : []);
      setHistory(Array.isArray(data.history) ? data.history : []);
      setGigStats(data.gig_stats || { current: { guld: 0, bra: 0, bomb: 0 }, historical: { guld: 0, bra: 0, bomb: 0 } });
      setAiFeedback(null);
    } else if (error) {
      console.error("Kunde inte hämta skämtet:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let updatedHistory = [...history];

    if (activeId && premise !== lastSavedPremise && lastSavedPremise.trim() !== "") {
      updatedHistory = [{ date: new Date().toISOString(), text: lastSavedPremise }, ...updatedHistory];
    }

    const payload = {
      title, premise, status, priority, mood, role,
      risk_level: riskLevel, format, duration_seconds: durationSeconds,
      tags: tags || [], comedy_tags: comedyTags || [], history: updatedHistory,
      gig_stats: gigStats
    };

    if (activeId) {
      const { error } = await supabase.from("bits").update(payload).eq("id", activeId);
      if (!error) {
        setLastSavedPremise(premise);
        setHistory(updatedHistory);
        showSavedFeedback();
      } else { alert("Databasfel: " + error.message); }
    } else {
      const { data, error } = await supabase.from("bits").insert([payload]).select().single();
      if (data) {
        setLastSavedPremise(premise);
        setHistory(updatedHistory);
        showSavedFeedback();
        setActiveId(String(data.id));
        window.history.replaceState(null, "", `/workshop?id=${data.id}`);
      } else if (error) { alert("Databasfel: " + error.message); }
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!activeId) return;
    if (window.confirm("Är du säker på att du vill slänga det här skämtet? Detta går inte att ångra.")) {
      const { error } = await supabase.from("bits").delete().eq("id", activeId);
      if (!error) {
        startNew();
      } else {
        alert("Kunde inte radera skämtet: " + error.message);
      }
    }
  };

  const handleResetStats = async () => {
    if (!window.confirm("Vill du nollställa den aktuella statistiken? (Total historik sparas i parentes)")) return;
    const resetStats = {
      ...gigStats,
      current: { guld: 0, bra: 0, bomb: 0 }
    };
    setGigStats(resetStats);
    if (activeId) {
      await supabase.from("bits").update({ gig_stats: resetStats }).eq("id", activeId);
    }
  };

  const calculatePowerScore = (stats: any) => {
    if (!stats || !stats.current) return 0;
    const total = (stats.current.guld || 0) + (stats.current.bra || 0) + (stats.current.bomb || 0);
    if (total === 0) return 0;
    return (((stats.current.guld || 0) * 5) + ((stats.current.bra || 0) * 4) + ((stats.current.bomb || 0) * 1)) / total;
  };

  const calculateHistoricalPowerScore = (stats: any) => {
    if (!stats || !stats.historical) return 0;
    const total = (stats.historical.guld || 0) + (stats.historical.bra || 0) + (stats.historical.bomb || 0);
    if (total === 0) return 0;
    return (((stats.historical.guld || 0) * 5) + ((stats.historical.bra || 0) * 4) + ((stats.historical.bomb || 0) * 1)) / total;
  };

  const showSavedFeedback = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const startNew = () => {
    setActiveId(null);
    setTitle("");
    setPremise("");
    setLastSavedPremise("");
    setStatus("Råidé");
    setPriority(1);
    setMood("Avmätt");
    setRole("Story");
    setRiskLevel("Klubb");
    setFormat("observation");
    setDurationSeconds(20);
    setTags([]);
    setComedyTags([]);
    setHistory([]);
    setGigStats({ current: { guld: 0, bra: 0, bomb: 0 }, historical: { guld: 0, bra: 0, bomb: 0 } });
    setTagInput("");
    setAiFeedback(null);
    window.history.replaceState(null, "", "/workshop");
  };

  const handleDuplicate = () => {
    setActiveId(null);
    setTitle(title ? title + " - kopia" : "Ny kopia");
    setSaved(false);
    setHistory([]);
    setGigStats({ current: { guld: 0, bra: 0, bomb: 0 }, historical: { guld: 0, bra: 0, bomb: 0 } });
    window.history.replaceState(null, "", "/workshop");
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) { setTags([...tags, newTag]); }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => { 
    setTags(tags.filter(t => t !== tagToRemove)); 
  };
  
  const addComedyTag = () => { setComedyTags([...comedyTags, ""]); };
  
  const updateComedyTag = (index: number, value: string) => {
    const newTags = [...comedyTags]; 
    newTags[index] = value; 
    setComedyTags(newTags);
  };
  
  const removeComedyTag = (index: number) => { 
    setComedyTags(comedyTags.filter((_, i) => i !== index)); 
  };

  const handleAnalyze = async () => {
    if (!premise || premise.length < 10) { alert("Skriv lite mer premiss först!"); return; }
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premise: premise + "\n\nTags:\n" + comedyTags.join("\n") }),
      });
      const data = await res.json();
      if (data.feedback) setAiFeedback(data.feedback);
      if (data.suggestedTags && Array.isArray(data.suggestedTags)) {
        setTags(prevTags => {
          const updatedTags = [...prevTags];
          data.suggestedTags.forEach((t: string) => {
            const cleanTag = t.trim().toLowerCase();
            if (!updatedTags.includes(cleanTag)) updatedTags.push(cleanTag);
          });
          return updatedTags;
        });
      }
    } catch (error) { console.error("Analysis error:", error); }
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-neutral-950 text-white">
      <div className="flex-1 p-6 md:p-10 flex flex-col border-r border-neutral-800 relative h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <input
            type="text" placeholder="Arbetstitel..."
            className="bg-transparent text-3xl font-bold outline-none text-white placeholder-neutral-700 w-full"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex items-center gap-2 shrink-0">
            {activeId && (
              <>
                <button
                  onClick={() => router.push(`/setlists?addBit=${activeId}`)}
                  title="Lägg till i Setlist"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-all"
                >
                  <Layers size={14} /> <span className="hidden sm:inline">Till Setlist</span>
                </button>
                <button
                  onClick={() => router.push(`/rutinbyggaren?addBit=${activeId}`)}
                  title="Lägg till i Rutinbyggaren"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-all"
                >
                  <AlignLeft size={14} /> <span className="hidden sm:inline">Till Rutinbyggaren</span>
                </button>
                <button
                  onClick={handleDelete}
                  title="Släng skämt"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-red-400 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 transition-all"
                >
                  <Trash2 size={14} /> <span className="hidden sm:inline">Släng</span>
                </button>
              </>
            )}
            
            <button onClick={handleDuplicate} className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-all">
              <Plus size={14} /> Ny kopia
            </button>
            
            <button
              onClick={handleSave} disabled={isSaving || !title}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40"} ${(isSaving || !title) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? "Sparad!" : isSaving ? "Sparar..." : "Spara"}
            </button>
          </div>
        </div>

        {/* METADATA-KONTROLLER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6 bg-neutral-900/70 border border-neutral-800/80 p-2.5 rounded-xl shrink-0">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><TagIcon size={10} /> Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-300 rounded px-2 py-1 outline-none cursor-pointer">
              <option value="Råidé">Råidé</option>
              <option value="Omarbeta">Omarbeta</option>
              <option value="Testad">Testad</option>
              <option value="Klubbklar">Klubbklar</option>
              <option value="Burned">Burned</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><Star size={10} className="text-yellow-500" /> Betyg</label>
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded px-2 py-1 justify-between">
              {[1, 2, 3].map((s) => (
                <button key={s} type="button" onClick={() => setPriority(s)} className={`text-xs ${priority >= s ? "text-yellow-400 font-bold" : "text-neutral-700 hover:text-neutral-500"}`}>★</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><Clock size={10} className="text-purple-400" /> Speltid</label>
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded px-1.5 py-1 justify-center gap-0.5">
              <input type="number" min="0" value={Math.floor(durationSeconds / 60)} onChange={(e) => setDurationSeconds((parseInt(e.target.value) || 0) * 60 + (durationSeconds % 60))} className="w-6 bg-transparent text-xs font-semibold text-white text-center outline-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
              <span className="text-[10px] text-neutral-500">m</span><span className="text-[10px] text-neutral-700 mx-0.5">:</span>
              <input type="number" min="0" max="59" value={durationSeconds % 60} onChange={(e) => setDurationSeconds(Math.floor(durationSeconds / 60) * 60 + (parseInt(e.target.value) || 0))} className="w-6 bg-transparent text-xs font-semibold text-white text-center outline-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
              <span className="text-[10px] text-neutral-500">s</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><Smile size={10} /> Mood</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-300 rounded px-2 py-1 outline-none cursor-pointer">
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
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><Layers size={10} /> Roll</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-300 rounded px-2 py-1 outline-none cursor-pointer">
              <option value="Öppnare">Öppnare</option>
              <option value="Story">Story/Block</option>
              <option value="Callback">Callback</option>
              <option value="Stängare">Stängare</option>
              <option value="Roastskämt">Roastskämt</option>
              <option value="Nyhetsskämt">Nyhetsskämt</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><ShieldAlert size={10} /> Risknivå</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-300 rounded px-2 py-1 outline-none cursor-pointer">
              <option value="Familj/Företag">Trygg/Företag</option>
              <option value="Klubb">Klubb</option>
              <option value="Mörkt">Late Night / Mörkt</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><AlignLeft size={10} /> Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-300 rounded px-2 py-1 outline-none cursor-pointer">
              <option value="oneliner">Oneliner</option>
              <option value="observation">Observation</option>
              <option value="story">Lång Story</option>
            </select>
          </div>
        </div>

        {/* GIG-STATISTIK / POWER RANKING */}
        {activeId && gigStats && (
          <div className="mb-6 bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-xl shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Power Ranking</span>
                <div className="flex items-center gap-1.5 text-orange-400 font-black text-xl">
                  <Activity size={18} /> {calculatePowerScore(gigStats).toFixed(1)} <span className="text-xs text-neutral-600 font-medium">({calculateHistoricalPowerScore(gigStats).toFixed(1)})</span>
                </div>
              </div>
              <div className="flex gap-4 border-l border-neutral-800 pl-6">
                <div className="text-center">
                  <span className="text-[9px] font-bold text-yellow-500 uppercase block">Guld</span>
                  <span className="text-sm font-bold text-white">{gigStats.current?.guld || 0} <span className="text-[10px] text-neutral-600">({gigStats.historical?.guld || 0})</span></span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-green-500 uppercase block">Bra</span>
                  <span className="text-sm font-bold text-white">{gigStats.current?.bra || 0} <span className="text-[10px] text-neutral-600">({gigStats.historical?.bra || 0})</span></span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-red-500 uppercase block">Bomb</span>
                  <span className="text-sm font-bold text-white">{gigStats.current?.bomb || 0} <span className="text-[10px] text-neutral-600">({gigStats.historical?.bomb || 0})</span></span>
                </div>
              </div>
            </div>
            {(gigStats.current?.guld > 0 || gigStats.current?.bra > 0 || gigStats.current?.bomb > 0) && (
              <button onClick={handleResetStats} className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 hover:text-red-400 transition-colors bg-neutral-950 px-2.5 py-1.5 rounded border border-neutral-800 hover:border-red-900/50">
                <RotateCcw size={12} /> Nollställ ny statistik
              </button>
            )}
          </div>
        )}

        {/* HASHTAGS */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-neutral-800/60 pb-4 shrink-0">
          {(tags || []).map(tag => (
            <span key={tag} className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
              <span className="text-neutral-500">#</span>{tag}
              <button onClick={() => removeTag(tag)} className="text-neutral-500 hover:text-red-400 transition-colors ml-1"><X size={12} /></button>
            </span>
          ))}
          <input type="text" placeholder={(tags || []).length === 0 ? "Lägg till tagg..." : "+ Ny tagg..."} className="bg-transparent text-xs text-neutral-400 placeholder-neutral-600 outline-none w-48 ml-1" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} />
        </div>

        {/* PREMISS */}
        <textarea
          className="w-full flex-1 min-h-[220px] bg-transparent text-neutral-200 placeholder-neutral-700 outline-none resize-none leading-relaxed text-lg mb-8"
          placeholder="Skriv din premiss, observation och setup här..."
          value={premise} onChange={(e) => setPremise(e.target.value)}
        />

        {/* PUNCHLINES / FÖLJDSKÄMT */}
        <div className="shrink-0 border-t border-neutral-800/60 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <CornerDownRight size={14} /> Följdskämt / Punchlines / Tags
            </h3>
          </div>
          <div className="space-y-2.5 mb-3">
            {(comedyTags || []).map((tag, index) => (
              <div key={index} className="flex gap-2.5 items-start group">
                <div className="mt-2 text-neutral-600"><CornerDownRight size={14} /></div>
                <textarea
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-600 outline-none focus:border-blue-500/50 resize-none min-h-[50px]"
                  placeholder={`Följdskämt #${index + 1}...`} 
                  value={tag} 
                  onChange={(e) => updateComedyTag(index, e.target.value)}
                />
                <button onClick={() => removeComedyTag(index)} className="mt-2 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1.5"><X size={16} /></button>
              </div>
            ))}
          </div>
          <button onClick={addComedyTag} className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 py-1.5">
            <Plus size={14} /> Lägg till följdskämt
          </button>
        </div>

        {/* ÄNDRINGSHISTORIK */}
        {activeId && history.length > 0 && (
          <div className="shrink-0 border-t border-neutral-800/60 pt-6 pb-10 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <History size={14} className="text-neutral-500" /> Ändringshistorik ({history.length})
              </h3>
              <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                {showHistory ? "Dölj historik" : "Visa äldre versioner"}
              </button>
            </div>
            {showHistory && (
              <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                {history.map((h, i) => (
                  <div key={i} className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-4 group hover:border-neutral-700 transition-colors">
                    <div className="flex justify-between items-center mb-3 border-b border-neutral-800/50 pb-2">
                      <span className="text-[11px] font-mono text-neutral-500">Sparad: {new Date(h.date).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}</span>
                      <button
                        onClick={() => { if (window.confirm("Vill du ersätta din nuvarande text med denna gamla version?")) { setPremise(h.text); } }}
                        className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-2.5 py-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Återställ
                      </button>
                    </div>
                    <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">{h.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Höger: AI-Anatomi */}
      <div className="w-full md:w-96 bg-neutral-900/60 p-6 flex flex-col gap-6 overflow-y-auto border-t md:border-t-0 md:border-l border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2 text-blue-400"><Sparkles size={18} /><h2 className="font-semibold text-base">AI-Anatomi</h2></div>
          <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 p-2 rounded-lg transition-all disabled:opacity-50">
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BotMessageSquare size={16} />}
          </button>
        </div>
        <div className="flex-1">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-40 text-neutral-500 gap-3"><Loader2 className="animate-spin text-blue-500" size={24} /><p className="text-xs">Coachar premissen...</p></div>
          ) : aiFeedback ? (
            <div className="text-neutral-300 text-xs leading-relaxed prose prose-invert prose-p:mb-3 prose-headings:text-blue-400 prose-headings:text-sm prose-li:mb-1">
              <ReactMarkdown>{aiFeedback}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center text-neutral-600 mt-10"><BotMessageSquare size={32} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Klicka för analys av punchlines, setup och luckor.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Workshop() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}>
      <WorkshopContent />
    </Suspense>
  );
}