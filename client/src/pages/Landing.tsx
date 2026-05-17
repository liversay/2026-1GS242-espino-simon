import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Landing() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'frost-particle';
      particle.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        width: ${2 + Math.random() * 4}px;
        height: ${2 + Math.random() * 4}px;
        background: ${Math.random() > 0.5 ? '#00f5ff' : '#22d3ee'};
        border-radius: 50%;
        opacity: ${0.1 + Math.random() * 0.2};
        filter: blur(1px);
        animation: frostFloat ${15 + Math.random() * 20}s linear infinite;
        animation-delay: ${Math.random() * 10}s;
      `;
      canvasRef.current.appendChild(particle);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="midnight-bg">
      <div ref={canvasRef} className="particles-container" style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }} />
      
      <div className="content-area flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          <div className="glass-frost p-14 animate-reveal">
            <div className="text-center mb-14">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-10 animate-float-gentle animate-glow-pulse" style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0.04) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                boxShadow: '0 20px 60px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}>
                <svg className="w-14 h-14" style={{ color: '#00f5ff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              
              <h1 className="font-display text-7xl font-bold mb-5 text-gradient-frost">
                PollClass
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-medium)' }}>
                Encuestas en Vivo para el Aula
              </p>
            </div>

            <div className="space-y-5">
              <Link
                to="/professor"
                className="btn-frost flex items-center gap-6 p-7 rounded-2xl group"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(6, 182, 212, 0.2)'
                }}>
                  <svg className="w-8 h-8" style={{ color: '#00f5ff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xl font-semibold block">Soy Profesor</span>
                  <span className="text-sm" style={{ color: 'var(--text-medium)' }}>Crear encuestas y ver resultados</span>
                </div>
                <svg className="w-6 h-6 opacity-50 group-hover:translate-x-2 group-hover:opacity-80 transition-all" style={{ color: '#00f5ff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/student"
                className="btn-frost btn-frost-emerald flex items-center gap-6 p-7 rounded-2xl group"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(16, 185, 129, 0.2)'
                }}>
                  <svg className="w-8 h-8" style={{ color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xl font-semibold block">Soy Estudiante</span>
                  <span className="text-sm" style={{ color: 'var(--text-medium)' }}>Unirme y votar en encuestas</span>
                </div>
                <svg className="w-6 h-6 opacity-50 group-hover:translate-x-2 group-hover:opacity-80 transition-all" style={{ color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="mt-16 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-center gap-12" style={{ color: 'var(--text-dim)' }}>
                <span className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 10px rgba(52,211,153,0.6)' }} />
                  Tiempo Real
                </span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#00f5ff', boxShadow: '0 0 10px rgba(0,245,255,0.6)' }} />
                  Mobile First
                </span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.6)' }} />
                  Sin Registro
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes frostFloat {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
