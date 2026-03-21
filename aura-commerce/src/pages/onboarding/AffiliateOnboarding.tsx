import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, LineChart, Globe, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  useAffiliateOnboardingStatus,
  useProfile,
  isInfluencerRole,
} from "../../components/guards/RouteGuards";

const CHANNELS = [
  "WhatsApp",
  "Instagram",
  "YouTube",
  "Offline selling",
  "Website/blog",
];

const DUMMY_INTERESTS = [
  "Fashion & Accessories",
  "Health & Wellness",
  "Beauty & Cosmetics",
  "Electronics & Gadgets",
  "Home & Kitchen",
  "Fitness Equipment",
  "Digital Products",
  "Travel & Leisure"
];

export default function AffiliateOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: onboardingDone, isLoading: onboardingStatusLoading } = useAffiliateOnboardingStatus();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isInfluencerRole(profile?.role)) return;
    if (onboardingStatusLoading) return;
    if (!onboardingDone) return;
    navigate("/dashboard", { replace: true });
  }, [profile?.role, onboardingDone, onboardingStatusLoading, navigate]);

  // Profile Setup State
  const [profession, setProfession] = useState("");
  const [experience, setExperience] = useState("");
  const [channels, setChannels] = useState<string[]>([]);

  // Interests State
  const [interests, setInterests] = useState<string[]>([]);

  const toggleChannel = (c: string) => {
    setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleInterest = (i: string) => {
    setInterests(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i);
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, i];
    });
  };

  const nextStep = () => {
    if (step === 1 && profession && channels.length > 0) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (interests.length < 2 || interests.length > 3) return;
    setLoading(true);

    try {
      if (!user) throw new Error("User not found");

      // 1. Update user metadata as before (for fast client-side access)
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          profession,
          experience,
          preferred_channels: channels,
          interests,
          onboarding_completed: true
        }
      });
      if (metaError) throw metaError;

      // 2. Create Influencer Profile (Prisma schema: id + updated_at have no DB default)
      const { data: existingProfile } = await supabase
        .from("influencer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const now = new Date().toISOString();
      const { data: profile, error: profileError } = await supabase
        .from("influencer_profiles")
        .upsert(
          {
            id: existingProfile?.id ?? crypto.randomUUID(),
            user_id: user.id,
            display_name: user.user_metadata?.full_name || "Influencer",
            bio: `Professional ${profession} with interests in ${interests.join(", ")}.`,
            tier: "NANO",
            updated_at: now,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Create Default Storefront
      const baseSlug = (user.user_metadata?.full_name || "store")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 50);
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

      const { data: existingStore } = await supabase
        .from("storefronts")
        .select("id")
        .eq("influencer_id", profile.id)
        .maybeSingle();

      const storeNow = new Date().toISOString();
      const { error: storeError } = await supabase
        .from("storefronts")
        .upsert(
          {
            id: existingStore?.id ?? crypto.randomUUID(),
            influencer_id: profile.id,
            slug: uniqueSlug,
            title: `${user.user_metadata?.full_name || "My"} Boutique`,
            tagline: `Curated products for ${interests[0]} & more`,
            status: "PUBLISHED",
            updated_at: storeNow,
          },
          { onConflict: "influencer_id" }
        );

      if (storeError) throw storeError;

      await queryClient.invalidateQueries({ queryKey: ["affiliate-onboarding-status", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });

      navigate(`/dashboard/marketplace`, { replace: true });
    } catch (err) {
      console.error("Failed to save onboarding:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#E5F2F1] blur-[100px] opacity-70" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#FCEBE7] blur-[100px] opacity-70" />
      </div>

      <div className="w-full max-w-[600px] relative z-10">
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-[#111827] text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
            <div className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-[#111827]' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-[#111827] text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
          </div>
          <p className="text-sm font-bold text-gray-400">Step {step} of 2</p>
        </div>

        <motion.div 
          className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h1 className="text-3xl font-black text-[#111827] mb-2">Build your profile</h1>
                <p className="text-gray-500 font-medium mb-8">Tell us about your background and how you plan to sell.</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Briefcase size={14} /> Profession / Occupation *</label>
                    <input 
                      type="text" 
                      value={profession}
                      onChange={e => setProfession(e.target.value)}
                      placeholder="e.g. Content Creator, Student, Digital Marketer" 
                      className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><LineChart size={14} /> Experience in Sales/Marketing (Optional)</label>
                    <select 
                      value={experience}
                      onChange={e => setExperience(e.target.value)}
                      className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium transition-all"
                    >
                      <option value="">Select your experience level</option>
                      <option value="none">No prior experience</option>
                      <option value="beginner">Beginner (0-1 years)</option>
                      <option value="intermediate">Intermediate (1-3 years)</option>
                      <option value="expert">Expert (3+ years)</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Globe size={14} /> Preferred selling channels *</label>
                    <div className="flex flex-wrap gap-3">
                      {CHANNELS.map(c => (
                        <button
                          key={c}
                          onClick={() => toggleChannel(c)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${channels.includes(c) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    onClick={nextStep}
                    disabled={!profession || channels.length === 0}
                    className="w-full h-14 bg-[#111827] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-[#111827]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h1 className="text-3xl font-black text-[#111827] mb-2 flex items-center gap-2">Choose your niche <Sparkles className="text-amber-500" size={28} /></h1>
                <p className="text-gray-500 font-medium mb-2">Select your primary fields of interest.</p>
                <div className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg inline-block mb-8">
                  Select min 2, max 3 fields. ({interests.length}/3)
                </div>

                <div className="grid grid-cols-2 gap-3 mb-10">
                  {DUMMY_INTERESTS.map(interest => {
                    const isSelected = interests.includes(interest);
                    const isDisabled = interests.length >= 3 && !isSelected;
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        disabled={isDisabled}
                        className={`p-4 rounded-2xl text-left border-2 transition-all flex justify-between items-center ${isSelected ? 'border-indigo-500 bg-indigo-50/50' : isDisabled ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                      >
                        <span className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-600'}`}>{interest}</span>
                        {isSelected && <CheckCircle2 size={18} className="text-indigo-500" />}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={interests.length < 2 || loading}
                  className="w-full h-14 bg-[#111827] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-[#111827]/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Complete Profile & Discover Products"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
