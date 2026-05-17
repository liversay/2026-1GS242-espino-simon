import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPolls, createPoll, closePoll, deletePoll } from '../services/api';

interface Poll {
  _id: string;
  title: string;
  code: string;
  status: string;
  options: { text: string; votes: number }[];
  createdAt: string;
}

export default function Professor() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const data = await getPolls();
      setPolls(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) {
      setError('Título y al menos 2 opciones son requeridos');
      return;
    }

    setLoading(true);
    try {
      await createPoll(title, validOptions);
      setTitle('');
      setOptions(['', '']);
      loadPolls();
    } catch {
      setError('Error creando encuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePoll = async (id: string) => {
    await closePoll(id);
    loadPolls();
  };

  const handleDeletePoll = async (id: string) => {
    await deletePoll(id);
    loadPolls();
  };

  const activePolls = polls.filter(p => p.status === 'active');
  const closedPolls = polls.filter(p => p.status === 'closed');

  return (
    <div className="midnight-bg">
      <div className="content-area max-w-4xl mx-auto px-4 py-8 pb-20 overflow-y-auto" style={{ height: '100vh' }}>
        <div className="flex items-center justify-between mb-12 animate-reveal">
          <Link 
            to="/" 
            className="btn-frost px-6 py-3 flex items-center gap-3 text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
          <h1 className="font-display text-2xl font-bold text-gradient-frost">Panel del Profesor</h1>
          <div className="w-20" />
        </div>

        <div className="glass-frost p-10 mb-10 animate-reveal delay-100">
          <div className="flex items-center gap-5 mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
              boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)'
            }}>
              <svg className="w-7 h-7" style={{ color: '#00f5ff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-bright)' }}>
              Crear Nueva Encuesta
            </h2>
          </div>
          
          <form onSubmit={handleCreatePoll}>
            <div className="mb-8">
              <label className="block text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
                Título de la Pregunta
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Qué opinión tienes sobre...?"
                className="w-full input-frost px-7 py-5 text-base"
              />
            </div>

            <div className="mb-8">
              <label className="block text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
                Opciones de Respuesta
              </label>
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold" style={{ 
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'var(--text-dim)'
                    }}>
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1 input-frost px-6 py-4"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:bg-rose-500/20"
                        style={{ color: '#f43f5e' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-5 text-sm font-medium flex items-center gap-3 transition-opacity hover:opacity-80"
                style={{ color: '#00f5ff' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar opción
              </button>
            </div>

            {error && (
              <div className="mb-6 p-5 rounded-xl" style={{ 
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.2)'
              }}>
                <p className="text-sm text-center" style={{ color: '#f43f5e' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-frost w-full py-5 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creando...
                </span>
              ) : 'Crear Encuesta'}
            </button>
          </form>
        </div>

        {activePolls.length > 0 && (
          <div className="mb-10 animate-reveal delay-200">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6 flex items-center gap-4" style={{ color: 'var(--text-dim)' }}>
              <span className="w-4 h-4 rounded-full" style={{ 
                background: '#34d399', 
                boxShadow: '0 0 16px rgba(52, 211, 153, 0.6)' 
              }} />
              Encuestas Activas
            </h2>
            <div className="grid gap-6">
              {activePolls.map((poll) => (
                <div key={poll._id} className="glass-frost p-7">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>{poll.title}</h3>
                      <div className="flex items-center gap-5">
                        <span className="badge-frost badge-frost-active">
                          <span className="dot" />
                          Activa
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{poll.options.length} opciones</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="code-frost text-4xl" style={{ color: '#f59e0b' }}>{poll.code}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6 flex-wrap">
                    <button
                      onClick={() => navigate(`/professor/poll/${poll._id}`)}
                      className="btn-frost px-6 py-3 text-sm font-medium"
                      style={{ color: '#00f5ff' }}
                    >
                      Ver Resultados
                    </button>
                    <button
                      onClick={() => handleClosePoll(poll._id)}
                      className="btn-frost btn-frost-amber px-6 py-3 text-sm font-medium"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={() => handleDeletePoll(poll._id)}
                      className="btn-frost px-6 py-3 text-sm font-medium"
                      style={{ color: '#f43f5e' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {closedPolls.length > 0 && (
          <div className="animate-reveal delay-300">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6 flex items-center gap-4" style={{ color: 'var(--text-dim)' }}>
              <span className="w-4 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
              Encuestas Cerradas
            </h2>
            <div className="grid gap-4">
              {closedPolls.map((poll) => (
                <div key={poll._id} className="glass-frost p-6 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--text-medium)' }}>{poll.title}</h3>
                      <span className="text-xs mt-1 inline-block" style={{ color: 'var(--text-dim)' }}>Cerrada</span>
                    </div>
                    <button
                      onClick={() => handleDeletePoll(poll._id)}
                      className="btn-frost px-5 py-2.5 text-sm font-medium"
                      style={{ color: '#f43f5e' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {polls.length === 0 && (
          <div className="glass-frost p-16 text-center animate-reveal delay-200">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
              <svg className="w-12 h-12" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p style={{ color: 'var(--text-dim)' }}>No hay encuestas creadas</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-faint)' }}>Crea tu primera encuesta arriba</p>
          </div>
        )}
      </div>
    </div>
  );
}
