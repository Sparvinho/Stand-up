"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { PenTool, Save, Check, Loader2, Mic, Eraser, Square } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Write() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Röstinspelning
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'sv-SE';
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              currentTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (currentTranscript) {
            setPremise((prev) => prev + currentTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error !== 'aborted') {
            console.error("Röst-fel:", event.error);
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          // Förhindra krasch om den redan lyssnar
        }
      } else {
        alert("Din webbläsare stödjer tyvärr inte röstigenkänning.");
      }
    }
  };

  const handleClear = () => {
    if (window.confirm("Är du säker på att du vill rensa all text?")) {
      setTitle("");
      setPremise("");
    }
  };

  const handleSave = async () => {
    if (!premise.trim()) return;
    setIsSaving(true);
    let finalTitle = title.trim();
    if (!finalTitle) {
      finalTitle = premise.trim().split(" ").slice(0, 3).join(" ") + "...";
    }

    const { error } = await supabase
      .from("bits")
      .insert([
        {
          title: finalTitle,
          premise: premise.trim(),
          status: "Råidé",
          tags: [],
          comedy_tags: []
        }
      ])
      .select()
      .single();

    setIsSaving(false);
    
    if (!error) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setTitle("");
        setPremise("");
      }, 1500);
    } else {
      alert("Kunde inte spara: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col relative pb-24 md:pb-0">
      {/* TOPP-MENY */}
      <div className="p-4 md:p-10 flex items-center justify-between border-b border-neutral-900/50 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
          <PenTool className="text-blue-500" size={28} /> Skriv
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving || !premise.trim()}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg ${
            saved 
              ? "bg-green-600 text-white" 
              : !premise.trim() 
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
          <span className="hidden sm:inline">{saved ? "Sparad i Biblioteket!" : "Spara idé"}</span>
          <span className="sm:hidden">{saved ? "Sparad" : "Spara"}</span>
        </button>
      </div>

      {/* SKRIV-YTA */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-10 gap-4 mt-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Namnge idén (frivilligt)..."
          className="bg-transparent text-3xl md:text-4xl font-black outline-none text-white placeholder-neutral-700 w-full px-2"
        />

        {/* Verktygsrad */}
        <div className="flex items-center gap-3 px-2 py-2">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm border ${
              isListening
                ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse"
                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600"
            }`}
          >
            {isListening ? <Square size={16} className="fill-red-500" /> : <Mic size={16} />} 
            {isListening ? "Stoppa" : "Diktera"}
          </button>

          {/* Rensa-knappen visas bara om det finns text att rensa */}
          {(title.trim() !== "" || premise.trim() !== "") && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all text-sm border bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30"
            >
              <Eraser size={16} /> Rensa text
            </button>
          )}
        </div>

        <textarea
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          placeholder="Vad är det roliga? Skriv, diktera eller använd telefonens skanner för anteckningar..."
          className="flex-1 w-full bg-transparent p-2 text-xl md:text-2xl text-neutral-200 placeholder-neutral-700 outline-none resize-none leading-relaxed"
          autoFocus
        />
      </div>
    </div>
  );
}