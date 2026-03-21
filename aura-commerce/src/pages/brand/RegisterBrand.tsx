import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Globe, 
  FileText, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function RegisterBrand() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    businessType: "Pvt Ltd",
    gstNumber: "",
    contactPerson: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    website: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
      
      const { data: existingBrand, error: checkError } = await supabase
        .from('brands')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (existingBrand) {
         navigate('/brand');
         return;
      }

      const { error: insertError } = await supabase
        .from('brands')
        .insert({
          name: formData.name,
          slug,
          owner_id: user?.id,
          contact_email: formData.email,
          business_type: formData.businessType,
          gst_number: formData.gstNumber,
          contact_person: formData.contactPerson,
          phone_number: formData.phone,
          business_address: formData.address,
          website_url: formData.website,
          status: 'ACTIVE',
          is_active: true
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => navigate('/brand'), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to register brand. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9] px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-xl border border-emerald-100 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-[#111827] mb-4">You're All Set!</h2>
          <p className="text-[#6B7280] leading-relaxed mb-0">
            Your brand account is now active. You can start adding your products to the marketplace and connect with affiliates immediately.
          </p>
          <div className="mt-8 pt-8 border-t border-emerald-50">
            <p className="text-sm font-bold text-emerald-600">Taking you to your dashboard...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] py-16 px-6 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50 blur-[120px] rounded-full -mr-20 -mt-20 opacity-60" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-50 blur-[120px] rounded-full -ml-20 -mb-20 opacity-60" />

      <div className="max-w-2xl mx-auto relative z-10">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[13px] font-bold mb-4">
            <Building2 size={14} /> Brand Registration
          </div>
          <h1 className="text-4xl font-black text-[#111827] mb-4">Join the Network</h1>
          <p className="text-[#6B7280] text-lg">Register your brand to start collaborating with top affiliates.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-indigo-50 space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#374151] ml-1">Brand Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter brand name"
                    className="w-full h-[54px] pl-12 pr-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#374151] ml-1">Business Type</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full h-[54px] pl-12 pr-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium appearance-none"
                  >
                    <option>Pvt Ltd</option>
                    <option>Partnership</option>
                    <option>Proprietorship</option>
                    <option>LLP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#374151] ml-1">GST Number (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="GSTIN"
                    className="w-full h-[54px] pl-12 pr-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#374151] ml-1">Website (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://brand.com"
                    className="w-full h-[54px] pl-12 pr-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="pt-4 border-t border-[#F3F4F6]">
              <h3 className="text-[16px] font-black text-[#111827] mb-6">Contact Person Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#374151] ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                    <input
                      required
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Person name"
                      className="w-full h-[54px] pl-12 pr-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#374151] ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 00000 00000"
                      className="w-full h-[54px] pl-12 pr-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#374151] ml-1">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-6 text-[#9CA3AF]" size={18} />
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Zip Code"
                  className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[14px] font-bold flex items-center gap-3 animate-shake">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                {error}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full h-[60px] bg-[#111827] text-white rounded-2xl font-black text-[16px] flex items-center justify-center gap-3 hover:bg-[#111827]/90 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Complete Registration <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
