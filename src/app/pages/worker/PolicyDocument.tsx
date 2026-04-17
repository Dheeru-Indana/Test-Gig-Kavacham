import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Printer, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export default function PolicyDocument() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden print:bg-white print:pb-0 font-sans selection:bg-primary/20">
      <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/10 pattern-size-4 z-0 pointer-events-none opacity-50 print:hidden" />
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 print:hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Header Section */}
      <div className="bg-card/90 border-b border-border shadow-sm relative z-10 print:hidden backdrop-blur-md">
        <div className="p-6 pb-6 pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full hover:bg-muted bg-secondary/30 backdrop-blur-sm shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint} className="rounded-xl">
              <Printer className="w-4 h-4 mr-2" />
              Print PDF
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-4">
             <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-foreground">Policy Terms</h1>
               <p className="text-muted-foreground text-sm">Understanding your coverage bounds.</p>
             </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block p-8 border-b border-gray-200">
        <h1 className="text-4xl font-bold mb-2 text-black tracking-tight">GigKavacham Document</h1>
        <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8 relative z-10 print:mt-0 print:p-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Covered Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2rem] bg-accent/5 border border-accent/20 print:border-none print:p-0"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent print:bg-transparent print:p-0 print:w-auto print:h-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-accent print:text-black">What is Covered</h2>
            </div>
            
            <ul className="space-y-6">
              <CoveredItem text="Income loss when Disruption Condition Score (DCS) ≥ 0.70." />
              <CoveredItem text="Disruptions caused by Heavy Rainfall, extreme AQI, Heatwaves, or recognized civil disruptions." />
              <CoveredItem text="Partial payouts for mid-range DCS alerts based on your dynamic pricing band." />
              <CoveredItem text="Weekly capped payouts according to your active plan and operational city tier." />
              <CoveredItem text="Automatic payouts initiated instantly when a valid trigger fires in your selected zone." />
            </ul>
          </motion.div>

          {/* Not Covered Section */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="p-8 rounded-[2rem] bg-destructive/5 border border-destructive/20 print:border-none print:p-0 print:mt-8"
          >
            <div className="flex items-center gap-3 mb-8">
               <div className="w-12 h-12 bg-destructive/20 rounded-2xl flex items-center justify-center text-destructive print:bg-transparent print:p-0 print:w-auto print:h-auto">
                 <XCircle className="w-6 h-6" />
               </div>
              <h2 className="text-2xl font-bold text-destructive print:text-black">Exclusions</h2>
            </div>
            
            <ul className="space-y-6">
              <ExcludedItem text="Vehicle fuel, repair, and general physical maintenance costs." />
              <ExcludedItem text="Health, medical, or accidental emergency expenses resulting from gigs." />
              <ExcludedItem text="Platform (Swiggy/Zomato/Uber) application downtime or technical glitches." />
              <ExcludedItem text="Low order volumes on normal weather days or outside of trigger events." />
              <ExcludedItem text="Any disruptions occurring strictly outside your registered primary zone." />
              <ExcludedItem text="Disruptions that occurred before your coverage activated or after it lapsed." />
              <ExcludedItem text="Late or retroactive manual claims post the 24-hour event resolution window." />
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CoveredItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-4 group">
      <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 print:bg-transparent">
        <CheckCircle2 className="w-4 h-4 text-accent print:text-black" />
      </div>
      <span className="text-[15px] font-medium leading-relaxed text-foreground/90 print:text-gray-800 transition-colors group-hover:text-accent">{text}</span>
    </li>
  );
}

function ExcludedItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-4 group">
      <div className="w-7 h-7 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 print:bg-transparent">
        <XCircle className="w-4 h-4 text-destructive print:text-black" />
      </div>
      <span className="text-[15px] font-medium leading-relaxed text-foreground/90 print:text-gray-800 transition-colors group-hover:text-destructive">{text}</span>
    </li>
  );
}

