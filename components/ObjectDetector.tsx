import React, { useState, useRef, useEffect } from 'react';
import { Upload, Scan, Loader2, AlertCircle, Maximize2, Camera, CameraOff, Video, StopCircle, Volume2, VolumeX, Mic, MicOff, Eye, EyeOff } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionObject } from '../types';

export const ObjectDetector: React.FC = () => {
  const [mode, setMode] = useState<'image' | 'webcam'>('image');
  const [image, setImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [liveDetection, setLiveDetection] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Default to true for this mode
  const [blindMode, setBlindMode] = useState(true);
  const [latestAlert, setLatestAlert] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectionObject[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const liveDetectionRef = useRef(false);
  const voiceEnabledRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // Sync state to ref for the polling loop
  useEffect(() => {
    liveDetectionRef.current = liveDetection;
    if (liveDetection) {
      runContinuousDetection();
    }
  }, [liveDetection]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (!voiceEnabled && "speechSynthesis" in window) {
       window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (voiceEnabled) {
        console.warn("Speech recognition is not supported in this browser. Voice commands disabled.");
        // We do not set the main app error to prevent blocking the UI.
      }
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase();
        
        if (transcript.includes('blind mode on') || transcript.includes('start blind mode') || transcript.includes('enable blind mode')) {
          setBlindMode(true);
          setLatestAlert(null);
          if (voiceEnabledRef.current && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance("Blind mode activated"));
          }
        } else if (transcript.includes('blind mode off') || transcript.includes('stop blind mode') || transcript.includes('disable blind mode')) {
          setBlindMode(false);
          setLatestAlert(null);
          if (voiceEnabledRef.current && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance("Blind mode deactivated"));
          }
        }
      };

      recognition.onend = () => {
        if (voiceEnabledRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch(e) {}
        }
      };

      recognitionRef.current = recognition;
    }

    if (voiceEnabled && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch(e) {}
    } else if (!voiceEnabled && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    return () => {
      // Cleanup
      if (recognitionRef.current && !voiceEnabledRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
    };
  }, [voiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image size too large. Please use an image under 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        stopWebcam();
        setMode('image');
        setImage(reader.result as string);
        setDetections([]);
        setLatestAlert(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setMode('webcam');
      setImage(null);
      setDetections([]);
      setLatestAlert(null);
    } catch (err: any) {
      setError("Failed to access webcam. Please ensure you have granted camera permissions in your browser.");
      console.error(err);
    }
  };

  // Attach stream to video element when it becomes available in the DOM
  useEffect(() => {
    if (mode === 'webcam' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Webcam play error:", e));
    }
  }, [mode, stream]);

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setLiveDetection(false);
    if (mode === 'webcam') setMode('image');
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ensure video has loaded metadata before capturing
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  const speakAlert = (text: string) => {
      if (!("speechSynthesis" in window) || !voiceEnabledRef.current || !text) return;
          
      window.speechSynthesis.cancel(); // Stop current speech to prioritize newest frame
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
  };

  const speakDetections = (dets: DetectionObject[]) => {
      if (!("speechSynthesis" in window) || !voiceEnabledRef.current || dets.length === 0) return;
      
      const sorted = [...dets].sort((a, b) => b.confidence - a.confidence);
      // Limit to top 2 to not overwhelm the user with speech
      const labels = sorted.slice(0, 2).map(d => d.label);
      
      const text = labels.length > 1 
          ? `I see ${labels.join(" and ")}`
          : `I see a ${labels[0]}`;
          
      window.speechSynthesis.cancel(); // Stop current speech to prioritize newest frame
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
  };

  const detectObjects = async () => {
    if (mode === 'image' && !image) return;
    if (mode === 'webcam' && !stream) return;

    const env = import.meta.env;
    const apiKey = env.VITE_GEMINI_API_KEY || (env as any).GEMINI_API_KEY || 'PLACEHOLDER_API_KEY';

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        setError("API Key is missing or invalid. Please set VITE_GEMINI_API_KEY in your Netlify environment variables, or ensure the AI Studio environment has a valid key.");
        setLiveDetection(false);
        return;
    }

    setLoading(true);
    setError(null);

    let base64Data = "";
    if (mode === 'webcam') {
        const frame = captureFrame();
        if (!frame) {
            console.warn("Video frame not ready yet, skipping this cycle...");
            setLoading(false);
            return; // Loop will retry automatically without breaking live detection
        }
        base64Data = frame.split(',')[1];
    } else {
        base64Data = (image as string).split(',')[1];
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data
                    }
                },
                {
                    text: blindMode ? `Act as an AI system designed to assist visually impaired users in real time. 
                    Analyze the image to detect objects (people, vehicles, doors, stairs, obstacles, signs, etc.) and read relevant text.
                    Return a JSON object with two keys:
                    1. "voice_alert": A clear, short (max 10 words), actionable voice guidance sentence prioritizing safety and navigation. Estimate distance (e.g., 'very close', '2 steps ahead') and position (e.g., 'left', 'ahead'). Example: 'Obstacle on left. Move slightly right.'
                    2. "detections": An array of bounding box detections. Each item needs "label" (string), "confidence" (number 0-1), and "box_2d" ([ymin, xmin, ymax, xmax] integers 0-1000 representing bounding box).`
                    : `Identify main objects in this image. Return a JSON object with a single key "detections" which is an array.
                    Each item in the array must act like a bounding box detection and have:
                    - "label": string name of object
                    - "confidence": number between 0 and 1
                    - "box_2d": [ymin, xmin, ymax, xmax] where these are integers from 0 to 1000 representing the bounding box relative to the image size. 
                    (0,0 is top-left, 1000,1000 is bottom-right).
                    Focus on prominent foreground objects suitable for object detection training.`
                }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    voice_alert: { type: Type.STRING },
                    detections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING },
                                confidence: { type: Type.NUMBER },
                                box_2d: { 
                                    type: Type.ARRAY,
                                    items: { type: Type.INTEGER }
                                }
                            }
                        }
                    }
                }
            }
        }
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        if (result.detections) {
            setDetections(result.detections);
            if (blindMode && result.voice_alert) {
                setLatestAlert(result.voice_alert);
                speakAlert(result.voice_alert);
            } else if (!blindMode) {
                setLatestAlert(null);
                speakDetections(result.detections);
            }
        } else {
            setError("No detections found in response.");
        }
      }
    } catch (err: any) {
      console.error(err);
      
      if (err.message && (err.message.includes('429') || err.message.includes('quota'))) {
          // Ignore 429 rate limit errors to keep it "limitless"
          // We just silently wait for the next frame
      } else {
          setError("Failed to process image. " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const runContinuousDetection = async () => {
    if (!liveDetectionRef.current) return;
    
    await detectObjects();
    
    if (liveDetectionRef.current) {
        // Fast real-time polling
        setTimeout(runContinuousDetection, 500);
    }
  };

  return (
    <div className="w-full bg-black/40 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
      <div className="p-6 border-b border-zinc-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scan className="w-6 h-6 text-purple-500" />
            Detection Lab Simulation
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
            Test the concept using Gemini Vision as a proxy for a trained YOLOv5 model.
            </p>
        </div>
        <div className="flex flex-wrap gap-3">
             <button
                 onClick={() => setBlindMode(!blindMode)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium border ${
                     blindMode 
                     ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' 
                     : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'
                 }`}
                 title={blindMode ? "Blind Mode On" : "Blind Mode Off"}
             >
                 {blindMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                 Blind Mode
             </button>
             <button
                 onClick={() => setVoiceEnabled(!voiceEnabled)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium border ${
                     voiceEnabled 
                     ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/10' 
                     : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'
                 }`}
                 title={voiceEnabled ? "Voice Assistant On (Listening & Speaking)" : "Voice Assistant Off"}
             >
                 {voiceEnabled ? (
                    <div className="flex items-center gap-1">
                      <Mic className="w-4 h-4 animate-pulse text-red-400" />
                      <Volume2 className="w-4 h-4" />
                    </div>
                 ) : (
                    <VolumeX className="w-4 h-4" />
                 )}
                 Assistant
             </button>
             {mode === 'webcam' ? (
                 <button
                     onClick={stopWebcam}
                     className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg transition-all text-sm font-medium border border-red-900/50"
                 >
                     <CameraOff className="w-4 h-4" />
                     Stop Cam
                 </button>
             ) : (
                 <button
                     onClick={startWebcam}
                     className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all text-sm font-medium border border-zinc-700"
                 >
                     <Camera className="w-4 h-4" />
                     Webcam
                 </button>
             )}

             <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all text-sm font-medium border border-zinc-700"
            >
                <Upload className="w-4 h-4" />
                {mode === 'webcam' ? 'Upload Instead' : 'Upload Image'}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            
            {mode === 'webcam' ? (
                 <button
                    onClick={() => setLiveDetection(!liveDetection)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-medium ${
                        liveDetection 
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20'
                    }`}
                >
                    {loading && !liveDetection ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {liveDetection ? <StopCircle className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    {liveDetection ? 'Stop Live' : 'Start Live (3s/frame)'}
                </button>
            ) : (
                <button
                    onClick={detectObjects}
                    disabled={!image || loading}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-medium ${
                        !image || loading 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20'
                    }`}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                    Run Inference
                </button>
            )}
        </div>
      </div>

      {blindMode && latestAlert && (
          <div className="bg-blue-900/40 border-b border-blue-900/60 p-4 flex items-center justify-center gap-3 text-center">
              <Volume2 className="w-6 h-6 text-blue-400 animate-pulse" />
              <p className="text-xl font-bold text-blue-100 tracking-wide">{latestAlert}</p>
          </div>
      )}

      <div className="relative min-h-[400px] bg-zinc-950 flex flex-col items-center justify-center p-4">
        {error && (
            <div className="absolute top-4 left-4 right-4 z-50 bg-red-900/90 text-red-100 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm border border-red-700 shadow-xl backdrop-blur-md">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <strong>Detection Error:</strong> {error}
                </div>
                <button onClick={() => setError(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-semibold uppercase tracking-wider">Dismiss</button>
            </div>
        )}

        {/* Hidden canvas for taking snapshots from video */}
        <canvas ref={canvasRef} className="hidden" />

        {!image && mode === 'image' ? (
          <div className="text-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl">
             <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-8 h-8 text-zinc-600" />
             </div>
             <p className="text-zinc-500 font-medium">Upload an image or start webcam to test</p>
             <p className="text-zinc-600 text-xs mt-2">Supports JPG, PNG via upload or WebRTC live feed</p>
          </div>
        ) : (
          <div className="relative inline-block max-w-full rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
            
            {mode === 'image' && image && (
                <img 
                    ref={imageRef}
                    src={image} 
                    alt="Upload analysis" 
                    className="max-h-[600px] w-auto block"
                />
            )}

            {mode === 'webcam' && (
                <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="max-h-[600px] w-auto block transform scale-x-[-1]" 
                />
            )}
            
            {/* Loading Overlay during live feed */}
            {mode === 'webcam' && loading && liveDetection && (
                <div className="absolute inset-0 border-[3px] border-purple-500/50 rounded-xl pointer-events-none" />
            )}
            
            {/* Overlay Bounding Boxes */}
            {detections.map((det, idx) => {
                const [ymin, xmin, ymax, xmax] = det.box_2d;
                // Convert 0-1000 to percentages
                const top = ymin / 10;
                // Since webcam is often mirrored, we flip x coords to map to the mirrored video properly.
                let left = xmin / 10;
                if (mode === 'webcam') {
                    left = 100 - (xmax / 10);
                }

                const height = (ymax - ymin) / 10;
                const width = (xmax - xmin) / 10;

                const color = ['border-emerald-500', 'border-blue-500', 'border-yellow-500', 'border-pink-500'][idx % 4];
                const bgColor = ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-pink-500'][idx % 4];

                return (
                    <div 
                        key={idx}
                        className={`absolute border-[3px] ${color} hover:bg-white/10 transition-colors cursor-crosshair group`}
                        style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${width}%`,
                            height: `${height}%`
                        }}
                    >
                        <div className={`absolute -top-7 left-[-3px] px-2 py-0.5 ${bgColor} text-black text-xs font-bold rounded-sm whitespace-nowrap shadow-sm`}>
                            {det.label} {Math.round(det.confidence * 100)}%
                        </div>
                    </div>
                );
            })}
          </div>
        )}
      </div>
      
      {/* Results List */}
      {detections.length > 0 && (
          <div className="bg-zinc-900 border-t border-zinc-800 p-4">
              <div className="flex justify-between items-center mb-3">
                 <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Detected Objects ({detections.length})</h4>
                 {mode === 'webcam' && liveDetection && (
                     <div className="flex items-center gap-2">
                        <span className="animate-pulse w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-red-500 font-medium">LIVE WEBCAM</span>
                     </div>
                 )}
              </div>
              <div className="flex flex-wrap gap-2">
                  {detections.map((det, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                          <span className={`w-2 h-2 rounded-full ${['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-pink-500'][idx % 4]}`} />
                          <span className="text-sm text-zinc-200">{det.label}</span>
                          <span className="text-xs text-zinc-500 font-mono">{(det.confidence * 100).toFixed(0)}%</span>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
