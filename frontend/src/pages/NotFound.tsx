import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center">
      <h1 className="text-9xl font-light mb-4 tracking-tighter">404</h1>
      <p className="text-xl text-muted mb-12 uppercase tracking-widest">Page Cannot Be Found</p>
      <Link 
        to="/"
        className="bg-white text-black px-12 py-5 uppercase tracking-widest text-sm font-bold hover:bg-gray-200 transition-colors"
      >
        Return to Hardware
      </Link>
    </div>
  );
};