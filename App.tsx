import React, { useState } from 'react';
import { 
  Brain, 
  Layers, 
  Cpu, 
  Zap, 
  ChevronRight, 
  Code, 
  BarChart2, 
  Github, 
  ArrowRight,
  Database,
  Target
} from 'lucide-react';
import { CodeBlock } from './components/CodeBlock';
import { MetricsChart } from './components/MetricsChart';
import { ObjectDetector } from './components/ObjectDetector';

function App() {
  const [activeTab, setActiveTab] = useState<'setup' | 'train' | 'eval'>('setup');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const codeSnippets = {
    setup: `
# Create virtual environment
python -m venv detection_env
source detection_env/bin/activate

# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url \\
    https://download.pytorch.org/whl/cu118

# Install YOLOv5 and dependencies
pip install ultralytics opencv-python

# Clone YOLOv5 repository
git clone https://github.com/ultralytics/yolov5
cd yolov5 && pip install -r requirements.txt
    `,
    train: `
from ultralytics import YOLO

# Load a pretrained model (Transfer Learning start point)
model = YOLO('yolov5s.pt') 

# Train the model on custom dataset
results = model.train(
    data='custom_data.yaml', # Path to dataset config
    epochs=100,              # Number of training passes
    imgsz=640,               # Image resolution
    batch=16,                # Batch size
    name='custom_detector',  # Project name
    patience=50,             # Early stopping
    optimizer='AdamW',
    lr0=0.01,                # Initial learning rate
    augment=True             # Data augmentation
)
    `,
    eval: `
from ultralytics import YOLO

# Load best trained model
model = YOLO('runs/detect/custom_detector/weights/best.pt')

# Run validation on test set
metrics = model.val(
    data='custom_data.yaml',
    imgsz=640,
    conf=0.25,      # Confidence threshold
    iou=0.6,        # NMS IoU threshold
    plots=True      # Generate P-R curves
)

print(f"mAP@0.5: {metrics.box.map50:.3f}")
print(f"Precision: {metrics.box.p.mean():.3f}")
    `
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-purple-500/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-500" />
            <span className="font-bold text-lg tracking-tight">DetectAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button onClick={() => scrollToSection('overview')} className="hover:text-white transition-colors">Overview</button>
            <button onClick={() => scrollToSection('process')} className="hover:text-white transition-colors">Process</button>
            <button onClick={() => scrollToSection('demo')} className="hover:text-white transition-colors">Demo</button>
            <button onClick={() => scrollToSection('code')} className="hover:text-white transition-colors">Implementation</button>
          </div>
          <a href="https://github.com/ultralytics/yolov5" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            <Github className="w-4 h-4" />
            <span>Repo</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <Zap className="w-3 h-3" />
              <span>Now with YOLOv5 & SSD Support</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Custom Object Detection using <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Transfer Learning</span>
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed max-w-xl">
              Leverage pretrained deep learning models to detect new object classes with limited data through advanced fine-tuning strategies.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => scrollToSection('demo')}
                className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
              >
                Try Live Demo
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => scrollToSection('code')}
                className="px-6 py-3 border border-zinc-700 hover:border-zinc-600 rounded-lg text-zinc-300 transition-colors"
              >
                View Code
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 blur-3xl rounded-full" />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl">
              <div className="grid grid-cols-2 gap-2">
                 <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden relative group">
                    <img src="https://picsum.photos/400/400?random=1" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Detection Sample 1" />
                    <div className="absolute top-4 left-4 border-2 border-emerald-500 w-16 h-16" />
                    <div className="absolute top-2 left-4 bg-emerald-500 text-black text-[10px] font-bold px-1">CAR 94%</div>
                 </div>
                 <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden relative group">
                    <img src="https://picsum.photos/400/400?random=2" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Detection Sample 2" />
                    <div className="absolute bottom-12 right-12 border-2 border-blue-500 w-20 h-12" />
                    <div className="absolute bottom-[6.5rem] right-[5.5rem] bg-blue-500 text-black text-[10px] font-bold px-1">PERSON 89%</div>
                 </div>
                 <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden relative group">
                    <img src="https://picsum.photos/400/400?random=3" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Detection Sample 3" />
                    <div className="absolute top-8 right-8 border-2 border-yellow-500 w-24 h-24" />
                    <div className="absolute top-6 right-8 bg-yellow-500 text-black text-[10px] font-bold px-1">DOG 99%</div>
                 </div>
                 <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden relative group">
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/50">
                        <BarChart2 className="w-8 h-8 text-zinc-600 mb-2" />
                        <span className="text-xs text-zinc-500">Real-time Metrics</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="overview" className="py-20 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transfer Learning</h3>
              <p className="text-zinc-400">Start with models trained on COCO/ImageNet to reduce data requirements by 90% and speed up convergence.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">GPU Accelerated</h3>
              <p className="text-zinc-400">Optimized for NVIDIA CUDA. Supports mixed-precision training (FP16) for faster throughput on limited hardware.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Backbones</h3>
              <p className="text-zinc-400">Switch between YOLOv5 (Speed) and SSD (Simplicity) architectures depending on your deployment edge case.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Interactive Lab</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Experience the detection pipeline. Upload an image to see how a fine-tuned model identifies objects with bounding boxes and confidence scores.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <ObjectDetector />
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">The Workflow</h2>
            <p className="text-zinc-400">From raw data to deployment in 4 steps.</p>
           </div>

           <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: "01", title: "Pretrained Model", desc: "Start with COCO weights" },
                { step: "02", title: "Feature Extraction", desc: "Freeze backbone layers" },
                { step: "03", title: "Fine-Tuning", desc: "Train head on custom data" },
                { step: "04", title: "Optimization", desc: "Hyperparameter tuning" }
              ].map((item, i) => (
                <div key={i} className="relative p-6 bg-zinc-950 border border-zinc-800 rounded-xl group hover:bg-zinc-900 transition-colors">
                  <div className="text-5xl font-bold text-zinc-800 group-hover:text-zinc-700 mb-4">{item.step}</div>
                  <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Code Section */}
      <section id="code" className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Technical Implementation</h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                We use the PyTorch ecosystem for its dynamic computation graph and ease of debugging. 
                The process involves setting up the environment, configuring the model architecture for 
                your specific number of classes (nc), and running the training loop with early stopping.
              </p>
              
              <div className="space-y-4">
                 <div className="flex items-start gap-4">
                    <div className="p-2 bg-zinc-800 rounded-lg mt-1"><Database className="w-5 h-5 text-emerald-400"/></div>
                    <div>
                        <h4 className="font-semibold text-white">Data Preparation</h4>
                        <p className="text-sm text-zinc-400">Images must be annotated in YOLO TXT format. Directory structure requires clear separation of train/val images.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="p-2 bg-zinc-800 rounded-lg mt-1"><Target className="w-5 h-5 text-blue-400"/></div>
                    <div>
                        <h4 className="font-semibold text-white">Model Configuration</h4>
                        <p className="text-sm text-zinc-400">Modify the `nc` (number of classes) parameter in the YAML configuration file to match your custom dataset.</p>
                    </div>
                 </div>
              </div>
            </div>

            <div>
              <div className="flex gap-2 mb-4 border-b border-zinc-700 pb-1">
                {(['setup', 'train', 'eval'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab 
                      ? 'bg-zinc-800 text-white border-b-2 border-emerald-500' 
                      : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <CodeBlock 
                title={activeTab === 'setup' ? 'Environment Setup' : activeTab === 'train' ? 'Training Loop' : 'Validation'} 
                language="python" 
                code={codeSnippets[activeTab]} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
           <h2 className="text-3xl font-bold mb-12">Performance Evaluation</h2>
           <MetricsChart />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800 bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-zinc-600" />
            <span className="font-bold text-zinc-500">DetectAI</span>
          </div>
          <div className="text-zinc-600 text-sm">
            © 2024 Educational Project. Using Gemini 2.5 Flash for Demo.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-600 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-zinc-600 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-zinc-600 hover:text-white transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;