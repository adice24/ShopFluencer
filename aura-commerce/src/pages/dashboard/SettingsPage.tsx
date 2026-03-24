import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useMyStore } from "../../hooks/useInfluencerStore";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, Shield } from "lucide-react";

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
                  ? "bg-card shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-[#8B5CF6] border border-border/40"
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
        <div className="flex-1 bg-card/80 backdrop-blur-md border border-white p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-[22px] font-extrabold text-[#2F3E46] mb-6">Profile Information</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-tr from-[#99D8D0] to-[#FFD8B5] flex items-center justify-center overflow-hidden border border-white/40 shadow-sm shrink-0">
                  {store?.avatar_url || user?.user_metadata?.avatar_url ? (
                    <img src={store?.avatar_url || user?.user_metadata?.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-blush uppercase">{formData.displayName.charAt(0) || "U"}</span>
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
                  className="px-8 py-3 bg-[#8B5CF6] text-blush font-bold text-[14px] rounded-full hover:bg-[#7C3AED] transition-colors disabled:opacity-50 shadow-sm"
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
                    <button className="px-5 py-2.5 bg-card border border-border/60 shadow-sm rounded-xl text-[13px] font-bold text-foreground hover:bg-black/5 transition-colors shrink-0">
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
        </div>
      </div>
    </div>
  );
}
