
import React, { useState, useEffect, useRef } from 'react';
import { generateArtPrompt, generateVideoPreview } from './services/geminiService';
import { TEXTS, INSTAGRAM_LINK, DEFAULT_STYLES } from './constants';
import { Language, PromptResponse, Complexity, Preset, GalleryItem } from './types';
import LanguageSelector from './components/LanguageSelector';
import ZoomableImage from './components/ZoomableImage';
import Logo from './components/Logo';
import PremiumModal from './components/PremiumModal';
import PresetSelector from './components/PresetSelector';
import Gallery from './components/Gallery';
import { Loader2, Upload, Image as ImageIcon, Copy, Check, ExternalLink, RefreshCw, Languages, Crown, Sparkles, SlidersHorizontal, Twitter, Share2, Instagram, Sun, Moon, Video, PlayCircle, Palette, Zap, Download } from 'lucide-react';

// Custom Icons for Pinterest and Reddit as they might not be standard in all icon sets
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 14.5c2.5 3.333 4.713 3.333 8 0" />
    <path d="M12 22v-8.3" />
    <path d="M8 8.5C5.5 10 3 12 3 15c0 2 2 3.5 4 3.5s3.5-1.5 3.5-3.5c0-2-2.5-3.5-2.5-3.5" />
    <path d="M16 8.5c2.5 1.5 5 3.5 5 6.5 0 2-2 3.5-4 3.5s-3.5-1.5-3.5-3.5c0-2 2.5-3.5 2.5-3.5" />
    <circle cx="12" cy="6" r="3" />
  </svg>
);

const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M17 13c0 2-2.5 3.5-5 3.5S7 15 7 13" />
    <path d="M12 8a2.5 2.5 0 0 0-5 0" />
    <path d="M17 8a2.5 2.5 0 0 0-5 0" />
  </svg>
);

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [promptResult, setPromptResult] = useState<PromptResponse | null>(null);
  
  // Tab state can now be 'english', 'translated', 'custom', or an index 'var-0', 'var-1', etc.
  const [activeTab, setActiveTab] = useState<string>('english');
  
  // Complexity state
  const [complexity, setComplexity] = useState<Complexity>('standard');
  const [customStyle, setCustomStyle] = useState('');
  
  // Saved custom styles for suggestions
  const [savedStyles, setSavedStyles] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Video Generation State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const texts = TEXTS[language];

  // Initialize Theme from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Default to dark mode
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load saved styles from presets for autocomplete
  const loadSavedStyles = () => {
    const saved = localStorage.getItem('prompt_extractor_presets');
    if (saved) {
      try {
        const presets = JSON.parse(saved) as Preset[];
        const styles = Array.from(new Set(presets.map(p => p.customStyle).filter(s => s && s.trim().length > 0))) as string[];
        setSavedStyles(styles);
      } catch (e) {
        console.error("Failed to load styles", e);
      }
    }
  };

  useEffect(() => {
    loadSavedStyles();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Update document direction based on language
  useEffect(() => {
    document.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const processFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
       setError("Invalid file type. Please upload JPG, PNG, or WEBP.");
       return;
    }

    setSelectedFile(file);
    setPromptResult(null);
    setError(null);
    setVideoUrl(null);
    setVideoError(null);
    setActiveTab('english');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setLanguage(preset.language);
    setComplexity(preset.complexity);
    setCustomStyle(preset.customStyle || '');
  };

  const handleGallerySelect = (item: GalleryItem) => {
    setSelectedFile(null); // Clear actual file since it's a URL
    setPreviewUrl(item.src);
    setPromptResult(item.promptResponse);
    setActiveTab('english');
    setError(null);
    setVideoUrl(null);
    setVideoError(null);
    // Scroll to top to see result if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);
    setActiveTab('english');

    try {
      const result = await generateArtPrompt(selectedFile, language, isPremium, complexity, customStyle.trim());
      setPromptResult(result);
    } catch (err: any) {
      if (err.message === "QUOTA_EXCEEDED") {
        setError(texts.errorQuota);
      } else if (err.message === "RATE_LIMITED") {
        setError(texts.errorRateLimit);
      } else {
        setError(texts.errorGeneric);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleGenerate();
    }
  };

  // Video Generation Handler
  const handleGenerateVideo = async () => {
    if (!promptResult) return;

    // Check for API key selection (required for Veo)
    try {
      // @ts-ignore - window.aistudio is injected
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume successful selection and proceed, or user can click again
      }
    } catch (e) {
      console.warn("API Key check skipped or failed, proceeding...", e);
    }

    setIsVideoLoading(true);
    setVideoError(null);

    try {
      // Determine source image blob
      let imageBlob: Blob;
      
      if (selectedFile) {
        imageBlob = selectedFile;
      } else if (previewUrl) {
        // Fetch blob from URL (gallery case)
        const res = await fetch(previewUrl);
        imageBlob = await res.blob();
      } else {
        throw new Error("No source image available");
      }

      const promptToUse = promptResult.english; // Use the English prompt for best results with Veo
      const videoSrc = await generateVideoPreview(promptToUse, imageBlob);
      setVideoUrl(videoSrc);
    } catch (err: any) {
      console.error(err);
      setVideoError(texts.videoError);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!previewUrl) return;

    try {
      // If previewUrl is a data URL, we can use it directly, but for Gallery URLs we fetch as blob
      // to ensure consistent behavior and avoid CORS issues with the download attribute on some browsers.
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Default filename with timestamp
      link.download = `visioncraft-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      // Fallback: try direct link download
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `visioncraft-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopy = () => {
    let textToCopy = '';
    
    if (activeTab === 'english') {
      textToCopy = promptResult?.english || '';
    } else if (activeTab === 'translated') {
      textToCopy = promptResult?.translated || '';
    } else if (activeTab === 'custom') {
      textToCopy = promptResult?.customVariation?.prompt || '';
    } else if (activeTab.startsWith('var-')) {
      const index = parseInt(activeTab.split('-')[1]);
      textToCopy = promptResult?.variations?.[index]?.prompt || '';
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Determine what to display in the text area
  let currentDisplayText = '';
  if (promptResult) {
    if (activeTab === 'english') {
      currentDisplayText = promptResult.english;
    } else if (activeTab === 'translated') {
      currentDisplayText = promptResult.translated || '';
    } else if (activeTab === 'custom') {
      currentDisplayText = promptResult.customVariation?.prompt || '';
    } else if (activeTab.startsWith('var-')) {
      const index = parseInt(activeTab.split('-')[1]);
      currentDisplayText = promptResult.variations?.[index]?.prompt || '';
    }
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(currentDisplayText.substring(0, 200) + '...');
    window.open(`https://twitter.com/intent/tweet?text=${text}&hashtags=AIArt,Prompt,Gemini`, '_blank');
  };

  const handleShareInstagram = () => {
    // Copy text first
    navigator.clipboard.writeText(currentDisplayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Open Instagram in new tab
    window.open('https://www.instagram.com', '_blank');
  };

  const handleSharePinterest = () => {
    const description = encodeURIComponent(currentDisplayText);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${description}`, '_blank');
  };

  const handleShareReddit = () => {
    const title = encodeURIComponent(texts.resultTitle);
    const text = encodeURIComponent(currentDisplayText);
    window.open(`https://www.reddit.com/submit?title=${title}&text=${text}`, '_blank');
  };

  const handleShareSystem = async () => {
    if (!navigator.share) return;
    
    try {
      const shareData: ShareData = {
        title: texts.title,
        text: currentDisplayText,
      };

      if (selectedFile && navigator.canShare && navigator.canShare({ files: [selectedFile] })) {
        shareData.files = [selectedFile];
      }

      await navigator.share(shareData);
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPromptResult(null);
    setError(null);
    setVideoUrl(null);
    setActiveTab('english');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isRTL = language === 'ar';
  const canSystemShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isRTL ? 'font-arabic' : ''} bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-fuchsia-50 transition-colors duration-300`}>
      
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => setIsPremium(true)}
        texts={texts}
      />

      {/* Header */}
      <header className={`w-full backdrop-blur-md border-b sticky top-0 z-10 transition-colors duration-500 ${isPremium ? 'bg-white/80 dark:bg-black/60 border-yellow-500/30' : 'bg-white/80 dark:bg-dark-900/50 border-gray-200 dark:border-dark-700'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <div className="hover:scale-110 transition-transform duration-300">
              <Logo className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 dark:from-white dark:to-gray-400 text-center sm:text-left">
                {texts.title}
              </h1>
              {isPremium && (
                 <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 tracking-wider flex items-center gap-1">
                   <Crown className="w-3 h-3" /> {texts.premiumActive}
                 </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800 transition-colors"
              title={theme === 'light' ? texts.themeDark : texts.themeLight}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <LanguageSelector currentLang={language} onChange={setLanguage} />
            
            {!isPremium && (
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-400 dark:from-yellow-600 dark:to-yellow-500 text-black px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-bold text-xs sm:text-sm hover:scale-105 transition-transform shadow-lg shadow-yellow-500/20"
              >
                <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">{texts.goPremium}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-4 sm:pt-8 pb-8 sm:pb-12 px-3 sm:px-4 max-w-4xl mx-auto w-full">
        
        {/* Intro Text */}
        <div className="text-center mb-6 sm:mb-10 max-w-2xl">
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            {texts.subtitle}
          </p>
        </div>

        {/* Upload Section (Visible if no result yet) */}
        {!promptResult && (
          <div className="w-full max-w-2xl animate-fade-in flex flex-col items-center">
            <div 
              className={`
                relative group border-2 border-dashed rounded-2xl w-full
                p-6 sm:p-10
                flex flex-col items-center justify-center text-center cursor-pointer
                transition-all duration-300
                ${previewUrl 
                  ? 'border-primary-500/50 bg-white dark:bg-dark-800/50' 
                  : isDragging 
                    ? 'border-primary-500 bg-blue-50 dark:bg-dark-800' 
                    : 'border-gray-300 dark:border-dark-700 bg-white dark:bg-transparent hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-dark-800'
                }
                ${isPremium && !previewUrl && !isDragging ? 'border-yellow-500/30 hover:border-yellow-500/60' : ''}
              `}
              onClick={() => !isLoading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
              />
              
              {previewUrl ? (
                <div className="relative w-full">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-64 sm:max-h-96 mx-auto rounded-lg shadow-2xl object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <p className="text-white font-medium">{texts.uploadTitle}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'} ${isPremium ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-500' : 'bg-gray-100 dark:bg-dark-700 text-primary-600 dark:text-primary-500'}`}>
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">{texts.uploadTitle}</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">{texts.uploadDesc}</p>
                </>
              )}
            </div>

            {/* Controls before generation */}
            <div className="mt-8 flex flex-col items-center gap-6 w-full">
              
              {/* Generation Settings Panel */}
              {(selectedFile || previewUrl) && !isLoading && (
                <div className="w-full max-w-md animate-fade-in bg-white dark:bg-dark-900/40 p-5 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-sm">
                  
                  {/* Panel Header */}
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-dark-700/50 pb-2">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                       <Zap className="w-4 h-4 text-yellow-500" />
                       Generation Settings
                    </h3>
                    
                    {/* Preset Selector */}
                    <PresetSelector 
                      currentLanguage={language} 
                      currentComplexity={complexity} 
                      currentCustomStyle={customStyle}
                      onSelect={handlePresetSelect} 
                      onPresetsChange={loadSavedStyles}
                      texts={texts} 
                    />
                  </div>

                  <div className="space-y-4">
                    {/* Complexity Controls */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>{texts.complexityLabel}</span>
                      </div>
                      <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-lg border border-gray-200 dark:border-dark-700 w-full overflow-hidden">
                        {(['concise', 'standard', 'detailed'] as Complexity[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => setComplexity(level)}
                            className={`
                              flex-1 px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
                              ${complexity === level 
                                ? (isPremium ? 'bg-yellow-500 dark:bg-yellow-600/90 text-white shadow' : 'bg-white dark:bg-primary-600 text-gray-900 dark:text-white shadow') 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-700'}
                            `}
                          >
                            {level === 'concise' && texts.complexShort}
                            {level === 'standard' && texts.complexNormal}
                            {level === 'detailed' && texts.complexLong}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Style Input */}
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                         <Palette className="w-3 h-3" />
                         {texts.customStyleLabel}
                       </label>
                       <div className="relative">
                         <input 
                           type="text"
                           value={customStyle}
                           onChange={(e) => setCustomStyle(e.target.value)}
                           onKeyDown={handleKeyDown}
                           placeholder={texts.customStylePlaceholder}
                           list="saved-styles"
                           className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500 transition-all shadow-sm"
                         />
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                           <Sparkles className="w-3.5 h-3.5" />
                         </div>
                         <datalist id="saved-styles">
                           {Array.from(new Set([...DEFAULT_STYLES, ...savedStyles])).sort().map(style => (
                             <option key={style} value={style} />
                           ))}
                         </datalist>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button (only if file selected, hidden if using gallery mode without file) */}
              {selectedFile && (
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={`
                    flex items-center justify-center gap-3 px-6 py-3 sm:px-8 sm:py-4 rounded-full text-lg font-bold shadow-lg 
                    transition-all duration-300 transform w-full sm:w-auto
                    ${isPremium 
                      ? 'bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500 dark:from-yellow-600 dark:via-orange-500 dark:to-yellow-600 text-white hover:scale-105 shadow-yellow-500/20'
                      : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:scale-105 shadow-primary-500/40'}
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      {texts.analyzing}
                    </>
                  ) : (
                    <>
                      <span>{texts.analyzeBtn}</span>
                      <ImageIcon className="w-5 h-5" />
                      {isPremium && <Sparkles className="w-4 h-4 text-yellow-100 dark:text-yellow-200" />}
                    </>
                  )}
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg text-center text-sm sm:text-base animate-pulse">
                {error}
              </div>
            )}
            
            {/* Gallery Section */}
            {!selectedFile && (
              <Gallery onSelect={handleGallerySelect} texts={texts} />
            )}
          </div>
        )}

        {/* Result Section */}
        {promptResult && (
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 sm:gap-8 animate-fade-in-up">
            
            {/* Left: Image & Video */}
            <div className="flex flex-col gap-4">
               <div className={`bg-white dark:bg-dark-800 p-2 rounded-xl border shadow-xl ${isPremium ? 'border-yellow-500/30' : 'border-gray-200 dark:border-dark-700'}`}>
                 <ZoomableImage 
                   src={previewUrl || ''} 
                   alt="Analyzed" 
                   className="w-full h-auto"
                 />
               </div>
               
               {/* Video Result */}
               {videoUrl && (
                 <div className="bg-black rounded-xl overflow-hidden shadow-xl border border-gray-800 relative">
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10 flex items-center gap-1">
                      <Video className="w-3 h-3" /> {texts.videoTitle}
                    </div>
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-auto"
                    />
                 </div>
               )}

               {/* Video Loading/Error */}
               {isVideoLoading && (
                 <div className="bg-gray-100 dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-dark-700 flex flex-col items-center justify-center text-center gap-3">
                   <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                   <p className="text-sm text-gray-600 dark:text-gray-300">{texts.generatingVideo}</p>
                 </div>
               )}
               {videoError && (
                 <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                   {videoError}
                 </div>
               )}

               <div className="flex flex-col sm:flex-row gap-2">
                 <button 
                  onClick={handleDownloadImage}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors text-sm sm:text-base font-medium shadow-sm"
                 >
                   <Download className="w-4 h-4" />
                   {texts.saveImageBtn}
                 </button>
                 <button 
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm sm:text-base"
                 >
                   <RefreshCw className="w-4 h-4" />
                   {texts.resetBtn}
                 </button>
               </div>
            </div>

            {/* Right: Prompt */}
            <div className={`bg-white dark:bg-dark-800 rounded-xl border shadow-xl flex flex-col overflow-hidden ${isPremium ? 'border-yellow-500/30 shadow-yellow-500/5' : 'border-gray-200 dark:border-dark-700'}`}>
              <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50 flex flex-col gap-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h3 className={`font-semibold flex items-center gap-2 text-sm sm:text-base ${isPremium ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary-600 dark:text-primary-400'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isPremium ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    {texts.resultTitle}
                  </h3>
                  
                  {/* Action Buttons: Copy, Twitter, Instagram, Pinterest, Reddit, Share */}
                  <div className="flex items-center gap-1">
                    {/* Twitter Share */}
                    <button
                      onClick={handleShareTwitter}
                      title={texts.shareTwitter}
                      className="p-1.5 sm:p-2 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                    </button>

                    {/* Instagram Share */}
                    <button
                      onClick={handleShareInstagram}
                      title={texts.shareInstagram}
                      className="p-1.5 sm:p-2 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-500/20 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                    </button>

                    {/* Pinterest Share */}
                    <button
                      onClick={handleSharePinterest}
                      title={texts.sharePinterest}
                      className="p-1.5 sm:p-2 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <PinterestIcon className="w-4 h-4" />
                    </button>

                    {/* Reddit Share */}
                    <button
                      onClick={handleShareReddit}
                      title={texts.shareReddit}
                      className="p-1.5 sm:p-2 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    >
                      <RedditIcon className="w-4 h-4" />
                    </button>
                    
                    {/* System Share (Mobile) */}
                    {canSystemShare && (
                      <button
                        onClick={handleShareSystem}
                        title={texts.shareSystem}
                        className="p-1.5 sm:p-2 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all ml-1
                        ${copied 
                          ? 'bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-400' 
                          : isPremium 
                             ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-500/20' 
                             : 'bg-primary-50 dark:bg-primary-600/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-600/20'}
                      `}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? texts.copied : texts.copyBtn}
                    </button>
                  </div>
                </div>
                
                {/* Standard Tabs */}
                <div className="flex flex-wrap gap-2">
                   <div className="flex p-1 bg-gray-200 dark:bg-dark-900 rounded-lg flex-grow flex-wrap">
                     <button
                       onClick={() => setActiveTab('english')}
                       className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                         activeTab === 'english' 
                           ? (isPremium ? 'bg-yellow-500 dark:bg-yellow-600/90 text-white' : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow-sm') 
                           : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                       }`}
                     >
                       <Languages className="w-3 h-3" />
                       {texts.tabEnglish}
                     </button>
                     {promptResult.translated && (
                       <button
                         onClick={() => setActiveTab('translated')}
                         className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                           activeTab === 'translated' 
                             ? (isPremium ? 'bg-yellow-500 dark:bg-yellow-600/90 text-white' : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow-sm') 
                             : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                         }`}
                       >
                         <Languages className="w-3 h-3" />
                         {texts.tabTranslated}
                       </button>
                     )}
                     {promptResult.customVariation && (
                       <button
                         onClick={() => setActiveTab('custom')}
                         className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                           activeTab === 'custom' 
                             ? (isPremium ? 'bg-yellow-500 dark:bg-yellow-600/90 text-white' : 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow-sm') 
                             : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                         }`}
                       >
                         <Palette className="w-3 h-3" />
                         {texts.tabCustom}
                       </button>
                     )}
                   </div>
                </div>

                {/* Premium Variations Tabs */}
                {isPremium && promptResult.variations && promptResult.variations.length > 0 && (
                   <div className="mt-1 sm:mt-2">
                      <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-500/70 mb-1 sm:mb-2 font-bold uppercase tracking-wider">{texts.variationsTitle}</p>
                      <div className="flex flex-wrap gap-2">
                        {promptResult.variations.map((v, idx) => (
                           <button
                              key={idx}
                              onClick={() => setActiveTab(`var-${idx}`)}
                              className={`
                                flex-1 text-xs px-2 py-1.5 rounded border transition-all whitespace-nowrap
                                ${activeTab === `var-${idx}` 
                                  ? 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-200' 
                                  : 'bg-transparent border-gray-300 dark:border-dark-600 text-gray-500 dark:text-gray-400 hover:border-yellow-500/50 hover:text-yellow-600 dark:hover:text-yellow-100'}
                              `}
                           >
                             {v.style}
                           </button>
                        ))}
                      </div>
                   </div>
                )}
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[500px]">
                <p 
                  className={`leading-relaxed whitespace-pre-wrap font-mono text-sm md:text-base ${
                    activeTab === 'translated' && isRTL ? 'font-arabic' : ''
                  } ${isPremium ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  {currentDisplayText}
                </p>
              </div>

              {/* Action Footer: Generate Video Button */}
              {!videoUrl && !isVideoLoading && (
                <div className="p-3 bg-gray-50 dark:bg-dark-900/50 border-t border-gray-100 dark:border-dark-700 flex justify-end">
                   <button
                     onClick={handleGenerateVideo}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full shadow hover:shadow-lg transition-all"
                   >
                     <PlayCircle className="w-4 h-4" />
                     {texts.generateVideoBtn}
                   </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 mt-auto">
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          <span>{texts.footerText}</span>
          <a 
            href={INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
          >
            {texts.footerLinkText}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
