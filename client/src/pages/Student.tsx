import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPollByCode, vote, getPollResults } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Poll {
  _id: string;
  title: string;
  options: { text: string; votes: number }[];
  status: string;
  code: string;
}

const COLORS = ['#00f5ff', '#22d3ee', '#34d399', '#f59e0b', '#f43f5e', '#a855f7'];

type View = 'join' | 'vote' | 'results';

export default function Student() {
  const [view, setView] = useState<View>('join');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code.trim() || !name.trim()) {
      setError('Código y nombre son requeridos');
      return;
    }

    setLoading(true);
    try {
      const data = await getPollByCode(code.trim().toUpperCase());
      
      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.status === 'closed') {
        setError('Esta encuesta está cerrada');
        return;
      }

      setPoll(data);
      setView('vote');
    } catch {
      setError('Encuesta no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null || !poll) return;
    
    setError('');
    setLoading(true);
    try {
      const data = await vote(poll._id, selectedOption, name);
      
      if (data.error) {
        if (data.error.includes('Ya has votado')) {
          setError('Ya has votado en esta encuesta');
        } else {
          setError(data.error);
        }
        return;
      }

      setView('results');
    } catch {
      setError('Error al votar');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'results' && poll) {
    return <StudentResults pollId={poll._id} pollTitle={poll.title} pollCode={poll.code} />;
  }

  return (
    <div className="midnight-bg">
      <div className="content-area h-screen overflow-y-auto flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="glass-frost p-12 animate-reveal">
            <div className="flex items-center justify-between mb-12">
              <h1 className="font-display text-3xl font-bold text-gradient-frost">Unirse</h1>
              <Link to="/" className="btn-frost p-3" style={{ color: 'var(--text-dim)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>

            {view === 'join' && (
              <form onSubmit={handleJoin} className="space-y-8">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
                    Código de Encuesta
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full input-frost px-8 py-6 text-4xl text-center font-mono tracking-widest uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
                    Tu Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                    className="w-full input-frost px-6 py-5"
                  />
                </div>

                {error && (
                  <div className="p-5 rounded-xl" style={{ 
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.2)'
                  }}>
                    <p className="text-sm text-center" style={{ color: '#f43f5e' }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-frost btn-frost-emerald w-full py-5 text-base font-semibold"
                >
                  {loading ? 'Buscando...' : 'Unirme a la Encuesta'}
                </button>
              </form>
            )}

            {view === 'vote' && poll && (
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-bright)' }}>{poll.title}</h2>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Selecciona tu respuesta</p>
                </div>

                <div className="space-y-4">
                  {poll.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(index)}
                      className={`w-full p-6 rounded-2xl text-left transition-all duration-300 ${
                        selectedOption === index ? 'ring-2' : ''
                      }`}
                      style={{
                        background: selectedOption === index 
                          ? `linear-gradient(135deg, ${COLORS[index % COLORS.length]}15 0%, ${COLORS[index % COLORS.length]}08 100%)`
                          : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                        border: `2px solid ${selectedOption === index ? COLORS[index % COLORS.length] : 'transparent'}`,
                        boxShadow: selectedOption === index ? `0 0 30px ${COLORS[index % COLORS.length]}30, 0 8px 24px rgba(0,0,0,0.3)` : '0 4px 16px rgba(0,0,0,0.2)'
                      }}
                    >
                      <span className="flex items-center gap-5">
                        <span 
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: selectedOption === index ? COLORS[index % COLORS.length] : 'transparent',
                            border: `2px solid ${selectedOption === index ? COLORS[index % COLORS.length] : 'rgba(255,255,255,0.2)'}`,
                            boxShadow: selectedOption === index ? `0 0 15px ${COLORS[index % COLORS.length]}60` : 'none'
                          }}
                        >
                          {selectedOption === index && (
                            <span className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </span>
                        <span className="font-medium text-lg" style={{ color: 'var(--text-bright)' }}>{option.text}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="p-5 rounded-xl" style={{ 
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.2)'
                  }}>
                    <p className="text-sm text-center" style={{ color: '#f43f5e' }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVote}
                  disabled={selectedOption === null || loading}
                  className="btn-frost btn-frost-emerald w-full py-5 text-base font-semibold disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Confirmar Voto'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentResults({ pollId, pollTitle, pollCode }: { pollId: string; pollTitle: string; pollCode: string }) {
  const [poll, setPoll] = useState<any>(null);

  useEffect(() => {
    loadResults();
    const interval = setInterval(loadResults, 5000);
    return () => clearInterval(interval);
  }, [pollId]);

  const loadResults = async () => {
    try {
      const data = await getPollResults(pollId);
      setPoll(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (!poll) {
    return (
      <div className="midnight-bg">
        <div className="content-area min-h-screen flex items-center justify-center">
          <div className="glass-frost p-12">
            <p style={{ color: 'var(--text-medium)' }}>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = poll.votes?.length || 0;
  const chartData = poll.options.map((opt: any, idx: number) => ({
    name: opt.text,
    votes: opt.votes,
    percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
    fill: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="midnight-bg">
      <div className="content-area max-w-lg mx-auto px-4 py-8 pb-16 overflow-y-auto" style={{ height: '100vh' }}>
        <div className="glass-frost p-12 text-center mb-8 animate-reveal">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center animate-glow-pulse"
            style={{ 
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.08) 100%)',
              boxShadow: '0 8px 40px rgba(52, 211, 153, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <svg className="w-12 h-12" style={{ color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient-frost mb-3">¡Gracias por participar!</h1>
          <p className="text-base mb-2" style={{ color: 'var(--text-medium)' }}>{pollTitle}</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Tu voto fue enviado correctamente. Estos son los resultados generales hasta ahora.
          </p>
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Código:</span>
            <span className="code-frost text-2xl" style={{ color: '#f59e0b' }}>{pollCode}</span>
          </div>
        </div>

        <div className="glass-frost p-8 mb-6 animate-reveal delay-100">
          <div className="text-center mb-6">
            <span className="font-display text-6xl font-bold" style={{ color: 'var(--text-bright)' }}>{totalVotes}</span>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>votos totales</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis 
                  type="number" 
                  stroke="rgba(255,255,255,0.15)" 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.15)" 
                  width={100} 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Manrope' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 10, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 245, 255, 0.2)',
                    borderRadius: '14px'
                  }}
                  formatter={(value: number, _name, props: any) => [`${value} votos (${props.payload.percentage}%)`, 'Resultado']}
                />
                <Bar dataKey="votes" radius={[0, 10, 10, 0]} maxBarSize={36}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-center text-xs mt-2 animate-reveal delay-300" style={{ color: 'var(--text-faint)' }}>
          Gracias por tu participación. Los resultados se actualizan cada 5 segundos.
        </p>
      </div>
    </div>
  );
}
