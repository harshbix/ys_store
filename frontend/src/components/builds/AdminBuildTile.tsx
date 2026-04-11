import { m as motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/card';
import { formatTzs } from '../../lib/currency';
import { fadeInUp, TRANSITIONS } from '../../lib/motion';
import type { AdminBuild } from '../../types/admin';

interface AdminBuildTileProps {
  build: AdminBuild;
  onEdit: (build: AdminBuild) => void;
  onDelete: (buildId: string) => void;
}

export function AdminBuildTile({ build, onEdit, onDelete }: AdminBuildTileProps) {
  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -2, scale: 1.003 }} transition={TRANSITIONS.FAST_EASE}>
      <Card className="h-full border-border/80 bg-surface/90 shadow-sm">
        <CardContent className="flex min-h-[252px] flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="line-clamp-2 min-h-[2.4rem] text-sm font-semibold leading-5 text-foreground">{build.name}</p>
              <p className="text-xs text-secondary">{build.cpu_family || 'CPU family not set'}</p>
            </div>
            <Badge variant={build.status === 'featured' ? 'default' : 'secondary'}>{build.status}</Badge>
          </div>

          <div className="space-y-1 text-xs text-secondary">
            <p>Preset ID: {build.id}</p>
            <p>Components: {build.pc_build_preset_items?.length || 0}</p>
            <p>Total: {formatTzs(build.total_tzs)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!build.is_visible ? <Badge variant="outline">Hidden</Badge> : <Badge variant="secondary">Visible</Badge>}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2">
            <Button className="w-full" type="button" variant="outline" size="sm" onClick={() => onEdit(build)}>
              Edit
            </Button>
            <Button className="w-full" type="button" variant="outline" size="sm" onClick={() => onDelete(build.id)}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
