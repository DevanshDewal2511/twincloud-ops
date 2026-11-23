import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Server, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Radio, 
  Clock, 
  ExternalLink, 
  Flame, 
  Zap, 
  Database,
  RotateCw,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillMessage, setDrillMessage] = useState(null);
  const [demoKey, setDemoKey] = useState(sessionStorage.getItem('twincloud_demo_key') || 'twincloud-demo-2026');
  const [isEditingKey, setIsEditingKey] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const [statusRes, metricsRes, incidentsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/metrics'),
        fetch('/api/incidents')
      ]);

      if (!statusRes.ok) throw new Error(`API error: ${statusRes.status}`);

      const statusData = await statusRes.json();
      const metricsData = await metricsRes.json();
      const incidentsData = await incidentsRes.json();

      setStatus(statusData);
      setMetrics(metricsData);
      setIncidents(incidentsData);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleKeyChange = (newKey) => {
    setDemoKey(newKey);
    sessionStorage.setItem('twincloud_demo_key', newKey);
  };

  const triggerDrill = async (action, node = 'aws-primary') => {
    setDrillLoading(true);
    setDrillMessage(null);
    try {
      const endpoint = action === 'outage' ? '/api/simulate/outage' : '/api/simulate/recover';
      const res = await fetch(`${endpoint}?node=${encodeURIComponent(node)}`, { 
        method: 'POST',
        headers: {
          'X-Demo-Key': demoKey || '',
        }
      });

      if (res.status === 401) {
        setDrillMessage({
          type: 'error',
          text: '🔒 Unauthorized: Enter a valid Demo Key in the key badge to trigger disaster recovery controls.'
        });
        setIsEditingKey(true);
        return;
      }

      if (res.status === 429) {
        setDrillMessage({
          type: 'warning',
          text: '⏳ Rate limit exceeded: Please wait 2 seconds between drill commands.'
        });
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Action failed with HTTP status ${res.status}`);
      }

      const data = await res.json();
      setDrillMessage({
        type: action === 'outage' ? 'warning' : 'success',
        text: action === 'outage' 
          ? '🚨 Outage simulated on AWS Primary! Failover to Azure Secondary triggered.' 
          : '✅ Recovery initiated on AWS Primary! Traffic restoring to primary.'
      });
      await fetchTelemetry();
    } catch (err) {
      setDrillMessage({ type: 'error', text: err.message });
    } finally {
      setDrillLoading(false);
      setTimeout(() => setDrillMessage(null), 6000);
    }
  };

  const awsNode = status?.nodes?.['aws-primary'];
  const azureNode = status?.nodes?.['azure-secondary'];
  const proxyNode = status?.nodes?.['proxy'];
  const activeTarget = status?.active_routing_target;

  const isAwsActive = activeTarget === 'aws-primary';
  const isAzureActive = activeTarget === 'azure-secondary';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Navigation Bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-amber-500/10">
              <Cloud className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">TwinCloud Ops</h1>
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  v1.2.0 Demo Ready
                </span>
                <span className="text-xs bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Database className="w-3 h-3" /> PostgreSQL
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400">
                Zero-Cost Multi-Cloud Disaster Recovery Simulation Platform (AWS ⇄ Azure)
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Demo Key Auth Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            {isEditingKey ? (
              <input
                type="password"
                value={demoKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                onBlur={() => setIsEditingKey(false)}
                placeholder="Enter Demo Key"
                autoFocus
                className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-amber-400 w-32"
              />
            ) : (
              <button 
                onClick={() => setIsEditingKey(true)}
                title="Click to change Demo Control Key"
                className="text-slate-300 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
              >
                Key: {demoKey ? '••••••••' : 'None'}
              </button>
            )}
          </div>

          {/* Overall Health Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider backdrop-blur-md"
            style={{
              backgroundColor: status?.overall_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: status?.overall_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              color: status?.overall_status === 'HEALTHY' ? '#34d399' : '#f87171'
            }}>
            <span className={`w-2.5 h-2.5 rounded-full ${status?.overall_status === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500 animate-ping'}`} />
            {status?.overall_status || 'CONNECTING...'}
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRefresh 
                ? 'bg-slate-800 border-emerald-500/40 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-400' : ''}`} />
            {autoRefresh ? 'Live (3s)' : 'Paused'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchTelemetry}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </header>

      {/* Drill Feedback Banner */}
      {drillMessage && (
        <div className={`max-w-7xl mx-auto mt-4 p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
          drillMessage.type === 'warning' 
            ? 'bg-amber-950/80 border-amber-600/50 text-amber-300' 
            : drillMessage.type === 'error'
            ? 'bg-red-950/80 border-red-600/50 text-red-300'
            : 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
        }`}>
          <span>{drillMessage.text}</span>
          <button onClick={() => setDrillMessage(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto mt-6 space-y-6">

        {/* Global Key Metrics Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Platform Availability</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {metrics ? `${metrics.availability_percentage}%` : '--'}
              </span>
              <span className="text-xs text-slate-500">{metrics?.total_probes || 0} probes</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Avg Ingress Latency</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {metrics ? `${metrics.average_latency_ms} ms` : '--'}
              </span>
              <span className="text-xs text-slate-500">rolling avg</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Active Incidents</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${metrics?.active_incidents_count > 0 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                {metrics ? metrics.active_incidents_count : '--'}
              </span>
              <span className="text-xs text-slate-500">unresolved</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Drills & Events</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {metrics ? metrics.total_incidents_count : '--'}
              </span>
              <span className="text-xs text-slate-500">{metrics?.resolved_incidents_count || 0} in PostgreSQL</span>
            </div>
          </div>
        </section>

        {/* Interactive One-Click Disaster Recovery Drill Control Center */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">Disaster Recovery Drill Command Center</h2>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Protected Endpoint
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Execute controlled multi-cloud chaos simulations with automatic failover tracking and RTO recording.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled={drillLoading || awsNode?.status === 'UNREACHABLE'}
                onClick={() => triggerDrill('outage', 'aws-primary')}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Trigger AWS Outage
              </button>

              <button
                disabled={drillLoading || awsNode?.status === 'HEALTHY'}
                onClick={() => triggerDrill('recover', 'aws-primary')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Trigger Recovery
              </button>
            </div>
          </div>
        </section>

        {/* Live Multi-Cloud Topology Visualizer */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Live Multi-Cloud DR Topology</h2>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5" />
              Last heartbeat: {lastUpdated || 'Connecting...'}
            </div>
          </div>

          {/* Central Traffic Ingress / Proxy */}
          <div className="max-w-md mx-auto mb-8">
            <div className={`p-4 rounded-xl border bg-slate-900 shadow-xl transition-all ${
              proxyNode?.status === 'HEALTHY' ? 'border-cyan-500/40 shadow-cyan-500/5' : 'border-red-500/40'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-sm">Traffic Ingress / Proxy</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                  proxyNode?.status === 'HEALTHY' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-red-950/60 text-red-400'
                }`}>
                  {proxyNode?.status || 'UNKNOWN'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Entry: <a href="/traffic/" target="_blank" rel="noreferrer" className="text-cyan-400 font-mono hover:underline inline-flex items-center gap-1">/traffic/ (Live Proxy) <ExternalLink className="w-2.5 h-2.5" /></a></span>
                <span>Active Upstream: <strong className="text-amber-400 font-mono">{activeTarget || 'Resolving...'}</strong></span>
                <span>Ping: <strong className="text-slate-200 font-mono">{proxyNode?.latency_ms || 0}ms</strong></span>
              </div>
            </div>
          </div>

          {/* Traffic Flow Lines to Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* AWS Primary Node Card */}
            <div className={`rounded-xl border p-5 transition-all relative overflow-hidden bg-slate-900/80 ${
              isAwsActive 
                ? 'border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40' 
                : 'border-slate-800 opacity-80'
            }`}>
              {/* Active Indicator Banner */}
              {isAwsActive && (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[10px] px-3 py-0.5 uppercase tracking-widest rounded-bl-lg flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> Active Target
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded font-bold font-mono">
                      AWS
                    </span>
                    <h3 className="text-base font-bold text-white">Primary Cloud Cluster</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">us-east-1 &bull; Active Primary Environment</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                  awsNode?.status === 'HEALTHY'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-red-950/80 text-red-400 border border-red-800/60'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${awsNode?.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-red-400 animate-ping'}`} />
                  {awsNode?.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Endpoint Route</span>
                  <span className="font-mono text-slate-200 font-semibold">/nodes/aws/</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Probe Latency</span>
                  <span className="font-mono text-emerald-400 font-semibold">{awsNode?.latency_ms || 0} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Health Check</span>
                  <span className="font-mono text-slate-300">GET /health.json</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Failover Priority</span>
                  <span className="font-mono text-amber-400 font-semibold">Tier 1 (Default)</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <a 
                  href="/nodes/aws/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline font-medium"
                >
                  Direct AWS Node <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-500 font-mono text-[11px]">twincloud-aws-primary</span>
              </div>
            </div>

            {/* Azure Secondary Node Card */}
            <div className={`rounded-xl border p-5 transition-all relative overflow-hidden bg-slate-900/80 ${
              isAzureActive 
                ? 'border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40' 
                : 'border-slate-800'
            }`}>
              {/* Active Indicator Banner */}
              {isAzureActive && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white font-bold text-[10px] px-3 py-0.5 uppercase tracking-widest rounded-bl-lg flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> Active DR Target
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2 py-0.5 rounded font-bold font-mono">
                      AZURE
                    </span>
                    <h3 className="text-base font-bold text-white">Secondary Cloud Cluster</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">eastus &bull; Standby DR Target</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                  azureNode?.status === 'HEALTHY'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-red-950/80 text-red-400 border border-red-800/60'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${azureNode?.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-red-400 animate-ping'}`} />
                  {azureNode?.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Endpoint Route</span>
                  <span className="font-mono text-slate-200 font-semibold">/nodes/azure/</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Probe Latency</span>
                  <span className="font-mono text-emerald-400 font-semibold">{azureNode?.latency_ms || 0} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Health Check</span>
                  <span className="font-mono text-slate-300">GET /health.json</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Role</span>
                  <span className="font-mono text-blue-400 font-semibold">Standby (Backup)</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <a 
                  href="/nodes/azure/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline font-medium"
                >
                  Direct Azure Node <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-500 font-mono text-[11px]">twincloud-azure-secondary</span>
              </div>
            </div>

          </div>
        </section>

        {/* Incident & Failover Audit Log */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-semibold text-white">Incident & Failover Audit Log (Stored in PostgreSQL)</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Logged: {incidents.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Target Node</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">RTO / Duration</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No incidents recorded yet. All simulated cloud environments are operating normally.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{inc.id}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.target_node.includes('aws') ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {inc.target_node}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.event_type === 'OUTAGE' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {inc.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          inc.status === 'OPEN' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {inc.status === 'OPEN' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {inc.duration_seconds !== null ? `${inc.duration_seconds}s` : '--'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(inc.start_time).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-sans text-xs" title={inc.details}>
                        {inc.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
        TwinCloud Ops &bull; Zero-Cloud-Cost Multi-Cloud Disaster Recovery Simulation Platform
      </footer>
    </div>
  );
}
