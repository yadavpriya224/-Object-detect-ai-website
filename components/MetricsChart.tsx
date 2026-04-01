import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

const data = [
  { name: 'mAP@0.5', baseline: 87.2, fineTuned: 92.4 },
  { name: 'mAP@0.5:0.95', baseline: 70.5, fineTuned: 78.6 },
  { name: 'Precision', baseline: 0.82, fineTuned: 0.89 },
  { name: 'Recall', baseline: 0.79, fineTuned: 0.85 },
];

const radarData = [
  { subject: 'Speed (FPS)', A: 120, fullMark: 150 },
  { subject: 'mAP@0.5', A: 92.4, fullMark: 100 },
  { subject: 'Precision', A: 89, fullMark: 100 },
  { subject: 'Recall', A: 85, fullMark: 100 },
  { subject: 'Size (Small)', A: 90, fullMark: 100 },
];

export const MetricsChart: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
          <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
          Performance Comparison
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                itemStyle={{ color: '#e4e4e7' }}
                cursor={{fill: '#27272a'}}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="baseline" name="Pretrained (Baseline)" fill="#3f3f46" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fineTuned" name="Fine-Tuned (Yours)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
          Model Balance
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <Radar
                name="Custom YOLOv5"
                dataKey="A"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                 itemStyle={{ color: '#e4e4e7' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};