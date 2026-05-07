"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import WindTurbineScene from "./components/WindTurbineModel";

// --- INFLUXDB CLOUD CREDENTIALS ---
const INFLUX_URL =
  "https://eu-central-1-1.aws.cloud2.influxdata.com/api/v2/query?org=BBD";
const INFLUX_TOKEN =
  "S00vfLTsHtpgVh7NsHnJSdjBDxy8SZcEkewHpwnB99sbbqTI-jAST2K45xzno8nCxHqrv2b8vWGmYKmdfv4zbw==";

const fluxQuery = `
  from(bucket: "turbine_data")
    |> range(start: -60s)
    |> filter(fn: (r) => r._measurement == "vibration")
    |> last()
`;

export default function WindTurbineDashboard() {
  const [angle, setAngle] = useState(0);
  const [vibrationData, setVibrationData] = useState<any[]>([]);

  // The ESP32 IP is still required to send motor commands
  const espIP = "192.168.68.111";

  // Motor Control -> Sends directly to ESP32
  const sendAngleToESP = async (value: number) => {
    try {
      await fetch(`http://${espIP}/setAngle?val=${value}`);
    } catch (error) {
      console.error("Ryšio klaida:", error);
    }
  };

  // Telemetry Fetch -> Pulls directly from InfluxDB Cloud
  useEffect(() => {
    const fetchVibration = async () => {
      try {
        const response = await fetch(INFLUX_URL, {
          method: "POST",
          headers: {
            Authorization: `Token ${INFLUX_TOKEN}`,
            "Content-Type": "application/vnd.flux",
            Accept: "application/csv",
          },
          body: fluxQuery,
        });

        const csvData = await response.text();
        let latestData = { x: 0, y: 0, z: 0 };

        // Parse InfluxDB CSV format
        const lines = csvData.split("\n");
        lines.forEach((line) => {
          const cols = line.split(",");
          for (let i = 0; i < cols.length; i++) {
            if (cols[i] === "accelX") latestData.x = parseFloat(cols[i - 1]);
            if (cols[i] === "accelY") latestData.y = parseFloat(cols[i - 1]);
            if (cols[i] === "accelZ") latestData.z = parseFloat(cols[i - 1]);
          }
        });

        // Only update the graph if we actually retrieved valid data
        if (latestData.z !== 0 || latestData.x !== 0) {
          const newDataPoint = {
            time: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            x: Number(latestData.x.toFixed(2)),
            y: Number(latestData.y.toFixed(2)),
            z: Number(latestData.z.toFixed(2)),
          };

          setVibrationData((prevData) => [
            ...prevData.slice(-19),
            newDataPoint,
          ]);
        }
      } catch (error) {
        // Silently fail if cloud doesn't respond
      }
    };

    const interval = setInterval(fetchVibration, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <h1 className="text-3xl font-extrabold text-cyan-400">
            Wind Turbine Digital Twin
          </h1>
          <div className="text-sm px-4 py-2 bg-slate-800 rounded-full border border-slate-700 text-cyan-400 font-mono">
            ESP32 IP: {espIP}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D VIZUALIZACIJA */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-slate-300">
              Live 3D Twin
            </h2>
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

        {/* CLOUD VIBRATION TELEMETRY */}
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 mt-8">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">
            Cloud Data Pipeline (AWS InfluxDB)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vibrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="x"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="X-Axis (m/s²)"
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Y-Axis (m/s²)"
                />
                {/*<Line type="monotone" dataKey="z" stroke="#22c55e" strokeWidth={2} dot={false} name="Z-Axis (m/s²)" />*/}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
