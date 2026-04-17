import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { AdminLayout } from '../../components/AdminLayout';
import { MapPin, Users, IndianRupee, Activity } from 'lucide-react';
import { ADMIN_ZONE_DATA } from '../../lib/mock-data';
import { motion } from 'motion/react';
import { cn } from '../../components/ui/utils';

export default function AdminHeatMap() {
  const [selectedZone, setSelectedZone] = useState(ADMIN_ZONE_DATA[0]);

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold mb-2">Live Zone Heat Map</h1>
          <p className="text-muted-foreground">
            Real-time disruption monitoring across all zones
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-[600px]">
              <div className="relative w-full h-full bg-muted/30 rounded-xl overflow-hidden pattern-dots pattern-primary/10 pattern-size-4">
                {/* Mock Map */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      Interactive map visualization
                    </p>
                  </div>
                </div>

                {/* Zone Markers */}
                {ADMIN_ZONE_DATA.map((zone, index) => (
                  <motion.div
                    key={zone.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'absolute w-20 h-20 rounded-full cursor-pointer transition-all hover:scale-110',
                      'flex items-center justify-center text-white font-semibold',
                      zone.status === 'safe' && 'bg-accent',
                      zone.status === 'risk' && 'bg-warning',
                      zone.status === 'triggered' && 'bg-destructive',
                      selectedZone.id === zone.id && 'ring-4 ring-white scale-110'
                    )}
                    style={{
                      top: `${20 + index * 25}%`,
                      left: `${30 + index * 15}%`,
                    }}
                    onClick={() => setSelectedZone(zone)}
                  >
                    <div className="text-center">
                      <div className="text-xs opacity-90">{zone.name}</div>
                      <div className="text-lg font-bold">{zone.dcs}</div>
                    </div>
                  </motion.div>
                ))}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-card p-4 rounded-xl border border-border">
                  <p className="text-sm font-semibold mb-2">Status</p>
                  <div className="space-y-2">
                    <LegendItem color="bg-accent" label="Safe (0-49)" />
                    <LegendItem color="bg-warning" label="Risk (50-79)" />
                    <LegendItem color="bg-destructive" label="Triggered (80+)" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Zone Details */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                {/* Zone Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{selectedZone.name}</h3>
                    <div
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold text-white',
                        selectedZone.status === 'safe' && 'bg-accent',
                        selectedZone.status === 'risk' && 'bg-warning',
                        selectedZone.status === 'triggered' && 'bg-destructive'
                      )}
                    >
                      {selectedZone.status.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Zone Details</p>
                </div>

                {/* DCS Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">DCS Score</span>
                    <span className="text-2xl font-bold">{selectedZone.dcs}/100</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full',
                        selectedZone.status === 'safe' && 'bg-accent',
                        selectedZone.status === 'risk' && 'bg-warning',
                        selectedZone.status === 'triggered' && 'bg-destructive'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedZone.dcs}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  <MetricCard
                    icon={<Users className="w-5 h-5" />}
                    label="Active Workers"
                    value={selectedZone.activeWorkers.toString()}
                  />
                  <MetricCard
                    icon={<IndianRupee className="w-5 h-5" />}
                    label="Expected Payout"
                    value={`₹${selectedZone.expectedPayout.toLocaleString('en-IN')}`}
                  />
                  <MetricCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Status"
                    value={selectedZone.status === 'triggered' ? 'Payouts Processing' : 'Monitoring'}
                  />
                </div>
              </div>
            </Card>

            {/* All Zones List */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">All Zones</h3>
              <div className="space-y-2">
                {ADMIN_ZONE_DATA.map((zone) => (
                  <ZoneListItem
                    key={zone.id}
                    zone={zone}
                    isSelected={selectedZone.id === zone.id}
                    onClick={() => setSelectedZone(zone)}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${color}`}></div>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ZoneListItem({
  zone,
  isSelected,
  onClick,
}: {
  zone: typeof ADMIN_ZONE_DATA[0];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left',
        isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted/50'
      )}
    >
      <span className="font-medium">{zone.name}</span>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
          zone.status === 'safe' && 'bg-accent',
          zone.status === 'risk' && 'bg-warning',
          zone.status === 'triggered' && 'bg-destructive'
        )}
      >
        {zone.dcs}
      </div>
    </button>
  );
}

