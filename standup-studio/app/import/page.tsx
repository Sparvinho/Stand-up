"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, FileText, Database, Loader2, CheckCircle, FileSpreadsheet, AlertTriangle } from "lucide-react";

export default function ImportPage() {
  const router = useRouter();
  const [importMode, setImportMode] = useState<'text' | 'csv'>('text');
  
  const [rawText, setRawText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number, failed: number } | null>(null);

  // Kalkylblad (CSV) states
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // LOGIK 1: Klipp & Klistra (Google Docs)
  const handleTextImport = async () => {
    if (!rawText.trim()) return;
    setIsImporting(true);
    setImportResult(null);

    // Delar upp texten vid varje dubbel radbrytning (tom rad)
    const blocks = rawText.split(/\n\s*\n/).filter(text => text.trim().length > 0);
    
    let successCount = 0;
    let failedCount = 0;

    for (const block of blocks) {
      // Om blocket är kort, gissar vi att det är en oneliner. Annars en rutin.
      const format = block.length < 150 ? "oneliner" : "rutin";
      
      const { error } = await supabase.from("bits").insert([{
        title: "Importerad idé",
        premise: block.trim(),
        status: "Råidé",
        format: format,
        priority: 1
      }]);

      if (error) failedCount++;
      else successCount++;
    }

    setImportResult({ success: successCount, failed: failedCount });
    setIsImporting(false);
    setRawText("");
  };

  // LOGIK 2: Ladda upp Kalkylblad (CSV)
  const handleCsvImport = async () => {
    if (!csvFile) return;
    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // Känner av om det är kommatecken eller semikolon (vanligt i svenska Excel)
      const separator = text.includes(';') ? ';' : ',';
      const rows = text.split('\n').filter(row => row.trim().length > 0);
      
      let successCount = 0;
      let failedCount = 0;

      // Loopa igenom varje rad (vi hoppar över första raden om det är en rubrikrad)
      for (let i = 1; i < rows.length; i++) {
        // En enkel split (kan behöva avancerad regex om man har kommatecken inuti sina skämt)
        const cols = rows[i].split(separator);
        
        // Vi antar kolumn 1 = Titel (frivillig), Kolumn 2 = Premiss
        const title = cols[0]?.trim() || "Importerad idé";
        const premise = cols[1]?.trim() || cols[0]?.trim(); // Fallback om bara en kolumn finns
        
        if (!premise) continue;

        const { error } = await supabase.from("bits").insert([{
          title: title,
          premise: premise,
          status: "Råidé",
          format: premise.length < 150 ? "oneliner" : "rutin",
          priority: 1
        }]);

        if (error) failedCount++;
        else successCount++;
      }

      setImportResult({ success: successCount, failed: failedCount });
      setIsImporting(false);
      setCsvFile(null);
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-10 pb-32">
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-6 border-b border-neutral-900/50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Tillbaka
        </button>
        <h1 className="text-2xl font-black flex items-center gap-3">
          <Database className="text-blue-500" size={28} /> Massimport
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 md:p-10">
          
          <div className="flex gap-4 mb-8 bg-neutral-950 p-2 rounded-xl border border-neutral-800 w-fit">
            <button 
              onClick={() => {setImportMode('text'); setImportResult(null);}} 
              className={`px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${importMode === 'text' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <FileText size={18} /> Från Google Docs (Text)
            </button>
            <button 
              onClick={() => {setImportMode('csv'); setImportResult(null);}} 
              className={`px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${importMode === 'csv' ? 'bg-green-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <FileSpreadsheet size={18} /> Från Google Sheets (.csv)
            </button>
          </div>

          {importResult && (
            <div className="mb-8 bg-green-950/30 border border-green-900/50 rounded-xl p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
              <CheckCircle size={48} className="text-green-500 mb-4" />
              <h3 className="text-2xl font-black text-white mb-2">Import slutförd!</h3>
              <p className="text-green-400 font-medium">{importResult.success} skämt har sparats i ditt bibliotek.</p>
              {importResult.failed > 0 && <p className="text-red-400 text-sm mt-2">{importResult.failed} skämt misslyckades.</p>}
              <button onClick={() => router.push('/vault')} className="mt-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all">Gå till Biblioteket</button>
            </div>
          )}

          {!importResult && importMode === 'text' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold text-white mb-2">Klipp ut och klistra in</h2>
              <p className="text-neutral-400 text-sm mb-6">Har du en lång lista i Anteckningar eller Google Docs? Klistra in den här. Appen skapar automatiskt ett nytt skämt av varje stycke (avdelat med en tom rad).</p>
              
              <textarea 
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Skämt 1 premiss...\n\nSkämt 2 premiss...\n\nSkämt 3 premiss..."
                className="w-full h-80 bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-neutral-200 outline-none focus:border-blue-500 resize-none leading-relaxed mb-6 font-mono text-sm"
              />
              
              <button 
                onClick={handleTextImport}
                disabled={isImporting || !rawText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isImporting ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                {isImporting ? "Tuggar igenom texten..." : "Importera till Biblioteket"}
              </button>
            </div>
          )}

          {!importResult && importMode === 'csv' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold text-white mb-2">Ladda upp kalkylblad</h2>
              <p className="text-neutral-400 text-sm mb-4">I Google Sheets, välj <strong className="text-neutral-200">Arkiv {'>'} Ladda ned {'>'} Kommaseparerade värden (.csv)</strong> och ladda upp filen här.</p>
              
              <div className="bg-orange-950/20 border border-orange-900/30 p-4 rounded-lg mb-6 flex gap-3 text-sm text-orange-200/80">
                <AlertTriangle size={20} className="text-orange-500 shrink-0" />
                <p>Se till att <strong>Kolumn A</strong> är skämtets Titel, och <strong>Kolumn B</strong> är skämtets Premiss (text). Rad 1 ignoreras (rubrikrad).</p>
              </div>

              <div className="border-2 border-dashed border-neutral-700 hover:border-green-500 bg-neutral-950 rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors mb-6 relative">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Database size={48} className={csvFile ? "text-green-500 mb-4" : "text-neutral-600 mb-4"} />
                <h3 className="text-lg font-bold text-white mb-1">{csvFile ? csvFile.name : "Klicka för att välja din .csv fil"}</h3>
                <p className="text-neutral-500 text-sm">Dra och släpp fungerar också.</p>
              </div>

              <button 
                onClick={handleCsvImport}
                disabled={isImporting || !csvFile}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isImporting ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                {isImporting ? "Importera kalkylblad..." : "Importera till Biblioteket"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}