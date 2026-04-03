import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="space-y-32 pb-32 animate-fade-in">
      <section className="relative h-[80vh] flex flex-col justify-end p-12 bg-surface overflow-hidden rounded-md group">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-[10s]">
          <source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-computer-components-loop-97812-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
        
        <div className="relative z-20 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight mb-6 text-white uppercase">
            Superior Gaming Hardware
          </h1>
          <p className="text-xl md:text-2xl font-light text-white/70 mb-10 max-w-2xl leading-relaxed">
            The destination for custom builds and premium components in Dar es Salaam.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link 
              to="/shop" 
              className="bg-white hover:bg-gray-200 text-black px-10 py-5 uppercase tracking-widest text-sm font-bold transition-colors shadow-2xl flex items-center justify-center gap-3"
            >
              Shop Collection <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/builder" 
              className="border border-white/20 hover:border-white text-white bg-black/50 backdrop-blur-md px-10 py-5 uppercase tracking-widest text-sm font-bold transition-colors"
            >
              Build Custom PC
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between border-b border-border pb-6 mb-12">
          <h2 className="text-3xl font-light tracking-tight uppercase">Featured Categories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { tag: 'Pre-Builds', img: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80' },
            { tag: 'Processors', img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80' },
            { tag: 'Graphics Cards', img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80' },
            { tag: 'Peripherals', img: 'https://images.unsplash.com/photo-1605773527852-c546a8584ea3?w=800&q=80' }
          ].map((cat, i) => (
            <Link to={`/shop?category=${cat.tag.toLowerCase()}`} key={i} className="group cursor-pointer">
               <div className="aspect-square bg-surface mb-6 overflow-hidden flex items-center justify-center p-8 rounded-sm relative">
                 <img src={cat.img} alt={cat.tag} className="object-cover w-full h-full mix-blend-hard-light group-hover:scale-110 transition-transform duration-700 opacity-60" />
               </div>
               <h3 className="uppercase tracking-widest font-bold text-sm group-hover:text-muted transition-colors flex items-center justify-between">
                 {cat.tag} <ArrowRight className="w-4 h-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
               </h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surfaceElevated p-16 md:p-24 text-center rounded-sm border border-border border-dashed">
        <h2 className="text-3xl lg:text-4xl font-light mb-6 uppercase tracking-widest leading-tight w-3/4 mx-auto break-words">Precision Assembled Custom Builds</h2>
        <p className="text-muted text-lg uppercase tracking-wider mb-10 text-wrap w-2/3 mx-auto">Expertly curated parts matching perfectly. Zero bottlenecks.</p>
        <Link to="/builder" className="inline-flex border-b border-white hover:text-muted hover:border-muted pb-1 uppercase tracking-widest font-bold text-sm transition-all pb-1 items-center justify-center gap-2">Start Builder Engine <ArrowRight className="w-4 h-4" /></Link>
      </section>
    </div>
  );
};