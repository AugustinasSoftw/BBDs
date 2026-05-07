"use client";

import { useState } from "react";
import WindTurbineScene from "./components/WindTurbineModel";

export default function WindTurbineDashboard() {
  const [angle, setAngle] = useState(0);
  const espIP = "192.168.68.113";

  const sendAngleToESP = async (value: number) => {
    try {
      await fetch(`http://${espIP}/setAngle?val=${value}`);
    } catch (error) {
      console.error("Ryšio klaida:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <h1 className="text-3xl font-extrabold text-cyan-400">
            Wind Turbine Digital Twin
          </h1>
          <div className="text-sm px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
            ESP32 IP: {espIP}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D VIZUALIZACIJA */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-slate-300">
              Live 3D Twin
            </h2>
            {/* PERDUODAME TIK ANGLE */}
            <WindTurbineScene angle={angle} />
          </div>

          {/* VALDYMO PULTAS */}
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold mb-8 text-center text-cyan-400">
              Rankinis valdymas
            </h3>
            <div className="flex flex-col items-center gap-10 w-full">
              <div className="relative w-40 h-40 flex items-center justify-center border-4 border-slate-700 rounded-full bg-slate-900/50">
                <span className="text-5xl font-mono text-cyan-400">
                  {angle}°
                </span>
              </div>
              <div className="w-full space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-500">
                  Pasukti jėgainę
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angle}
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                  onMouseUp={() => sendAngleToESP(angle)}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
