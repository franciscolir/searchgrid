import { useState, useEffect } from 'preact/hooks';
import Dashboard from './components/Dashboard';
import Searcher from './components/Searcher';
import './style.css';

export default function App() {
  const [path, setPath] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = (p: string) => {
    window.history.pushState(null, '', p);
    setPath(p);
  };

  const parts = path.split('/').filter(Boolean);
  const base = parts[0] || '';
  const id = parts[1] || '';

  if (base === 'dashboard') return <Dashboard id={id} />;
  if (base === 'searcher') return <Searcher id={id} />;

  return (
    <div class="home">
      <h1>SearchGrid</h1>
      <p>Coordinador de búsqueda offline-first</p>
      <div class="home-nav">
        <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} class="btn btn-primary">
          Dashboard (Coordinador)
        </a>
        <a href="/searcher" onClick={(e) => { e.preventDefault(); navigate('/searcher'); }} class="btn btn-secondary">
          Buscador (Terreno)
        </a>
      </div>
    </div>
  );
}
