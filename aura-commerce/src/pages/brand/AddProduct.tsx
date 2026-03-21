import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Tag, 
  IndianRupee, 
  Layers, 
  Image as ImageIcon,
  Video,
  FileText,
  Percent,
  Truck,
  Plus,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
  Shield
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandStatus, setBrandStatus] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    stock: "",
    margin: "",
    marginType: "PERCENT",
    maxDiscount: "",
    deliveryAvailability: "Pan India",
    videoUrl: "",
    marketingMaterials: "", // New Field
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data: brand } = await supabase
        .from('brands')
        .select('id, status')
        .eq('owner_id', user?.id)
        .single();
      
      if (brand) {
        setBrandId(brand.id);
        setBrandStatus(brand.status);
      }

      const { data: cats } = await supabase
        .from('categories')
        .select('id, name');
      
      if (cats) {
        setCategories(cats);
        // Don't auto-set first category unless explicitly picked
      }
    }
    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      setError("Brand profile not found. Please register first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '-' + Date.now().toString().slice(-4);

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          slug,
          description: formData.description,
          category_id: formData.categoryId,
          brand_id: brandId,
          base_price: parseFloat(formData.price),
          affiliate_margin: parseFloat(formData.margin),
          margin_type: formData.marginType,
          max_discount: parseFloat(formData.maxDiscount || "0"),
          delivery_availability: formData.deliveryAvailability,
          video_url: formData.videoUrl,
          marketing_materials: formData.marketingMaterials, // JSON/String field
          status: 'ACTIVE',
          total_sold: 0,
          avg_rating: 0
        })
        .select()
        .single();

      if (productError) throw productError;

      // Upload images to Supabase Storage
      const uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadProgress(10);
        const uploadStep = 80 / selectedFiles.length;
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${product.id}/${Date.now()}_${i}.${fileExt}`;
          
          const { error: uploadErr, data: uploadData } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });
            
          if (uploadErr) {
             console.error("Image upload failed:", uploadErr);
             throw new Error("Failed to upload image(s).");
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(uploadData.path);
            
          uploadedImageUrls.push(publicUrl);
          setUploadProgress(prev => prev + uploadStep);
        }
      }
      
      const imagesToInsert = uploadedImageUrls.length > 0 ? uploadedImageUrls : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"];
      
      const imageInserts = imagesToInsert.map((url, i) => ({
        product_id: product.id,
        url,
        is_primary: i === 0,
        sort_order: i
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (imageError) throw imageError;

      setUploadProgress(100);

      setSuccess(true);
      setTimeout(() => navigate('/brand'), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-xl text-center max-w-md w-full border border-emerald-100"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-[#111827] mb-2">Product Submitted!</h2>
          <p className="text-[#6B7280]">Redirecting to your catalog...</p>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link to="/brand" className="w-10 h-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-[#111827]">Add New Product</h1>
            <p className="text-[#6B7280] font-medium">List a new product for affiliates to promote.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#F3F4F6] space-y-6">
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2">
              <Package size={20} className="text-indigo-500" /> Product Details
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Product Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ultra Slim Cotton Tee"
                  className="w-full h-[54px] px-5 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell affiliates about this product..."
                  className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full h-[54px] px-5 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Stock Quantity</label>
                  <input
                    required
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    className="w-full h-[54px] px-5 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Margin Card */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#F3F4F6] space-y-6">
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2">
              <IndianRupee size={20} className="text-emerald-500" /> Affiliate Details (Margin & Pricing)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Product Price (₹)</label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-[54px] px-5 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all text-[15px] font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Affiliate Margin</label>
                <div className="flex gap-2">
                  <input
                    required
                    type="number"
                    value={formData.margin}
                    onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                    placeholder="15"
                    className="flex-1 h-[54px] px-5 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                  />
                  <select
                     value={formData.marginType}
                     onChange={(e) => setFormData({ ...formData, marginType: e.target.value })}
                     className="w-[80px] h-[54px] px-2 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="PERCENT">%</option>
                    <option value="FIXED">₹</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Max Allowed Discount (%)</label>
                 <input
                   required
                   type="number"
                   value={formData.maxDiscount}
                   onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                   placeholder="0"
                   className="w-full h-[54px] px-5 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider">Delivery Availability</label>
                 <div className="relative">
                   <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                   <input
                     required
                     type="text"
                     value={formData.deliveryAvailability}
                     onChange={(e) => setFormData({ ...formData, deliveryAvailability: e.target.value })}
                     placeholder="Pan India, Metro only..."
                     className="w-full h-[54px] pl-12 pr-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-medium"
                   />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Media & Action Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#F3F4F6] space-y-6">
            <h3 className="text-lg font-black text-[#111827] flex items-center gap-2">
              <ImageIcon size={20} className="text-blue-500" /> Media & Promo
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border shadow-sm group">
                         <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                         <button 
                            type="button"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <X size={14} />
                         </button>
                      </div>
                    ))}
                    {selectedFiles.length < 5 && (
                      <label className="aspect-square bg-[#F9FAFB] border-2 border-dashed border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center text-center p-4 gap-2 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer group">
                        <input 
                           type="file" 
                           multiple 
                           accept="image/*" 
                           className="hidden" 
                           onChange={(e) => {
                             if (e.target.files) {
                               setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 5));
                             }
                           }}
                        />
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                          <Plus size={20} />
                        </div>
                        <p className="text-[12px] font-bold text-[#4B5563]">Add Image</p>
                      </label>
                    )}
                 </div>
                 <p className="text-[11px] text-[#9CA3AF]">Up to 5 images. Min 800x800px. {selectedFiles.length}/5 selected.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider flex items-center gap-2">
                  <Video size={14} /> Video URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="YouTube/Vimeo link"
                  className="w-full h-[50px] px-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl outline-none focus:border-indigo-500 text-[14px] font-medium"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-[#4B5563] ml-1 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} /> Marketing Materials (Opt.)
                </label>
                <textarea
                  rows={3}
                  value={formData.marketingMaterials}
                  onChange={(e) => setFormData({ ...formData, marketingMaterials: e.target.value })}
                  placeholder="Add links to brand guidelines, high-res assets, etc."
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl outline-none focus:border-indigo-500 text-[14px] font-medium resize-none shadow-inner"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[13px] font-bold">
              {error}
            </div>
          )}

          <button
            disabled={loading || selectedFiles.length === 0}
            type="submit"
            className="w-full h-[64px] bg-[#111827] text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-[#111827]/90 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 relative overflow-hidden"
          >
            {loading && uploadProgress > 0 && (
               <div className="absolute left-0 top-0 bottom-0 bg-indigo-500/30 transition-all" style={{ width: `${uploadProgress}%` }} />
            )}
            {loading ? <Loader2 className="animate-spin relative z-10" size={24} /> : <span className="relative z-10">Publish Product</span>}
          </button>

          <p className="text-center text-[12px] text-[#9CA3AF] font-bold px-4">
            By publishing, you agree to our Terms of Service. Product will be reviewed by admin before going live.
          </p>
        </div>
      </form>
    </div>
  );
}
