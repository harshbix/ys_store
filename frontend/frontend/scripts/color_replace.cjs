const fs = require('fs');

let c = fs.readFileSync('d:/projects/ys_store/frontend/src/components/builder/PresetSelector.tsx', 'utf8');

c = c.replace(/border-danger\/30 bg-danger\/5 text-danger/g, 'border-destructive/30 bg-destructive/10 text-destructive');
c = c.replace(/text-danger/g, 'text-destructive');
c = c.replace(/bg-blue-[0-9]+ dark:bg-blue-[0-9]+/g, 'bg-primary');
c = c.replace(/bg-blue-[0-9]+ hover:bg-blue-[0-9]+ active:bg-blue-[0-9]+ dark:bg-blue-[0-9]+ dark:hover:bg-blue-[0-9]+/g, 'bg-primary hover:bg-primary/90');
c = c.replace(/text-blue-[0-9]+ dark:text-blue-[0-9]+/g, 'text-primary');
c = c.replace(/border-blue-[0-9]+ dark:hover:border-blue-[0-9]+/g, 'border-primary/50 hover:border-primary');
c = c.replace(/shadow-lg dark:hover:shadow-blue-[0-9]+\/[0-9]+/g, 'shadow-lg');

c = c.replace(/bg-slate-[0-9]+ dark:bg-slate-[0-9]+(\/[0-9]+)?/g, 'bg-muted');
c = c.replace(/bg-white dark:bg-slate-[0-9]+/g, 'bg-card');
c = c.replace(/bg-white dark:bg-background/g, 'bg-card');

c = c.replace(/text-slate-300 dark:text-slate-600/g, 'text-muted-foreground');
c = c.replace(/text-slate-[0-9]+ dark:text-slate-[0-9]+/g, 'text-muted-foreground');
c = c.replace(/text-slate-[0-9]+/g, 'text-muted-foreground');

c = c.replace(/border-slate-[0-9]+ dark:border-slate-[0-9]+(\/[0-9]+)?/g, 'border-border');
c = c.replace(/border-slate-[0-9]+/g, 'border-border');

c = c.replace(/hover:bg-slate-[0-9]+ dark:hover:bg-slate-[0-9]+(\/[0-9]+)?/g, 'hover:bg-accent');
c = c.replace(/active:bg-slate-[0-9]+ dark:active:bg-slate-[0-9]+/g, 'active:bg-accent');
c = c.replace(/ring-blue-[0-9]+/g, 'ring-ring');

c = c.replace(/text-muted-foreground font-semibold text-foreground/g, 'font-semibold text-foreground'); 
c = c.replace(/text-muted-foreground text-foreground/g, 'text-foreground');

fs.writeFileSync('d:/projects/ys_store/frontend/src/components/builder/PresetSelector.tsx', c);
