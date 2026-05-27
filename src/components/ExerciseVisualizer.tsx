import React, { useState, useEffect } from 'react';
import { Play, Pause, Activity, RefreshCw, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface ExerciseVisualizerProps {
  exerciseId: string;
  exerciseName: string;
  category: string;
  weight?: number;
  isPaused?: boolean;
}

export default function ExerciseVisualizer({
  exerciseId,
  exerciseName,
  category,
  weight,
  isPaused = false
}: ExerciseVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(!isPaused);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showMuscles, setShowMuscles] = useState<boolean>(true);
  const [angleValue, setAngleValue] = useState<number>(90);
  const [activationPercent, setActivationPercent] = useState<number>(0);
  
  // Local reactive weight state seeded from the exercise card/sheet prop
  const [activeWeight, setActiveWeight] = useState<number>(weight ?? 15);

  useEffect(() => {
    if (weight !== undefined) {
      setActiveWeight(weight);
    }
  }, [weight]);

  // Interpolation: Light Load (Yellow: rgb(255, 220, 0)) to Heavy Load (Red: rgb(255, 0, 0))
  const loadRatio = Math.min(1, Math.max(0, (activeWeight - 5) / 35)); // 5kg is lightweight, 40kg is hyper-heavy effort
  const r = 255;
  const g = Math.round(220 - loadRatio * 220); 
  const b = 0;
  const muscleColor = `rgb(${r}, ${g}, ${b})`;

  // Animation frame loop tick counter from 0 to 100 representing a single repetition cycle
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;

    let id: NodeJS.Timeout;
    const intervalTime = 40; // ~25 FPS

    id = setInterval(() => {
      setTick((prev) => (prev + 1.5) % 100);
    }, intervalTime);

    return () => clearInterval(id);
  }, [isPlaying]);

  // Compute normalized values based on our tick (0 - 100)
  // Sine wave for fluid back-and-forth movement
  const radian = (tick / 100) * Math.PI * 2;
  const sinFactor = Math.sin(radian - Math.PI / 2); // Ranges from -1 to 1 (starts at bottom/minimum flexion)
  const normalized = (sinFactor + 1) / 2; // Ranges from 0 to 1

  // Dynamic status of execution phase based on direction
  const isDescending = tick < 50;
  const phaseLabel = isDescending ? 'Fase Excêntrica (Controlada)' : 'Fase Concêntrica (Explosiva)';

  // Category specific biomechanical dynamic coordinates
  let jointAngleRange = [180, 90]; // from full extension to deep flexion
  let targetActivation = 0;

  // Render variables according to category
  switch (category) {
    case 'Peito':
      jointAngleRange = [180, 85]; // Elbow angle
      targetActivation = normalized * 100; // Peak contraction at extension
      break;
    case 'Costas':
      jointAngleRange = [170, 75]; // Elbow angle pulling down
      targetActivation = (1 - normalized) * 100; // Peak activation when pulled deep
      break;
    case 'Ombro':
      jointAngleRange = [160, 80]; // Shoulder angle
      targetActivation = normalized * 100; // Peak at the top elevation
      break;
    case 'Bíceps':
      jointAngleRange = [170, 45]; // Elbow flexed
      targetActivation = (1 - normalized) * 100; // Peak squeeze at top
      break;
    case 'Tríceps':
      jointAngleRange = [90, 180]; // Extension thrust
      targetActivation = normalized * 100; // Peak at the straight arm lock
      break;
    case 'Pernas':
      jointAngleRange = [180, 80]; // Knee angle
      targetActivation = (1 - normalized) * 100; // Peak squeeze pushing away or standing
      break;
    case 'Glúteos':
      jointAngleRange = [45, 180]; // Hip drive angle
      targetActivation = normalized * 100; // Peak squeeze at full bridge
      break;
    case 'Abdômen':
      jointAngleRange = [180, 120]; // Spine crunch angle
      targetActivation = (1 - normalized) * 100; // Peak crunch point
      break;
    default:
      jointAngleRange = [180, 100];
      targetActivation = normalized * 100;
  }

  // Update dynamic telemetry variables in state on tick
  useEffect(() => {
    // Current angle
    const currentAngle = Math.round(
      jointAngleRange[0] + normalized * (jointAngleRange[1] - jointAngleRange[0])
    );
    setAngleValue(currentAngle);
    
    // Muscle activation output meter
    setActivationPercent(Math.round(targetActivation));
  }, [normalized, exerciseId, category]);

  // SVG Render Helper for Body segments
  const renderInteractiveSkeleton = () => {
    const strokeColor = showSkeleton ? '#39FF14' : 'rgba(57, 255, 20, 0.2)';
    const headRadius = 14;
    const pivotX = 150;
    const pivotY = 130;

    // Build specific coordinates dynamically depending on exercise target segments
    if (category === 'Peito' || exerciseId === 'e1' || exerciseId === 'e2') {
      // Bench Press style view
      // Backrest bench flat: from X: 70 to 230 on Y: 180
      // Torso resting horizontal on Y: 170
      const headX = 85;
      const headY = 145;
      const hipX = 220;
      const hipY = 170;
      const shoulderX = 120;
      const shoulderY = 170;

      // Elbow and hands move vertically pushing weight up and down
      const maxElbowY = 210;
      const minElbowY = 150;
      
      const maxBarY = 175;
      const minBarY = 100;

      const elbowX = 145;
      const elbowY = maxElbowY - normalized * (maxElbowY - minElbowY);
      
      const barY = maxBarY - normalized * (maxBarY - minBarY);
      const handX = 142;
      const handY = barY;

      return (
        <g className="transition-all duration-75">
          {/* Flat bench frame */}
          <line x1="60" y1="180" x2="240" y2="180" stroke="#262626" strokeWidth="8" strokeLinecap="round" />
          <line x1="80" y1="180" x2="80" y2="240" stroke="#1c1c1c" strokeWidth="4" />
          <line x1="220" y1="180" x2="220" y2="240" stroke="#1c1c1c" strokeWidth="4" />
          <line x1="120" y1="180" x2="120" y2="240" stroke="#1c1c1c" strokeWidth="4" />

          {/* Muscle contraction overlay */}
          {showMuscles && (
            <path 
              d={`M ${shoulderX} ${shoulderY} Q 150 140, ${shoulderX + 50} ${shoulderY - 10}`} 
              fill="none" 
              stroke={muscleColor} 
              strokeWidth={Math.max(2, activationPercent / 8)} 
              strokeOpacity={(activationPercent / 120) + 0.1}
              className="animate-pulse"
            />
          )}

          {/* Skeleton segments */}
          {/* Head */}
          <circle cx={headX} cy={headY} r={headRadius} fill="none" stroke={strokeColor} strokeWidth="3" />
          {/* Spine / Torso */}
          <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} stroke={strokeColor} strokeWidth="5" />
          {/* Glute-Hip segment to bent knees */}
          <line x1={hipX} y1={hipY} x2={240} y2={220} stroke={strokeColor} strokeWidth="4" />
          <line x1={240} y1={220} x2={240} y2="260" stroke={strokeColor} strokeWidth="4" />

          {/* Upper Arm Segment: Neck to Shoulder to Elbow */}
          <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} stroke={strokeColor} strokeWidth="4" />
          {/* Lower Arm Segment: Elbow to Hand bar contact */}
          <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} stroke={strokeColor} strokeWidth="4" />

          {/* Joint Nodes Tracking indicators */}
          <circle cx={shoulderX} cy={shoulderY} r={5} fill="#39FF14" />
          <circle cx={elbowX} cy={elbowY} r={5} fill="#39FF14" />
          <circle cx={handX} cy={handY} r={4} fill="#a855f7" />

          {/* Barbell Bar (being pushed) */}
          <line x1="142" y1={barY - 45} x2="142" y2={barY + 45} stroke="#525252" strokeWidth="5" strokeLinecap="round" />
          {/* Dumbbells / Weights Plates */}
          <rect x="139" y={barY - 50} width="6" height="10" rx="1" fill="#171717" stroke="#39FF14" strokeWidth="1" />
          <rect x="139" y={barY + 40} width="6" height="10" rx="1" fill="#171717" stroke="#39FF14" strokeWidth="1" />
          <circle cx="142" cy={barY} r={6} fill="#ef4444" opacity="0.8" />
        </g>
      );
    }

    if (category === 'Bíceps' || exerciseId === 'e7') {
      // Biceps curl side view
      const shoulderX = 140;
      const shoulderY = 110;
      const hipX = 140;
      const hipY = 190;
      const headX = 140;
      const headY = 70;

      // Elbow stays locked at costal margin X:140, Y:150
      const elbowX = 140;
      const elbowY = 150;

      // Hand rotates around elbow from Y:190 down, to Y:115 up in circle path
      const angleRad = Math.PI/2 + normalized * (Math.PI / 1.5); // Rotation angle
      const handX = elbowX + Math.sin(angleRad) * 45;
      const handY = elbowY + Math.cos(angleRad) * 45;

      return (
        <g className="transition-all duration-75">
          {/* Chest & Body frame */}
          <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} stroke="#1c1c1c" strokeWidth="16" strokeLinecap="round" />

          {/* Realtime muscle heatmap flaring */}
          {showMuscles && (
            <ellipse 
               cx={(shoulderX + handX) / 2 - 4} 
               cy={(shoulderY + handY) / 2 + 10} 
               rx={10 + activationPercent / 12} 
               ry="14" 
               fill={muscleColor} 
               fillOpacity={(activationPercent / 100) * 0.7} 
            />
          )}

          {/* Joint indicators */}
          <circle cx={headX} cy={headY} r={headRadius} fill="none" stroke={strokeColor} strokeWidth="3" />
          {/* Back spine line */}
          <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} stroke={strokeColor} strokeWidth="4" />
          {/* Hips to femur legs anchor */}
          <line x1={hipX} y1={hipY} x2={145} y2={250} stroke={strokeColor} strokeWidth="4" />

          {/* Flexor bones skeleton arm */}
          <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} stroke={strokeColor} strokeWidth="5" />
          <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} stroke={strokeColor} strokeWidth="4" />

          {/* Joints pointers */}
          <circle cx={shoulderX} cy={shoulderY} r={4.5} fill="#39FF14" />
          <circle cx={elbowX} cy={elbowY} r={4.5} fill="#39FF14" />
          <circle cx={handX} cy={handY} r={5} fill="#a855f7" />

          {/* Hand load / Barbell weight */}
          <circle cx={handX} cy={handY} r="8" fill="#111111" stroke="#39FF14" strokeWidth="2" />
          <line x1={handX - 10} y1={handY} x2={handX + 10} y2={handY} stroke="#ef4444" strokeWidth="3" />
        </g>
      );
    }

    if (category === 'Costas' || exerciseId === 'e3' || exerciseId === 'e4') {
      // Sitting Pulldown machine back view
      // Pulley machine anchor line:
      const seatY = 200;
      const shoulderX_L = 120;
      const shoulderX_R = 180;
      const shoulderY = 125;
      
      const hipX_L = 130;
      const hipX_R = 170;
      const hipY = 200;

      // Pulley cable starts high: Y: 50. Moves down to Y: 105
      const cabY = 60 + normalized * 45;
      
      // Hands holding bar
      const handX_L = 100;
      const handX_R = 200;
      const elbowY_comp = 110 + normalized * 45;
      const elbowX_L = 110 - normalized * 8;
      const elbowX_R = 190 + normalized * 8;

      return (
        <g className="transition-all duration-75">
          {/* Machine frame background */}
          <line x1="150" y1="40" x2="150" y2="80" stroke="#222" strokeWidth="6" />
          <line x1="100" y1="40" x2="200" y2="40" stroke="#222" strokeWidth="8" strokeLinecap="round" />
          {/* Seat */}
          <line x1="110" y1={seatY} x2="190" y2={seatY} stroke="#1f1f1f" strokeWidth="10" strokeLinecap="round" />

          {/* Dorsal Lat expansion muscles flame */}
          {showMuscles && (
            <g>
              <path 
                d={`M ${shoulderX_L} ${shoulderY} Q 110 160, ${hipX_L} ${hipY}`} 
                fill="none" 
                stroke={muscleColor} 
                strokeWidth={Math.max(2, activationPercent / 8)} 
                strokeOpacity={(activationPercent / 100) * 0.7} 
              />
              <path 
                d={`M ${shoulderX_R} ${shoulderY} Q 190 160, ${hipX_R} ${hipY}`} 
                fill="none" 
                stroke={muscleColor} 
                strokeWidth={Math.max(2, activationPercent / 8)} 
                strokeOpacity={(activationPercent / 100) * 0.7} 
              />
            </g>
          )}

          {/* Skeleton representation */}
          <circle cx="150" cy="95" r={headRadius} fill="none" stroke={strokeColor} strokeWidth="3" />
          
          {/* Shoulders grid */}
          <line x1={shoulderX_L} y1={shoulderY} x2={shoulderX_R} y2={shoulderY} stroke={strokeColor} strokeWidth="5" />
          
          {/* Spine center */}
          <line x1="150" y1={shoulderY} x2="150" y2={hipY} stroke={strokeColor} strokeWidth="4" />
          <line x1={hipX_L} y1={hipY} x2={hipX_R} y2={hipY} stroke={strokeColor} strokeWidth="4" />

          {/* Torso thighs */}
          <line x1={hipX_L} y1={hipY} x2="115" y2="245" stroke={strokeColor} strokeWidth="3" />
          <line x1={hipX_R} y1={hipY} x2="185" y2="245" stroke={strokeColor} strokeWidth="3" />

          {/* Left Arm joints */}
          <line x1={shoulderX_L} y1={shoulderY} x2={elbowX_L} y2={elbowY_comp} stroke={strokeColor} strokeWidth="4" />
          <line x1={elbowX_L} y1={elbowY_comp} x2={handX_L} y2={cabY} stroke={strokeColor} strokeWidth="4" />

          {/* Right Arm joints */}
          <line x1={shoulderX_R} y1={shoulderY} x2={elbowX_R} y2={elbowY_comp} stroke={strokeColor} strokeWidth="4" />
          <line x1={elbowX_R} y1={elbowY_comp} x2={handX_R} y2={cabY} stroke={strokeColor} strokeWidth="4" />

          {/* Hand targets */}
          <circle cx={handX_L} cy={cabY} r={4.5} fill="#a855f7" />
          <circle cx={handX_R} cy={cabY} r={4.5} fill="#a855f7" />
          <circle cx={elbowX_L} cy={elbowY_comp} r={4} fill="#39FF14" />
          <circle cx={elbowX_R} cy={elbowY_comp} r={4} fill="#39FF14" />

          {/* Pulley bar */}
          <line x1={handX_L - 15} y1={cabY} x2={handX_R + 15} y2={cabY} stroke="#525252" strokeWidth="4.5" strokeLinecap="round" />
          {/* Cables */}
          <line x1="150" y1="40" x2="150" y2="52" stroke="#a855f7" strokeWidth="2.5" />
          <line x1={handX_L} y1="40" x2={handX_L} y2={cabY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
          <line x1={handX_R} y1="40" x2={handX_R} y2={cabY} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
        </g>
      );
    }

    if (category === 'Pernas' || category === 'Glúteos' || exerciseId === 'e9' || exerciseId === 'e10' || exerciseId === 'e11') {
      // Squat style side profile representation
      const ankleX = 120;
      const ankleY = 240;

      // Knee flexing forwards and downwards
      // Squat depth variable
      const hipMinY = 130;
      const hipMaxY = 195;
      const hipY = hipMinY + (1 - normalized) * (hipMaxY - hipMinY);
      const hipX = 120 - (1 - normalized) * 45; // hip pushes back on squat

      const kneeMinY = 185;
      const kneeMaxY = 195;
      const kneeY = kneeMinY + (1 - normalized) * (kneeMaxY - kneeMinY);
      const kneeX = 150 + (1 - normalized) * 12; // knee pushes slightly forward

      const shoulderX = hipX + 15;
      const shoulderY = hipY - 60;
      const headX = shoulderX + 5;
      const headY = shoulderY - 20;

      return (
        <g className="transition-all duration-75">
          {/* Ground level reference */}
          <line x1="50" y1="242" x2="250" y2="242" stroke="#262626" strokeWidth="6" strokeLinecap="round" />

          {/* Thigh (Quadríceps) thermal contraction zone */}
          {showMuscles && (
            <path 
              d={`M ${hipX} ${hipY} Q ${(hipX + kneeX)/2 + 4} ${(hipY + kneeY)/2 - 4}, ${kneeX} ${kneeY}`} 
              fill="none" 
              stroke={muscleColor} 
              strokeWidth={Math.max(3, activationPercent / 6)} 
              strokeOpacity={(activationPercent / 120) + 0.15} 
            />
          )}

          {/* Skeleton segments */}
          <circle cx={headX} cy={headY} r={12} fill="none" stroke={strokeColor} strokeWidth="3" />
          {/* Back spine leaning angled */}
          <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} stroke={strokeColor} strokeWidth="5.5" />
          {/* Femur thigh bone */}
          <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke={strokeColor} strokeWidth="5" />
          {/* Tibia calf bone */}
          <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke={strokeColor} strokeWidth="4" />
          {/* Foot flat on floor */}
          <line x1={ankleX} y1={ankleY} x2={ankleX + 22} y2={ankleY} stroke={strokeColor} strokeWidth="4.5" />

          {/* Joint focal nodes */}
          <circle cx={shoulderX} cy={shoulderY} r={4.5} fill="#39FF14" />
          <circle cx={hipX} cy={hipY} r={5} fill="#39FF14" />
          <circle cx={kneeX} cy={kneeY} r={5} fill="#39FF14" />
          <circle cx={ankleX} cy={ankleY} r={4.5} fill="#a855f7" />

          {/* Heavy weight bar resting on top shoulders */}
          <circle cx={shoulderX} cy={shoulderY - 5} r="9" fill="#e11d48" opacity="0.8" />
          <line x1={shoulderX - 10} y1={shoulderY - 5} x2={shoulderX + 15} y2={shoulderY - 5} stroke="#525252" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    }

    // Default universal fallback avatar layout: Standard dynamic jumping-jack or standing press
    return (
      <g className="transition-all duration-75">
        <line x1="50" y1="240" x2="250" y2="240" stroke="#1f1f1f" strokeWidth="4" />
        
        {/* Dynamic muscular aura */}
        {showMuscles && (
          <circle 
            cx={pivotX} 
            cy={pivotY} 
            r={30 + normalized * 15} 
            fill="none" 
            stroke={muscleColor} 
            strokeWidth="2" 
            strokeDasharray="4,4" 
            strokeOpacity="0.4"
            className="animate-spin-slow"
          />
        )}

        <circle cx={pivotX} cy={pivotY - 60} r="15" fill="none" stroke={strokeColor} strokeWidth="3" />
        {/* Torso trunk spine */}
        <line x1={pivotX} y1={pivotY - 45} x2={pivotX} y2={pivotY + 30} stroke={strokeColor} strokeWidth="5" />
        
        {/* Dynamic flexing limbs */}
        {/* Left Arm flexing */}
        <line x1={pivotX} y1={pivotY - 35} x2={pivotX - 45} y2={pivotY - 40 + normalized * 60} stroke={strokeColor} strokeWidth="4.5" />
        {/* Right arm flexing */}
        <line x1={pivotX} y1={pivotY - 35} x2={pivotX + 45} y2={pivotY - 40 + normalized * 60} stroke={strokeColor} strokeWidth="4.5" />

        {/* Thigh legs */}
        <line x1={pivotX} y1={pivotY + 30} x2={pivotX - 30} y2={pivotY + 95 - (1 - normalized) * 15} stroke={strokeColor} strokeWidth="4" />
        <line x1={pivotX} y1={pivotY + 30} x2={pivotX + 30} y2={pivotY + 95 - (1 - normalized) * 15} stroke={strokeColor} strokeWidth="4" />

        <circle cx={pivotX} cy={pivotY - 35} r="4.5" fill="#39FF14" />
        <circle cx={pivotX - 45} cy={pivotY - 40 + normalized * 60} r="4.5" fill="#a855f7" />
        <circle cx={pivotX + 45} cy={pivotY - 40 + normalized * 60} r="4.5" fill="#a855f7" />
      </g>
    );
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative aspect-video select-none">
      
      {/* Sci-fi wireframe matrix scanner background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      
      {/* Target scanning telemetry brackets */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#39FF14]/50 pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#39FF14]/50 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#39FF14]/50 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#39FF14]/50 pointer-events-none" />

      {/* Realtime dynamic AI Overlay Status */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/70 border border-[#39FF14]/30 rounded px-2 py-0.5 max-w-max">
          <Cpu size={12} className="text-[#39FF14] animate-pulse" />
          <span className="text-[9px] font-mono font-bold tracking-wider text-[#39FF14] uppercase">
            IA GERADORA: ATIVO
          </span>
        </div>
        <div className="text-[9px] font-mono text-neutral-400 bg-black/60 px-2 py-0.5 rounded">
          Músculo-Alvo: <span className="text-white font-bold">{category}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className={`px-2 py-0.5 rounded-md text-[8px] font-mono uppercase tracking-widest font-extrabold cursor-pointer border transition duration-150 ${
            showSkeleton ? 'bg-[#39FF14]/15 border-[#39FF14]/40 text-[#39FF14]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
          }`}
          title="Alternar grade de articulações e esqueleto mecânico"
        >
          Esqueleto
        </button>
        <button
          onClick={() => setShowMuscles(!showMuscles)}
          className={`px-2 py-0.5 rounded-md text-[8px] font-mono uppercase tracking-widest font-extrabold cursor-pointer border transition duration-150 ${
            showMuscles ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
          }`}
          title="Alternar mapa de ativação calórica das fibras moleculares"
        >
          Esforço
        </button>
      </div>

      {/* Main dynamic Render Frame Viewport */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <svg 
          viewBox="0 0 300 270" 
          className="w-full h-full max-h-[85%] object-contain"
        >
          {renderInteractiveSkeleton()}
        </svg>
      </div>

      {/* Interactive telemetry dashboard sidebar overlay lines */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex flex-col gap-1 pointer-events-none font-mono">
        <div className="text-[9px] text-neutral-400 leading-tight">
          ÂNGULO ARTICULAR: <strong className="text-yellow-400">{angleValue}°</strong>
        </div>
        <div className="text-[9px] text-neutral-400 leading-tight">
          ATIVIDADE MOTOR: <strong style={{ color: muscleColor }}>{activationPercent}%</strong>
        </div>
        <div className="text-[9px] text-neutral-400 leading-tight">
          CARGA DEFINIDA: <strong className="text-white">{activeWeight} kg</strong>
        </div>
        <div className="text-[9px] text-neutral-400 leading-tight">
          SINAL DE FADIGA: <strong className="font-extrabold uppercase" style={{ color: muscleColor }}>{
            loadRatio < 0.25 ? 'MÍNIMA (FÁCIL)' : loadRatio < 0.65 ? 'MODERADA (FADIGA ATIVA)' : 'MÁXIMA (CONSTRANGIMENTO)'
          }</strong>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 hidden sm:flex flex-col text-right font-mono pointer-events-none">
        <div className="text-[9px] text-neutral-400 leading-tight">
          CICLO: <strong className="text-purple-400 font-extrabold">BIOMECÂNICO</strong>
        </div>
        <div className="text-[9px] leading-tight font-extrabold tracking-wider animate-pulse" style={{ color: muscleColor }}>
          {phaseLabel.toUpperCase()}
        </div>
      </div>

      {/* Live loop controller */}
      <div className="bg-black/90 border-t border-neutral-800 p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:text-[#39FF14] hover:bg-neutral-800 transition duration-150 cursor-pointer active:scale-90"
              title={isPlaying ? "Pausar loop de repetição" : "Retomar demonstração"}
            >
              {isPlaying ? <Pause size={12} className="fill-white hover:fill-[#39FF14]" /> : <Play size={12} className="fill-white text-[#39FF14]" />}
            </button>
            
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">Executando</span>
              <span className="text-[10px] text-white font-extrabold max-w-[150px] truncate leading-tight">
                {exerciseName}
              </span>
            </div>
          </div>
          
          <div className="sm:hidden text-[9px] font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {activeWeight} kg
          </div>
        </div>

        {/* Dynamic Interactive Load Fatigue Simulator Slider */}
        <div className="flex items-center gap-2 bg-neutral-900/60 border border-neutral-800/85 px-2.5 py-1 rounded-xl w-full sm:w-auto justify-between max-w-xs">
          <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-bold shrink-0">Simulador Carga:</span>
          <input 
            type="range"
            min="5"
            max="80"
            value={activeWeight}
            onChange={(e) => setActiveWeight(Number(e.target.value))}
            className="w-20 sm:w-24 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: muscleColor
            }}
            title="Sintonize a carga real para simular fadiga no mapa de calor!"
          />
          <span className="text-[10px] font-bold font-mono w-10 text-right" style={{ color: muscleColor }}>
            {activeWeight}kg
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Real-time bar showing cycle stage */}
          <div className="flex-1 max-w-[100px] hidden md:block">
            <div className="w-20 bg-neutral-900 rounded-full h-1 border border-neutral-800 overflow-hidden">
              <div 
                className="bg-[#39FF14] h-full transition-all duration-75"
                style={{ width: `${tick}%` }}
              />
            </div>
          </div>

          <button 
            onClick={() => {
              setTick(0);
              setIsPlaying(true);
            }}
            className="p-1 px-1.5 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer text-[8px] font-mono uppercase tracking-wider flex items-center gap-1"
            title="Reiniciar repetição"
          >
            <RefreshCw size={8} /> Reiniciar
          </button>
        </div>
      </div>

    </div>
  );
}
