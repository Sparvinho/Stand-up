"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { Mic, Calendar, Edit3, ArrowRight, Loader2, FileText, Zap, LayoutList, Sparkles, Lightbulb, Wand2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  
  const [recentBits, setRecentBits] = useState<any[]>([]);
  const [recentSetlists, setRecentSetlists] = useState<any[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");

  // Kreativa Motorn States
  const [creativePrompt, setCreativePrompt] = useState<string | null>(null);
  const [creativeMood, setCreativeMood] = useState<string>("");
  const [isGeneratingBit, setIsGeneratingBit] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    // Hämtar senaste skämten och ALLA taggar för mashups
    const { data: bitsData } = await supabase
      .from("bits")
      .select("id, title, format, status, tags, created_at")
      .order("created_at", { ascending: false });

    if (bitsData) {
      setRecentBits(bitsData.slice(0, 3)); // Visa bara topp 3 i listan
      
      // Samla in alla unika taggar användaren någonsin använt
      const allTags = new Set<string>();
      bitsData.forEach(bit => {
        if (bit.tags) bit.tags.forEach((tag: string) => allTags.add(tag));
      });
      setUserTags(Array.from(allTags));
    }

    const { data: setsData } = await supabase
      .from("setlists")
      .select("id, title, created_at, bit_ids")
      .order("created_at", { ascending: false })
      .limit(2);

    if (setsData) setRecentSetlists(setsData);

    setIsLoading(false);
  };

  // KREATIVA MOTORN - Generera en idé
  const generateIdea = () => {
    const moods = ["Trött", "Deppig", "Arrogant", "Spelat oskuldsfull", "Sarkastisk", "Upprörd", "Retstickig"];
    const topics = ["Självscanning på Ica", "Gruppchattar", "Att köpa gymkort", "Föräldramöten", "Folk som pratar i högtalartelefon på bussen", "Att montera IKEA-möbler", "Första dejten", "Skapa ett nytt lösenord", "Vakna innan väckarklockan", "Svensk sommar", "Kundtjänst", "Att gå på husvisning", "Mellandagsrea"];

    // 50% chans för Mashup (om du har minst 2 taggar), annars Persona-krock
    const useMashup = Math.random() > 0.5 && userTags.length >= 2;

    if (useMashup) {
      const tag1 = userTags[Math.floor(Math.random() * userTags.length)];
      let tag2 = userTags[Math.floor(Math.random() * userTags.length)];
      while(tag1 === tag2) { tag2 = userTags[Math.floor(Math.random() * userTags.length)]; } // Se till att de inte är samma
      
      setCreativePrompt(`Vad finns det för oväntad likhet eller konflikt mellan #${tag1} och #${tag2}?`);
      setCreativeMood(""); // Ingen specifik mood tvingad här
    } else {
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      setCreativePrompt(`Skriv en rutin om "${randomTopic}".\nDin persona/vinkel måste vara extremt ${randomMood.toUpperCase()}.`);
      setCreativeMood(randomMood);
    }
  };

  // Skapa skämt av prompten
  const createBitFromPrompt = async () => {
    if (!creativePrompt) return;
    setIsGeneratingBit(true);
    
    const title = creativeMood ? `Ny idé (${creativeMood})` : "Ny idé (Tag-Mashup)";
    
    const { data, error } = await supabase
      .from("bits")
      .insert([{ 
        title: title, 
        premise: `[SKRIVÖVNING]\n${creativePrompt}\n\n---\nSkriv din premiss här...`, 
        status: "Råidé", 
        format: "oneliner", 
        priority: 1,
        mood: creativeMood || null 
      }])
      .select()
      .single();

    if (!error && data) {
      router.push(`/workshop?id=${data.id}`);
    } else {
      setIsGeneratingBit(false);
      alert("Kunde inte skapa skämtet.");
    }
  };

  const startRecording = () => {
    setRecordingError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecordingError("Din webbläsare stödjer tyvärr inte röstigenkänning. Använd Chrome eller Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "sv-SE"; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onspeechend = () => recognition.stop();

    recognition.onresult = async (event: any) => {
      setIsRecording(false);
      const transcript = event.results[0][0].transcript;
      
      if (transcript) {
        const { data, error } = await supabase.from("bits").insert([{ title: "Röstanteckning", premise: transcript, status: "Råidé", format: "oneliner", priority: 1 }]).select().single();
        if (!error && data) router.push(`/workshop?id=${data.id}`);
      }
    };
    recognition.onerror = () => { setIsRecording(false); setRecordingError("Kunde inte höra vad du sa, eller så nekades mikrofonen."); };
    recognition.start();
  };

  if (isLoading) return <div className="min-h-screen bg-neutral-950 flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-10 pb-32">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Standup Studio</h1>
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-sm text-neutral-400">DK</div>
        </div>

        {/* HERO: RÖSTINSPELNING */}
        <button 
          onClick={startRecording}
          disabled={isRecording}
          className={`w-full relative overflow-hidden rounded-3xl p-10 mb-8 transition-all flex flex-col items-center justify-center min-h-[160px] border ${isRecording ? 'bg-red-600/20 border-red-500/50 scale-[0.98]' : 'bg-blue-600 hover:bg-blue-500 border-blue-500 hover:scale-[1.01] shadow-2xl shadow-blue-900/20'}`}
        >
          {isRecording ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center opacity-20"><div className="w-32 h-32 bg-red-500 rounded-full animate-ping"></div></div>
              <Mic size={40} className="text-red-500 mb-3 animate-pulse relative z-10" />
              <h2 className="text-xl font-bold text-white mb-1 relative z-10">Lyssnar...</h2>
              <p className="text-red-200 text-xs relative z-10">Prata nu. Inspelningen stannar när du pausar.</p>
            </>
          ) : (
            <>
              <Mic size={40} className="text-white mb-3 relative z-10" />
              <h2 className="text-xl font-bold text-white mb-1 relative z-10">Spela in ny idé</h2>
              <p className="text-blue-200 text-xs relative z-10">Transkriberas och sparas automatiskt i din Workshop</p>
            </>
          )}
        </button>
        {recordingError && <p className="text-red-400 text-center text-sm mt-2 mb-6">{recordingError}</p>}

        {/* --- KREATIVA MOTORN --- */}
        <div className="w-full bg-gradient-to-br from-purple-900/40 to-neutral-900 border border-purple-800/50 rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Lightbulb size={140} /></div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2 mb-2"><Sparkles size={20} /> Skrivkramp-krossaren</h2>
            <p className="text-neutral-400 text-sm mb-6 max-w-xl">Hjärnsläpp? Klicka på knappen nedan för att få en skrivövning. Appen krockar slumpmässiga ämnen med dina sinnesstämningar eller dina befintliga taggar för att tvinga hjärnan i nya banor.</p>
            
            {creativePrompt ? (
              <div className="bg-neutral-950/80 border border-purple-500/30 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-lg md:text-xl font-medium text-purple-100 whitespace-pre-wrap leading-relaxed">{creativePrompt}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={generateIdea} 
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Wand2 size={18} /> {creativePrompt ? "Ge mig en annan vinkel" : "Ge mig en utmaning!"}
              </button>
              
              {creativePrompt && (
                <button 
                  onClick={createBitFromPrompt}
                  disabled={isGeneratingBit}
                  className="bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  {isGeneratingBit ? <Loader2 size={18} className="animate-spin" /> : <Edit3 size={18} />}
                  Skapa skämt av detta
                </button>
              )}
            </div>
          </div>
        </div>

        {/* WIDGETS (Setlists & Senaste idéer) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2"><LayoutList size={16} className="text-blue-500" /> Aktuella Setlists</h3>
              <button onClick={() => router.push('/setlists')} className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">Visa alla</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {recentSetlists.length === 0 ? (
                <p className="text-sm text-neutral-600 italic">Inga setlists skapade än.</p>
              ) : (
                recentSetlists.map(set => (
                  <div key={set.id} onClick={() => router.push('/setlists')} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl cursor-pointer hover:border-neutral-600 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{set.title}</h4>
                      <span className="text-[10px] font-bold bg-neutral-900 text-neutral-400 px-2 py-1 rounded border border-neutral-800">{set.bit_ids?.length || 0} skämt</span>
                    </div>
                    <p className="text-xs text-neutral-500 flex items-center gap-1"><Calendar size={12} /> {new Date(set.created_at).toLocaleDateString("sv-SE")}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2"><Edit3 size={16} className="text-purple-500" /> Senaste idéer i Workshop</h3>
              <button onClick={() => router.push('/vault')} className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">Visa bibliotek</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {recentBits.length === 0 ? (
                <p className="text-sm text-neutral-600 italic">Ditt bibliotek är tomt.</p>
              ) : (
                recentBits.map(bit => (
                  <div key={bit.id} onClick={() => router.push(`/workshop?id=${bit.id}`)} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl cursor-pointer hover:border-neutral-600 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      {bit.format === 'oneliner' ? <Zap size={16} className="text-yellow-500"/> : <FileText size={16} className="text-blue-500"/>}
                      <h4 className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">{bit.title || "Namnlös idé"}</h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">{bit.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}