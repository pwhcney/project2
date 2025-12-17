import React, { useState, useRef, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Move3d, Rotate3d } from 'lucide-react';

interface VectorChartProps {
  vecA: number[];
  vecB: number[];
  labelA?: string;
  labelB?: string;
}

export const VectorChart: React.FC<VectorChartProps> = ({ 
  vecA, 
  vecB, 
  labelA = 'Vector A', 
  labelB = 'Vector B' 
}) => {
  // State for 3D rotation
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (vecA.length === 0) return null;

  // --- 2D Visualization Mode ---
  if (vecA.length === 2 && vecB.length === 2) {
    const size = 300;
    const center = size / 2;
    
    // Calculate scale extent
    const maxVal = Math.max(
      Math.abs(vecA[0]), Math.abs(vecA[1]), 
      Math.abs(vecB[0]), Math.abs(vecB[1]), 
      1
    ) * 1.2; // 20% padding
    
    const scale = (center - 20) / maxVal;

    const getCoord = (x: number, y: number) => ({
      x: center + x * scale,
      y: center - y * scale // Flip Y for SVG
    });

    const origin = getCoord(0, 0);
    const endA = getCoord(vecA[0], vecA[1]);
    const endB = getCoord(vecB[0], vecB[1]);

    return (
      <div className="w-full h-80 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">2D Cartesian Space</h3>
        <div className="relative w-full h-full flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible bg-slate-50 rounded-full border border-slate-100">
            <defs>
              <marker id="arrowA" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
              <marker id="arrowB" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#f43f5e" />
              </marker>
            </defs>

            {/* Grid Axes */}
            <line x1={center} y1={0} x2={center} y2={size} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={0} y1={center} x2={size} y2={center} stroke="#cbd5e1" strokeWidth="1" />

            {/* Vector A */}
            <line 
              x1={origin.x} y1={origin.y} 
              x2={endA.x} y2={endA.y} 
              stroke="#3b82f6" 
              strokeWidth="3" 
              markerEnd="url(#arrowA)" 
              className="drop-shadow-sm"
            />
            
            {/* Vector B */}
            <line 
              x1={origin.x} y1={origin.y} 
              x2={endB.x} y2={endB.y} 
              stroke="#f43f5e" 
              strokeWidth="3" 
              markerEnd="url(#arrowB)" 
              className="drop-shadow-sm"
            />

            {/* Origin Dot */}
            <circle cx={origin.x} cy={origin.y} r="3" fill="#64748b" />

            {/* Labels (positioned slightly offset) */}
            <text x={endA.x} y={endA.y - 15} textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold" className="bg-white">{labelA}</text>
            <text x={endB.x} y={endB.y - 15} textAnchor="middle" fill="#f43f5e" fontSize="12" fontWeight="bold">{labelB}</text>
          </svg>
        </div>
      </div>
    );
  }

  // --- 3D Visualization Mode ---
  if (vecA.length === 3 && vecB.length === 3) {
    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setRotation(prev => ({
        x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)), // Pitch
        y: prev.y + deltaX * 0.5 // Yaw
      }));
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // 3D Projection Logic
    const size = 320;
    const center = size / 2;
    // Auto-scale based on max value in vectors
    const maxVal = Math.max(
      ...vecA.map(Math.abs), ...vecB.map(Math.abs), 5
    ) * 1.5;
    const scale = (size / 2 - 40) / maxVal;

    const project = (x: number, y: number, z: number) => {
      // Convert degrees to radians
      const radX = rotation.x * (Math.PI / 180);
      const radY = rotation.y * (Math.PI / 180);

      // Rotate around Y axis (Yaw)
      const x1 = x * Math.cos(radY) - z * Math.sin(radY);
      const z1 = x * Math.sin(radY) + z * Math.cos(radY);

      // Rotate around X axis (Pitch)
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

      // Simple Orthographic Projection
      return {
        x: center + x1 * scale,
        y: center - y2 * scale, // SVG Y is down
        z: z2 // Depth for z-index if needed (not used in simple line drawing)
      };
    };

    const origin = project(0, 0, 0);
    
    // Axes Endpoints
    const xAxis = project(maxVal, 0, 0);
    const yAxis = project(0, maxVal, 0);
    const zAxis = project(0, 0, maxVal);

    // Vector Endpoints
    const pA = project(vecA[0], vecA[1], vecA[2]);
    const pB = project(vecB[0], vecB[1], vecB[2]);
    
    // Projections to floor (y=0) for depth cues
    const pA_floor = project(vecA[0], 0, vecA[2]);
    const pB_floor = project(vecB[0], 0, vecB[2]);

    return (
      <div className="w-full h-80 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col items-center select-none">
        <div className="flex justify-between w-full items-center mb-1">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">3D Interactive View</h3>
          <div className="flex items-center text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
             <Rotate3d size={12} className="mr-1"/> Drag to rotate
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className={`relative w-full h-full flex items-center justify-center cursor-move rounded-xl border border-slate-50 ${isDragging ? 'bg-slate-50' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            <defs>
              <marker id="arrowA3d" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker id="arrowB3d" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" />
              </marker>
            </defs>

            {/* Axes */}
            <line x1={origin.x} y1={origin.y} x2={xAxis.x} y2={xAxis.y} stroke="#ef4444" strokeWidth="1" strokeOpacity="0.3" /> {/* X - Red */}
            <line x1={origin.x} y1={origin.y} x2={yAxis.x} y2={yAxis.y} stroke="#22c55e" strokeWidth="1" strokeOpacity="0.3" /> {/* Y - Green */}
            <line x1={origin.x} y1={origin.y} x2={zAxis.x} y2={zAxis.y} stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3" /> {/* Z - Blue */}
            
            {/* Axis Labels */}
            <text x={xAxis.x} y={xAxis.y} fill="#ef4444" fontSize="10" fontWeight="bold">X</text>
            <text x={yAxis.x} y={yAxis.y} fill="#22c55e" fontSize="10" fontWeight="bold">Y</text>
            <text x={zAxis.x} y={zAxis.y} fill="#3b82f6" fontSize="10" fontWeight="bold">Z</text>

            {/* Guide Lines (Floor Projection) */}
            <line x1={origin.x} y1={origin.y} x2={pA_floor.x} y2={pA_floor.y} stroke="#3b82f6" strokeDasharray="3,3" strokeOpacity="0.2" />
            <line x1={pA_floor.x} y1={pA_floor.y} x2={pA.x} y2={pA.y} stroke="#3b82f6" strokeDasharray="3,3" strokeOpacity="0.2" />
            
            <line x1={origin.x} y1={origin.y} x2={pB_floor.x} y2={pB_floor.y} stroke="#f43f5e" strokeDasharray="3,3" strokeOpacity="0.2" />
            <line x1={pB_floor.x} y1={pB_floor.y} x2={pB.x} y2={pB.y} stroke="#f43f5e" strokeDasharray="3,3" strokeOpacity="0.2" />

            {/* Vector A */}
            <line 
              x1={origin.x} y1={origin.y} 
              x2={pA.x} y2={pA.y} 
              stroke="#3b82f6" 
              strokeWidth="3" 
              markerEnd="url(#arrowA3d)" 
            />
             <text x={pA.x} y={pA.y - 10} textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold" style={{textShadow: '0 1px 2px white'}}>{labelA}</text>

            {/* Vector B */}
            <line 
              x1={origin.x} y1={origin.y} 
              x2={pB.x} y2={pB.y} 
              stroke="#f43f5e" 
              strokeWidth="3" 
              markerEnd="url(#arrowB3d)" 
            />
            <text x={pB.x} y={pB.y - 10} textAnchor="middle" fill="#f43f5e" fontSize="12" fontWeight="bold" style={{textShadow: '0 1px 2px white'}}>{labelB}</text>

            {/* Origin */}
            <circle cx={origin.x} cy={origin.y} r="3" fill="#64748b" />

          </svg>
          
          <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono">
             Pitch: {Math.round(rotation.x)}° Yaw: {Math.round(rotation.y)}°
          </div>
        </div>
      </div>
    );
  }

  // --- Multi-dimensional Visualization (Fallback for N > 3) ---
  const data = vecA.map((valA, idx) => ({
    dimension: `Dim ${idx + 1}`,
    [labelA]: valA,
    [labelB]: vecB[idx] || 0,
    fullMark: Math.max(Math.abs(valA), Math.abs(vecB[idx] || 0)) // For scaling
  }));

  return (
    <div className="w-full h-80 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Component Visualization</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        {vecA.length > 3 ? ( // Changed logic: Use Radar only for > 3 dims
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Radar
              name={labelA}
              dataKey={labelA}
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.3}
            />
            <Radar
              name={labelB}
              dataKey={labelB}
              stroke="#f43f5e"
              strokeWidth={2}
              fill="#f43f5e"
              fillOpacity={0.3}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          </RadarChart>
        ) : (
          /* Fallback for 1D or weird scaling issues */
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="dimension" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }}/>
            <Bar dataKey={labelA} fill="#3b82f6" radius={[4, 4, 0, 0]} name={labelA} />
            <Bar dataKey={labelB} fill="#f43f5e" radius={[4, 4, 0, 0]} name={labelB} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};