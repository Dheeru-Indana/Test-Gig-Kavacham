import { useState, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { AdminLayout } from '../../components/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Search, Filter, CheckCircle2, AlertTriangle, Download, Database } from 'lucide-react';
import { ADMIN_CLAIMS_PIPELINE } from '../../lib/mock-data';
import { motion } from 'motion/react';

export default function AdminClaimsPipeline() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClaims = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return ADMIN_CLAIMS_PIPELINE.filter((claim) =>
      claim.workerName.toLowerCase().includes(query) ||
      claim.workerId.toLowerCase().includes(query) ||
      claim.zone.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const stats = useMemo(() => {
    let approved = 0;
    let flagged = 0;
    let amount = 0;
    ADMIN_CLAIMS_PIPELINE.forEach((claim) => {
      if (claim.status === 'Approved') approved++;
      if (claim.status === 'Flagged') flagged++;
      amount += claim.amount;
    });
    return { approvedCount: approved, flaggedCount: flagged, totalAmount: amount };
  }, []);

  const { approvedCount, flaggedCount, totalAmount } = stats;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-8 relative">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-card rounded-2xl border border-border flex items-center justify-center shadow-lg backdrop-blur-sm">
               <Database className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Claims Ledger</h1>
              <p className="text-muted-foreground font-medium">Real-time settlement visibility</p>
            </div>
          </div>
          <Button variant="secondary" className="gap-2 rounded-xl border border-border hover:bg-muted backdrop-blur-md transition-all text-foreground">
            <Download className="w-4 h-4" />
            Export Ledger
          </Button>
        </div>

        {/* Stats */}
        <motion.div 
          variants={containerVariants as any}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants as any}>
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-border shadow-sm hover:shadow-md relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Total Processed</p>
                  <p className="text-4xl font-bold tracking-tight text-foreground">{ADMIN_CLAIMS_PIPELINE.length}</p>
                </div>
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-inner">
                  <Database className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants as any}>
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-border relative overflow-hidden group hover:border-accent/50 transition-all shadow-sm hover:shadow-[0_0_30px_-15px_rgba(34,197,94,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Auto-Approved</p>
                  <p className="text-4xl font-bold tracking-tight text-accent">{approvedCount}</p>
                </div>
                <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants as any}>
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-border relative overflow-hidden group hover:border-warning/50 transition-all shadow-sm hover:shadow-[0_0_30px_-15px_rgba(239,68,68,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Flagged / Held</p>
                  <p className="text-4xl font-bold tracking-tight text-warning">{flaggedCount}</p>
                </div>
                <div className="w-14 h-14 bg-warning/10 border border-warning/20 rounded-2xl flex items-center justify-center shadow-inner">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-card/80 backdrop-blur-md border border-border shadow-sm rounded-2xl flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by worker name, ID, or zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-muted/40 border-border text-foreground rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all font-medium text-[15px]"
              />
            </div>
            <Button variant="secondary" className="gap-2 rounded-xl h-11 px-6 border text-[15px] border-border text-foreground hover:bg-muted backdrop-blur-md transition-all">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </Card>
        </motion.div>

        {/* Claims Table */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/80 backdrop-blur-xl border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent bg-muted/40">
                    <TableHead className="font-semibold text-muted-foreground tracking-wide py-5">Worker</TableHead>
                    <TableHead className="font-semibold text-muted-foreground tracking-wide py-5">Zone</TableHead>
                    <TableHead className="font-semibold text-muted-foreground tracking-wide py-5">Trigger Factor</TableHead>
                    <TableHead className="font-semibold text-muted-foreground tracking-wide py-5">Payout Amount</TableHead>
                    <TableHead className="font-semibold text-muted-foreground tracking-wide py-5">Settlement Time</TableHead>
                    <TableHead className="font-semibold text-muted-foreground tracking-wide py-5">Status</TableHead>
                    <TableHead className="py-5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim, index) => (
                    <motion.tr
                      key={claim.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (index * 0.05) }}
                      className="border-b border-border hover:bg-muted/50 even:bg-white/[0.02] dark:even:bg-white/[0.01] transition-colors group cursor-pointer"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/30">
                            {claim.workerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-[15px]">{claim.workerName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{claim.workerId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-[15px] font-medium">{claim.zone}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-foreground font-medium">
                          {claim.triggerType}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 font-bold text-[15px]">₹{claim.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="py-4 text-[15px] text-muted-foreground font-medium">
                        {new Date(claim.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="py-4">
                        {claim.fraudFlag ? (
                          <Badge variant="destructive" className="gap-1.5 bg-warning/10 text-warning border border-warning/20 px-2.5 py-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Flagged
                          </Badge>
                        ) : (
                          <Badge className="bg-accent/10 border border-accent/20 text-accent gap-1.5 px-2.5 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                          Details
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {filteredClaims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredClaims.length > 0 && (
               <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between text-[13px] font-medium text-muted-foreground">
                 <span>Showing {filteredClaims.length} records</span>
                 <span>Net Settlement: <strong className="text-foreground ml-1">₹{totalAmount.toLocaleString('en-IN')}</strong></span>
               </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}

