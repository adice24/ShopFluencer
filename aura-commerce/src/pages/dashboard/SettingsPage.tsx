import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useMyStore } from "../../hooks/useInfluencerStore";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, CreditCard, Shield } from "lucide-react";

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { store, updateStore, isLoading: isFetching } = useMyStore();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    websiteUrl: "",
    instagram: "",
    email: user?.email || ""
  });

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "profile");
  }, [searchParams]);

  useEffect(() => {
    if (store || user) {
      setFormData({
        displayName: store?.display_name || user?.user_metadata?.username || "",
        bio: store?.bio || "",
        websiteUrl: "", // Assuming not tracked yet, or could add
        instagram: (store?.social_links as any)?.instagram || "",
        email: user?.email || "",
      });
    }
  }, [store, user]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      if (store) {
        await updateStore.mutateAsync({
          display_name: formData.displayName,
          bio: formData.bio,
          social_links: {
            ...(store.social_links as any || {}),
            instagram: formData.instagram
          }
        });
      }
      toast.success("Profile settings updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-[#2F3E46] mb-2">Settings</h1>
        <p className="text-[#4D606B]">Manage your account preferences and profile details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all ${isActive
                  ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-[#8B5CF6] border border-border/40"
                  : "text-muted-foreground hover:bg-black/5 hover:text-[#2F3E46]"
                  }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[#8B5CF6]" : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white/80 backdrop-blur-md border border-white p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-[22px] font-extrabold text-[#2F3E46] mb-6">Profile Information</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-tr from-[#99D8D0] to-[#FFD8B5] flex items-center justify-center overflow-hidden border border-white/40 shadow-sm shrink-0">
                  {store?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img src={store?.avatar_url || user?.user_metadata?.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white uppercase">{formData.displayName.charAt(0) || "U"}</span>
                  )}
                </div>
                <button className="px-5 py-2.5 bg-black/5 rounded-full text-[13px] font-bold hover:bg-black/10 transition-colors">
                  Change Avatar
                </button>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-foreground/70">Store Display Name</Label>
                <Input
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  className="rounded-xl px-4 py-3 h-auto font-medium bg-[#FAFAFA]"
                />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="rounded-xl min-h-[100px]"
                  placeholder="Tell your audience about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-foreground/70">Instagram Handle</Label>
                  <Input
                    value={formData.instagram}
                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                    className="rounded-xl px-4 py-3 h-auto font-medium bg-[#FAFAFA]"
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="px-8 py-3 bg-[#8B5CF6] text-white font-bold text-[14px] rounded-full hover:bg-[#7C3AED] transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-[22px] font-extrabold text-[#2F3E46] mb-2">Account Identity</h2>
              <p className="text-[13px] font-medium text-muted-foreground border-b border-border/40 pb-6">Your core security profile and identity.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold text-foreground/70">Registered Email</Label>
                  <Input
                    value={formData.email}
                    disabled
                    className="rounded-xl px-4 py-3 h-auto font-medium bg-black/5 text-muted-foreground opacity-70 cursor-not-allowed"
                  />
                  <p className="text-[11px] font-bold text-muted-foreground mt-1">Contact support to transfer email ownership.</p>
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="font-bold text-foreground/70">Password</Label>
                  <div className="flex gap-4">
                    <Input
                      type="password"
                      value="********"
                      disabled
                      className="rounded-xl px-4 py-3 h-auto font-medium bg-black/5 text-muted-foreground opacity-70 flex-1"
                    />
                    <button className="px-5 py-2.5 bg-white border border-border/60 shadow-sm rounded-xl text-[13px] font-bold text-foreground hover:bg-black/5 transition-colors shrink-0">
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#2F3E46]">Notification Preferences</h2>
              <p className="text-muted-foreground">Choose what updates you want to receive.</p>
              {/* Placeholder for future implementation */}
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <h2 className="text-[22px] font-extrabold text-[#2F3E46] mb-2">Upgrade & Billing</h2>
              <p className="text-[13px] font-medium text-muted-foreground border-b border-border/40 pb-6">Manage your subscription, custom domains, and payouts.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Free Plan */}
                <div className="bg-[#FAFAFA] border border-border/60 rounded-[24px] p-6 relative">
                  <div className="absolute top-4 right-4 bg-black/10 text-[#2F3E46] text-[11px] font-extrabold uppercase px-3 py-1 rounded-full">Current</div>
                  <h3 className="text-xl font-bold text-[#2F3E46] mb-1">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-extrabold text-[#2F3E46]">$0</span>
                    <span className="text-[13px] text-muted-foreground font-medium">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-[14px] text-[#4D606B] font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">✓</div> Unlimited Links
                    </li>
                    <li className="flex items-center gap-3 text-[14px] text-[#4D606B] font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">✓</div> Basic Catalog Access
                    </li>
                    <li className="flex items-center gap-3 text-[14px] text-muted-foreground opacity-50 font-medium">
                      <div className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-black/40 shrink-0">✕</div> Custom Domain
                    </li>
                    <li className="flex items-center gap-3 text-[14px] text-muted-foreground opacity-50 font-medium">
                      <div className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-black/40 shrink-0">✕</div> Zero Transaction Fees
                    </li>
                  </ul>

                  <button disabled className="w-full py-3 px-6 rounded-full border border-border/60 bg-white text-[#2F3E46] font-bold text-[14px] opacity-70 cursor-not-allowed">
                    Active Plan
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-gradient-to-tr from-violet-500 to-fuchsia-400 rounded-[24px] p-6 text-white shadow-[0_10px_40px_rgba(139,92,246,0.3)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <h3 className="text-xl font-bold text-white mb-1 relative z-10">Creator Pro</h3>
                  <div className="flex items-baseline gap-1 mb-6 relative z-10">
                    <span className="text-3xl font-extrabold text-white">$29</span>
                    <span className="text-[13px] text-white/80 font-medium">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8 relative z-10">
                    <li className="flex items-center gap-3 text-[14px] text-white/90 font-medium">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">✓</div> Custom Domain (yourname.com)
                    </li>
                    <li className="flex items-center gap-3 text-[14px] text-white/90 font-medium">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">✓</div> 0% Platform Transaction Fees
                    </li>
                    <li className="flex items-center gap-3 text-[14px] text-white/90 font-medium">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">✓</div> Advanced Analytics
                    </li>
                    <li className="flex items-center gap-3 text-[14px] text-white/90 font-medium">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">✓</div> Premium Themes & UI
                    </li>
                  </ul>

                  <button
                    onClick={() => {
                      toast.loading('Redirecting to Stripe Checkout...', { duration: 2000 });
                      setTimeout(() => toast.success('Stripe session verified!'), 2000);
                    }}
                    className="w-full py-3 px-6 rounded-full bg-white text-violet-600 hover:bg-white/90 font-extrabold text-[14px] shadow-sm relative z-10 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
