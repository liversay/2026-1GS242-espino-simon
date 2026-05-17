import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPollResults, closePoll } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PollResult {
  _id: string;
  title: string;
  options: { text: string; votes: number }[];
  status: string;
  code: string;
  totalVotes: number;
  votes: { voterName: string; optionIndex: number }[];
}

const COLORS = ['#00f5ff', '#22d3ee', '#34d399', '#f59e0b', '#f43f5e', '#a855f7'];

export default function ProfessorPoll() {
  const { id } = useParams();
  const [poll, setPoll] = useState<PollResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
    const interval = setInterval(loadResults, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const loadResults = async () => {
    if (!id) return;
    try {
      const data = await getPollResults(id);
      setPoll(data);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const handleClose = async () => {
    await closePoll(id!);
    loadResults();
  };

  const copyCode = () => {
    if (poll?.code) {
      navigator.clipboard.writeText(poll.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="midnight-bg">
        <div className="content-area min-h-screen flex items-center justify-center">
          <div className="glass-frost p-12 text-center animate-reveal">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center animate-glow-pulse" style={{ background: 'rgba(0,245,255,0.1)' }}>
              <svg className="w-8 h-8 animate-spin" style={{ color: '#00f5ff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="mt-6" style={{ color: 'var(--text-medium)' }}>Cargando resultados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="midnight-bg">
        <div className="content-area min-h-screen flex items-center justify-center">
          <div className="glass-frost p-12 text-center">
            <p style={{ color: 'var(--text-medium)' }}>Encuesta no encontrada</p>
            <Link to="/professor" className="text-sm mt-4 inline-block font-medium" style={{ color: '#00f5ff' }}>
              Volver al panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const chartData = poll.options.map((opt, idx) => ({
    name: opt.text,
    votes: opt.votes,
    fill: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="midnight-bg">
      <div className="content-area max-w-4xl mx-auto px-4 py-8 pb-20 overflow-y-auto" style={{ height: '100vh' }}>
        <div className="flex items-center justify-between mb-12 animate-reveal">
          <Link to="/professor" className="btn-frost px-6 py-3 flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
          <h1 className="font-display text-xl font-bold text-gradient-frost">Resultados</h1>
          <div className="w-20" />
        </div>

        <div className="glass-frost p-10 mb-8 animate-reveal delay-100">
          <h2 className="font-display text-3xl font-bold mb-10" style={{ color: 'var(--text-bright)' }}>{poll.title}</h2>
          
          <div className="glass-frost p-10 mb-10 animate-glow-pulse" style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.15)'
          }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-center mb-6" style={{ color: 'var(--text-dim)' }}>
              Código para Estudiantes
            </p>
            <div className="flex items-center justify-center gap-6">
              <span className="code-frost text-8xl" style={{ 
                color: '#f59e0b',
                textShadow: '0 0 30px rgba(245, 158, 11, 0.6), 0 0 60px rgba(245, 158, 11, 0.3)'
              }}>
                {poll.code}
              </span>
              <button
                onClick={copyCode}
                className="btn-frost px-6 py-4 text-sm font-medium"
              >
                {copied ? (
                  <span className="flex items-center gap-2" style={{ color: '#34d399' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <span className={`badge-frost ${poll.status === 'active' ? 'badge-frost-active' : 'badge-frost-closed'}`}>
                {poll.status === 'active' && <span className="dot" />}
                {poll.status === 'active' ? 'Activa' : 'Cerrada'}
              </span>
              <div className="text-center">
                <span className="font-display text-4xl font-bold" style={{ color: 'var(--text-bright)' }}>{poll.totalVotes}</span>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>votos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-dim)' }}>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animationDuration: '3s', color: '#00f5ff' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizando cada 3s
            </div>
          </div>

          {poll.status === 'active' && (
            <button
              onClick={handleClose}
              className="btn-frost btn-frost-amber mt-10 px-10 py-4 font-semibold w-full sm:w-auto"
            >
              Cerrar Encuesta
            </button>
          )}
        </div>

        <div className="glass-frost p-8 mb-8 animate-reveal delay-200">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-dim)' }}>
            Distribución de Respuestas
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <XAxis 
                  type="number" 
                  stroke="rgba(255,255,255,0.15)" 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.15)" 
                  width={150} 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Manrope' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 10, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 245, 255, 0.2)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 245, 255, 0.1)'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 600, fontFamily: 'Syne' }}
                  itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  cursor={{ fill: 'rgba(0, 245, 255, 0.05)' }}
                />
                <Bar dataKey="votes" radius={[0, 12, 12, 0]} maxBarSize={52}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-frost p-8 animate-reveal delay-300">
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-dim)' }}>
            Votos Registrados
          </h3>
          
          {poll.votes.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-10 h-10" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p style={{ color: 'var(--text-dim)' }}>Aún no hay votos</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>Comparte el código con tus estudiantes</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {poll.votes.map((vote, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-5 rounded-2xl"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)'
                  }}
                >
                  <div className="flex items-center gap-5">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                      style={{ background: COLORS[poll.options[vote.optionIndex] ? vote.optionIndex : 0] }}
                    >
                      {vote.voterName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ color: 'var(--text-bright)' }}>{vote.voterName}</span>
                  </div>
                  <span 
                    className="text-sm font-semibold px-4 py-2 rounded-full"
                    style={{ 
                      color: COLORS[poll.options[vote.optionIndex] ? vote.optionIndex : 0],
                      background: `${COLORS[poll.options[vote.optionIndex] ? vote.optionIndex : 0]}15`
                    }}
                  >
                    {poll.options[vote.optionIndex]?.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
