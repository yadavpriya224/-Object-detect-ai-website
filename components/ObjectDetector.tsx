import React, { useState, useRef, useEffect } from 'react';
import { Upload, Scan, Loader2, AlertCircle, Maximize2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionObject } from '../types';

export const ObjectDetector: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detections, setDetections] = useState<DetectionObject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image size too large. Please use an image under 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setDetections([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const detectObjects = async () => {
    if (!image) return;
    if (!process.env.API_KEY) {
        setError("API Key is missing. Detection requires a valid Google GenAI API Key.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];

      // We ask Gemini to simulate a YOLO output format
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
                    text: `Identify main objects in this image. Return a JSON object with a single key "detections" which is an array.
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
        } else {
            setError("No detections found in response.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to process image. " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Pre-load a demo image if none selected
  useEffect(() => {
    if (!image) {
        // Just a placeholder state, we don't auto-load to save tokens unless user wants
    }
  }, []);

  return (
    <div className="w-full bg-black/40 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
      <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scan className="w-6 h-6 text-purple-500" />
            Detection Lab Simulation
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
            Test the concept using Gemini Vision as a proxy for a trained YOLOv5 model.
            </p>
        </div>
        <div className="flex gap-3">
             <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all text-sm font-medium border border-zinc-700"
            >
                <Upload className="w-4 h-4" />
                Upload Image
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
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
        </div>
      </div>

      <div className="relative min-h-[400px] bg-zinc-950 flex flex-col items-center justify-center p-4">
        {error && (
            <div className="absolute top-4 left-4 right-4 z-50 bg-red-900/80 text-red-100 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-700 backdrop-blur-md">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
        )}

        {!image ? (
          <div className="text-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl">
             <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-8 h-8 text-zinc-600" />
             </div>
             <p className="text-zinc-500 font-medium">Upload an image to start detection</p>
             <p className="text-zinc-600 text-xs mt-2">Supports JPG, PNG (Max 4MB)</p>
          </div>
        ) : (
          <div className="relative inline-block max-w-full rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            <img 
                ref={imageRef}
                src={image} 
                alt="Upload analysis" 
                className="max-h-[600px] w-auto block"
            />
            
            {/* Overlay Bounding Boxes */}
            {detections.map((det, idx) => {
                const [ymin, xmin, ymax, xmax] = det.box_2d;
                // Convert 0-1000 to percentages
                const top = ymin / 10;
                const left = xmin / 10;
                const height = (ymax - ymin) / 10;
                const width = (xmax - xmin) / 10;

                const color = ['border-emerald-500', 'border-blue-500', 'border-yellow-500', 'border-pink-500'][idx % 4];
                const bgColor = ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-pink-500'][idx % 4];

                return (
                    <div 
                        key={idx}
                        className={`absolute border-2 ${color} hover:bg-white/10 transition-colors cursor-crosshair group`}
                        style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${width}%`,
                            height: `${height}%`
                        }}
                    >
                        <div className={`absolute -top-7 left-[-2px] px-2 py-0.5 ${bgColor} text-black text-xs font-bold rounded-sm whitespace-nowrap shadow-sm`}>
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
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Detected Objects ({detections.length})</h4>
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