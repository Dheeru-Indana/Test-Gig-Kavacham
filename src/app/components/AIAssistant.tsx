import { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Bot, ChevronUp, RefreshCw, Send, Loader2, Sparkles, Plus, AlertCircle, Maximize2, Minimize2, X, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from './ui/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { classifyIntent } from '../../services/chatbot/intentClassifier';
import { INTENT_KNOWLEDGE } from '../../services/chatbot/intentKnowledge';
import { buildChatContext } from '../../services/chatbot/contextBuilder';
import { getFrequentTopics, saveInteraction } from '../../services/chatbot/chatbotLearning';
import { useDcs } from '../../hooks/useDcs';
import { mlFetch, checkMlStatus } from '../../services/ml/mlApiService';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "Hello! I am the Kavach-AI Oracle Assistant. Ask me anything about your Policy, Claims, Pricing, Risk Engines, or our Platform." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useApp();
  const [chatContext, setChatContext] = useState<any>({});
  const [mlOnline, setMlOnline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const online = await checkMlStatus();
      setMlOnline(online);
    };
    checkStatus();
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide during hero typewriter phase
  const [heroTyping, setHeroTyping] = useState(() => {
    // Initialize to true if we are loading the home page for the first time to prevent flash before Welcome mounts
    if (window.location.pathname === '/' && !(window as any).__gig_intro_played) {
      return true;
    }
    return document.body.hasAttribute('data-hero-typing');
  });
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHeroTyping(document.body.hasAttribute('data-hero-typing'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-hero-typing'] });
    return () => observer.disconnect();
  }, []);
  
  const handleInitialContextStart = async () => {
    if (!user) return;
    const context = await buildChatContext(user.id);
    setChatContext(context);
    setMessages([
      { role: 'assistant', text: `Hi ${context.fullName?.split(' ')[0] || 'there'}. I'm your AI coverage assistant. I see your ${context.planName || 'Shield'} status is currently tracking a DCS of ${context.currentDcs || 0}/100. How can I help you today?` }
    ]);
  };

  const TOPIC_TO_QUESTION: Record<string, string> = {
    policy_coverage: 'What does my policy cover?',
    policy_exclusions: 'What is not covered by my policy?',
    policy_cancel: 'How do I cancel my policy?',
    policy_switch: 'How do I switch to a different plan?',
    premium_why: 'Why is my premium this amount?',
    premium_reduce: 'How can I reduce my premium?',
    payout_why: 'Why did I receive a payout?',
    payout_when: 'When will I get paid?',
    payout_failed: 'My payout failed — what do I do?',
    dcs_what: 'What is the DCS score?',
    dcs_high_risk: 'Why is my zone high risk?',
    dcs_probability: 'What is the disruption probability?',
    fraud_flagged: 'Why was my claim flagged?',
    shield_score: 'What is my Shield Score?',
    city_tier: 'What is my city tier?',
    platform_how: 'How does GigKavacham work?',
    platform_trigger: 'What triggers a payout?',
  };

  const DEFAULT_SUGGESTIONS = [
    'What does my policy cover?',
    'Why is my premium this amount?',
    'What is DCS?',
    'When will I get paid?',
    'How do I switch plans?',
    'What is my Shield Score?',
  ];

  const getSuggestedQuestions = (): string[] => {
    const frequentTopics = getFrequentTopics();
    const personalised = frequentTopics
      .map(t => TOPIC_TO_QUESTION[t])
      .filter(Boolean);

    if (personalised.length >= 3) {
      const extras = DEFAULT_SUGGESTIONS
        .filter(q => !personalised.includes(q))
        .slice(0, 2);
      return [...personalised, ...extras].slice(0, 6);
    }

    return DEFAULT_SUGGESTIONS;
  };

  const suggestedQuestions = getSuggestedQuestions();

  useEffect(() => {
    if (user?.id) {
      handleInitialContextStart();
    }
  }, [user]);

  const { dcsOutput } = useDcs(chatContext?.cityTier || 'Tier 1', user?.id as any);

  useEffect(() => {
    if (dcsOutput) {
      setChatContext((prev: any) => ({
        ...prev,
        currentDcs: dcsOutput.currentDcs,
        riskLabel: dcsOutput.riskLabel,
        disruptionProbability: dcsOutput.disruptionProbability,
        forecastExplanation: dcsOutput.explanation,
      }));
    }
  }, [dcsOutput]);

  const CATEGORIES = [
    { label: 'Policy', icon: '🛡️', query: 'What does my policy cover?' },
    { label: 'Premium', icon: '💰', query: 'Why is my premium this amount?' },
    { label: 'Payouts', icon: '📲', query: 'When will I get paid?' },
    { label: 'DCS', icon: '📊', query: 'What is DCS?' },
    { label: 'Help', icon: '❓', query: 'How does GigKavacham work?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setInput("");
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 600));

    let finalIntent = '';
    let confidence = 0.5;

    if (mlOnline) {
      const mlRes = await mlFetch('/chat/classify', { query: text });
      if (mlRes) {
        finalIntent = mlRes.intent;
        confidence = mlRes.confidence;
      }
    }

    if (!finalIntent) {
      const matched = classifyIntent(text, INTENT_KNOWLEDGE);
      if (matched) {
        finalIntent = matched.intent;
      }
    }

    console.log(`[AI Chat] Query: "${text}" | Detected Intent: ${finalIntent || 'None'}`);

    const matchedKnowledge = INTENT_KNOWLEDGE.find(k => k.intent === finalIntent);

    let responseText = '';
    if (matchedKnowledge) {
      responseText = matchedKnowledge.response(chatContext);
    } else {
      responseText = `I can help with your policy, premium, payouts, claims, DCS risk, and account actions. Try asking: "Why is my premium this amount?", "What does my policy cover?", or "What triggered my last payout?"`;
    }

    // Log to Supabase
    if (user) {
      await supabase.from('chatbot_query_log').insert([{
        worker_id: user.id,
        query: text,
        detected_intent: finalIntent || 'fallback',
        confidence: confidence,
        response: responseText,
        model_version: mlOnline ? 'ML_SBERT_v1.0' : 'RULE_BASE_v1.0'
      }]);
    }

    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
  };

  // Hide everything during hero typing phase
  if (heroTyping) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-6 sm:bottom-6 z-50 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-primary text-primary-foreground shadow-2xl hover:shadow-indigo-500/25 hover:scale-105 transition-all flex items-center gap-2 font-bold tracking-wide border border-border",
          isOpen ? "hidden" : "flex"
        )}
      >
        <Sparkles className="w-5 h-5 animate-pulse text-primary-foreground/80" />
        <span>Ask AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-6 sm:bottom-6 z-50 w-[340px] sm:w-[380px] h-[500px] bg-card/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header (Sticky) */}
            <div className="bg-primary/10 p-4 px-5 flex items-center justify-between border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground tracking-tight">Ask AI</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categories Bar */}
            <div className="flex gap-2 px-4 py-2 border-b border-border overflow-x-auto no-scrollbar shrink-0 bg-background/30 backdrop-blur-md">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(cat.query);
                    handleSend(cat.query);
                  }}
                  className="flex items-center gap-1 text-xs bg-muted hover:bg-primary/10 hover:text-primary text-foreground border border-border rounded-full px-3 py-1.5 whitespace-nowrap transition-colors"
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Chat History (Scrollable) */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-gradient-to-b from-transparent to-background/50 custom-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                   {msg.role === 'assistant' && (
                     <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center mr-2 shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                     </div>
                   )}
                   <div 
                     className={cn(
                       "max-w-[80%] p-3.5 text-[13px] leading-relaxed shadow-sm", 
                       msg.role === 'user' 
                         ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm font-medium" 
                         : "bg-muted border border-border text-foreground rounded-2xl rounded-tl-sm"
                     )}
                     dangerouslySetInnerHTML={{ __html: msg.text }}
                   />
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full justify-start"
                >
                  <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center mr-2 shrink-0 mt-1">
                     <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="bg-muted border border-border rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              {messages.length === 1 && (
                <div className="p-4">
                  {getFrequentTopics().length > 0 && (
                    <p className="text-xs text-indigo-500 mb-1 font-medium">
                      Based on your previous questions
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mb-3">
                    {getFrequentTopics().length > 0
                      ? 'Suggested for you'
                      : 'Suggested questions'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); handleSend(q); }}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1.5 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form (Sticky Footer) */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="p-3 bg-card border-t border-border flex items-center gap-2 shrink-0"
            >
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI..."
                disabled={isTyping}
                className="flex-1 bg-background border border-border px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping} 
                className="w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
