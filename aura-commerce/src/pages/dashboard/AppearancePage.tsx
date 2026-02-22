import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useLinks } from "../../hooks/useLinks";
import { useMyStore } from "../../hooks/useInfluencerStore";
import MobilePreview from "../../components/dashboard/MobilePreview";
import ProfileSection from "../../components/dashboard/appearance/ProfileSection";
import { useAuth } from "../../contexts/AuthContext";

// The presets mapped to the `localTheme` state structure.
const PRESET_THEMES = [
  {
    id: "dark-minimal",
    name: "Jesse Jordan",
    category: "minimal",
    preview: { bg: "#0f172a", btn: "#000000", text: "#ffffff", style: "rounded" },
    config: {
      background_type: "flat", background_value: "#0f172a",
      button_style: "rounded", font_family: "Inter, sans-serif",
      button_color: "#000000", text_color: "#ffffff"
    }
  },
  {
    id: "sunset-blur",
    name: "Mindy Frauke",
    category: "gradient",
    preview: { bg: "linear-gradient(180deg, #A8C0D6 0%, #D8A5B6 50%, #B85F47 100%)", btn: "#ffffff", text: "#000000", style: "rounded" },
    config: {
      background_type: "gradient", background_value: "linear-gradient(180deg, #A8C0D6 0%, #D8A5B6 50%, #B85F47 100%)",
      button_style: "rounded", font_family: "Space Grotesk, sans-serif",
      button_color: "#ffffff", text_color: "#000000"
    }
  },
  {
    id: "retro-grid",
    name: "Lowell Maxwell",
    category: "custom",
    preview: { bg: "#4A3638", btn: "#EAE1CF", text: "#000000", style: "rounded" },
    config: {
      background_type: "flat", background_value: "#4A3638",
      button_style: "rounded", font_family: "Courier New, monospace",
      button_color: "#EAE1CF", text_color: "#4A3638"
    }
  },
  {
    id: "vintage-light",
    name: "Sergey Amir",
    category: "vintage",
    preview: { bg: "#F6F1E5", btn: "transparent", text: "#CD3D2B", style: "glass" },
    config: {
      background_type: "flat", background_value: "#F6F1E5",
      button_style: "glass", font_family: "Playfair Display, serif",
      button_color: "transparent", text_color: "#CD3D2B"
    }
  },
  {
    id: "forest-glass",
    name: "Roberto Leopoldo",
    category: "nature",
    preview: { bg: "#162822", btn: "#E7F0DA", text: "#162822", style: "rounded" },
    config: {
      background_type: "flat", background_value: "#162822",
      button_style: "rounded", font_family: "DM Sans, sans-serif",
      button_color: "#E7F0DA", text_color: "#162822"
    }
  },
  {
    id: "clean-white",
    name: "Salka Ruslan",
    category: "minimal",
    preview: { bg: "#f8fafc", btn: "#ffffff", text: "#0f172a", style: "rounded" },
    config: {
      background_type: "flat", background_value: "#f8fafc",
      button_style: "rounded", font_family: "Inter, sans-serif",
      button_color: "#ffffff", text_color: "#0f172a"
    }
  },
  {
    id: "warm-earth",
    name: "Monica Vera",
    category: "nature",
    preview: { bg: "#5A5348", btn: "rgba(0,0,0,0.2)", text: "#ffffff", style: "rounded" },
    config: {
      background_type: "flat", background_value: "#5A5348",
      button_style: "rounded", font_family: "DM Sans, sans-serif",
      button_color: "#4A433A", text_color: "#ffffff"
    }
  },
  {
    id: "deep-purple",
    name: "Newlove Store",
    category: "dark",
    preview: { bg: "linear-gradient(180deg, #3A2046 0%, #291535 100%)", btn: "transparent", text: "#ffffff", style: "glass" },
    config: {
      background_type: "gradient", background_value: "linear-gradient(180deg, #3A2046 0%, #291535 100%)",
      button_style: "glass", font_family: "Inter, sans-serif",
      button_color: "transparent", text_color: "#ffffff"
    }
  },
  {
    id: "pastel-blob",
    name: "Lexie Candis",
    category: "gradient",
    preview: { bg: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", btn: "#ffffff", text: "#7C3AED", style: "rounded" },
    config: {
      background_type: "gradient", background_value: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
      button_style: "rounded", font_family: "Inter, sans-serif",
      button_color: "#ffffff", text_color: "#7C3AED"
    }
  },
  {
    id: "cool-grey",
    name: "Indi Montana",
    category: "minimal",
    preview: { bg: "#C1CDD3", btn: "rgba(255,255,255,0.4)", text: "#0f172a", style: "rounded" },
    config: {
      background_type: "flat", background_value: "#C1CDD3",
      button_style: "rounded", font_family: "Space Grotesk, sans-serif",
      button_color: "#D0D9DE", text_color: "#0f172a"
    }
  },
  {
    id: "clean-sand",
    name: "Kevin Sikandar",
    category: "minimal",
    preview: { bg: "#EDEDE1", btn: "#ffffff", text: "#000000", style: "rounded" },
    config: {
      background_type: "flat", background_value: "#EDEDE1",
      button_style: "rounded", font_family: "Inter, sans-serif",
      button_color: "#ffffff", text_color: "#000000"
    }
  },
  {
    id: "aurora",
    name: "Natazia",
    category: "gradient",
    preview: { bg: "linear-gradient(to bottom right, #34D399, #F87171, #FBBF24)", btn: "#ffffff", text: "#000000", style: "rounded" },
    config: {
      background_type: "gradient", background_value: "linear-gradient(to bottom right, #34D399, #F87171, #FBBF24)",
      button_style: "rounded", font_family: "Poppins, sans-serif",
      button_color: "#ffffff", text_color: "#000000"
    }
  }
];

const bgColors = [
  { name: "Lime", value: "eslint(68, 80%, 52%)", hex: "#a3e635" },
  { name: "Violet", value: "hsl(236, 60%, 50%)", hex: "#6366f1" },
  { name: "Rose", value: "hsl(340, 80%, 55%)", hex: "#f43f5e" },
  { name: "Orange", value: "hsl(25, 95%, 53%)", hex: "#f97316" },
  { name: "Teal", value: "hsl(170, 70%, 40%)", hex: "#14b8a6" },
  { name: "Slate", value: "hsl(220, 20%, 30%)", hex: "#334155" },
  { name: "Dark", value: "#0f172a", hex: "#0f172a" },
  { name: "Light", value: "#f8fafc", hex: "#f8fafc" },
];

const fonts = ["Inter, sans-serif", "Space Grotesk, sans-serif", "DM Sans, sans-serif", "Poppins, sans-serif", "Playfair Display, serif", "Courier New, monospace"];

const buttonStyles = [
  { id: "rounded", label: "Rounded" },
  { id: "glass", label: "Glass" },
  { id: "flat", label: "Flat" },
];

const backgroundTypes = [
  { id: "flat", label: "Solid Color" },
  { id: "gradient", label: "Gradient" },
  { id: "image", label: "Image URL" },
];

export default function AppearancePage() {
  const { user } = useAuth();
  const { store } = useMyStore();
  const { theme, isLoading: themeLoading, updateTheme, initializeTheme } = useTheme(store?.id);
  const { links, isLoading: linksLoading } = useLinks(user?.id, store?.id);

  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Advanced Parallax & Scroll Animations
  const { scrollY } = useScroll();
  const scaleProgress = useTransform(scrollY, [0, 300], [0.98, 1]);
  const yProgress = useTransform(scrollY, [0, 300], [0, 15]);
  const shadowProgress = useTransform(scrollY, [0, 300], [
    "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  ]);

  const smoothScale = useSpring(scaleProgress, { stiffness: 100, damping: 20 });
  const smoothY = useSpring(yProgress, { stiffness: 100, damping: 20 });
  // Cannot spring a string directly with framer-motion useSpring in older versions, 
  // but framer motion handles it organically via animate prop if bound to state, or we just trust useTransform for strings.

  // 3D Hover Tilt Effects
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max rotation 5 degrees for a subtle, premium feel
    const rotateXAmount = ((y - centerY) / centerY) * -5;
    const rotateYAmount = ((x - centerX) / centerX) * 5;

    setRotateX(rotateXAmount);
    setRotateY(rotateYAmount);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const [localTheme, setLocalTheme] = useState<{
    background_type: "flat" | "gradient" | "image" | "video";
    background_value: string;
    button_style: "rounded" | "glass" | "flat";
    font_family: string;
    button_color: string;
    text_color: string;
  }>({
    background_type: "flat",
    background_value: "#f8fafc",
    button_style: "rounded",
    font_family: "Inter, sans-serif",
    button_color: "#6366f1",
    text_color: "#0f172a"
  });

  const [bgInput, setBgInput] = useState("");

  useEffect(() => {
    if (theme) {
      setLocalTheme({
        background_type: (theme.background_type as "flat" | "gradient" | "image" | "video") || "flat",
        background_value: theme.background_value || "#f8fafc",
        button_style: (theme.button_style as "rounded" | "glass" | "flat") || "rounded",
        font_family: theme.font_family || "Inter, sans-serif",
        button_color: theme.button_color || "#6366f1",
        text_color: theme.text_color || "#0f172a"
      });
      setBgInput(theme.background_value || "");
    } else if (!themeLoading && store?.id) {
      initializeTheme.mutate();
    }
  }, [theme, themeLoading, store?.id, initializeTheme]);

  const handleChange = (key: string, value: string) => {
    const newTheme = { ...localTheme, [key]: value };
    setLocalTheme(newTheme);
    updateTheme.mutate(newTheme);
  };

  const applyPreset = (presetConfig: any) => {
    setLocalTheme(presetConfig);
    updateTheme.mutate(presetConfig);
  }

  if (themeLoading || linksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 flex animate-spin text-black" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 max-w-[1400px] mx-auto pb-40 relative min-h-screen">
      <div className="flex-1 w-full max-w-3xl mx-auto lg:mx-0 pb-20">

        {/* Profile Editing Section */}
        <ProfileSection />

        <div className="space-y-8">
          {/* Themes Grid */}
          <section className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border/60 p-6 md:p-8 relative overflow-hidden">
            <div className="mb-6 flex flex-col items-center">
              <h2 className="text-[22px] font-bold text-foreground mt-2 mb-1">Select a theme</h2>
              <p className="text-[15px] font-medium text-muted-foreground text-center max-w-sm">Pick the style that feels right - you can add your content later</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.config)}
                  className="group flex flex-col items-center gap-3 transition-transform hover:scale-[1.02]"
                >
                  <div
                    className={`w-full aspect-[1/2] rounded-[16px] overflow-hidden border p-3 flex flex-col items-center justify-center gap-[4px] shadow-sm relative transition-all ${localTheme.background_value === preset.config.background_value ? 'border-[#E28362] ring-2 ring-[#E28362]/50' : 'border-border/40 hover:shadow-md'}`}
                    style={{ background: preset.preview.bg }}
                  >
                    <div className="w-8 h-8 rounded-full border border-black/10 shadow-sm bg-gradient-to-tr from-gray-200 to-gray-400 mb-1" />
                    <div className="w-[60%] h-[4px] rounded-full mt-1 mb-2" style={{ backgroundColor: preset.preview.text, opacity: 0.8 }} />

                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="w-full h-[18px] mb-1.5"
                        style={{
                          backgroundColor: preset.preview.btn,
                          borderRadius: preset.preview.style === 'rounded' ? '12px' : '4px',
                          border: preset.preview.style === 'glass' ? `1px solid ${preset.preview.text}40` : 'none',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[14px] font-bold text-foreground/80">{preset.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Customizer */}
          <section className="space-y-6">
            <h2 className="text-[18px] font-bold text-foreground mt-4 ml-1">Custom appearance</h2>

            {/* Background settings */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-border/60 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="font-semibold text-foreground mb-4">Background Settings</h3>

              <div className="flex gap-2 mb-6 bg-muted/40 p-1.5 rounded-[12px]">
                {backgroundTypes.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => handleChange('background_type', bg.id)}
                    className={`flex-1 py-2 rounded-lg transition-all duration-200 text-[14px] font-bold ${localTheme.background_type === bg.id ? "bg-white text-foreground shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground hover:bg-black/5"}`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>

              {localTheme.background_type === 'flat' && (
                <div>
                  <label className="text-[13px] font-bold mb-3 block text-foreground/70">Preset Colors</label>
                  <div className="flex gap-3 flex-wrap">
                    {bgColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleChange('background_value', color.hex)}
                        className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-200 shadow-sm ${localTheme.background_value === color.hex ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {localTheme.background_value === color.hex && <Check size={18} className={['#f8fafc', '#ffffff'].includes(color.hex) ? "text-black" : "text-white"} />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/50">
                    <input
                      type="color"
                      value={['gradient', 'image'].includes(localTheme.background_type) ? '#ffffff' : localTheme.background_value}
                      onChange={(e) => handleChange('background_value', e.target.value)}
                      className="h-10 w-10 shrink-0 cursor-pointer rounded-lg bg-transparent p-0 border-0"
                    />
                    <span className="text-[14px] font-bold uppercase text-foreground/70">{localTheme.background_value}</span>
                  </div>
                </div>
              )}

              {localTheme.background_type === 'gradient' && (
                <div>
                  <label className="text-[13px] font-bold mb-2 block text-foreground/70">CSS Gradient Value</label>
                  <input
                    type="text"
                    defaultValue={localTheme.background_value}
                    onBlur={(e) => handleChange('background_value', e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E28362]/30 focus:border-[#E28362]/50"
                    placeholder="linear-gradient(135deg, red, blue)"
                  />
                </div>
              )}

              {localTheme.background_type === 'image' && (
                <div>
                  <label className="text-[13px] font-bold mb-2 block text-foreground/70">Background Image URL</label>
                  <input
                    type="text"
                    value={bgInput}
                    onChange={(e) => setBgInput(e.target.value)}
                    onBlur={() => handleChange('background_value', bgInput)}
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-border/60 text-[14px] font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E28362]/30 focus:border-[#E28362]/50"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
            </motion.div>

            {/* Fonts & Texts */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-border/60 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-foreground">Fonts & Colors</h3>

                <div className="flex items-center gap-3 bg-muted/40 p-1.5 pr-3 rounded-xl border border-border/50">
                  <input
                    type="color"
                    value={localTheme.text_color}
                    onChange={(e) => handleChange('text_color', e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded-lg bg-transparent p-0 border-0"
                  />
                  <label className="text-[13px] font-bold text-foreground/80">Text Color</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {fonts.map((font) => (
                  <button
                    key={font}
                    onClick={() => handleChange('font_family', font)}
                    className={`text-left px-5 py-4 rounded-xl transition-all duration-200 border ${localTheme.font_family.includes(font.split(',')[0]) ? "bg-[#E28362]/10 border-[#E28362] ring-1 ring-[#E28362]/50" : "bg-[#FAFAFA] border-border/60 hover:border-black/30 hover:bg-muted/50"}`}
                    style={{ fontFamily: font }}
                  >
                    <span className="text-[15px] font-semibold text-foreground">{font.split(',')[0]}</span>
                    <div className="text-[20px] mt-1 opacity-70">Aa</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-border/60 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-foreground">Button Elements</h3>

                <div className="flex items-center gap-3 bg-muted/40 p-1.5 pr-3 rounded-xl border border-border/50">
                  <input
                    type="color"
                    value={localTheme.button_color}
                    onChange={(e) => handleChange('button_color', e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded-lg bg-transparent p-0 border-0"
                    disabled={localTheme.button_style === 'glass'}
                  />
                  <label className="text-[13px] font-bold text-foreground/80">Button Color</label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {buttonStyles.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleChange('button_style', b.id)}
                    className={`py-6 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-4 ${localTheme.button_style === b.id ? "bg-[#E28362]/10 border-[#E28362] ring-1 ring-[#E28362]/50" : "bg-[#FAFAFA] border-border/60 hover:border-black/30 hover:bg-muted/50"}`}
                  >
                    {b.id === 'rounded' && <div className="w-20 h-10 rounded-[24px] shadow-sm bg-foreground/20" />}
                    {b.id === 'glass' && <div className="w-20 h-10 rounded-xl border border-foreground/30 shadow-lg bg-transparent" />}
                    {b.id === 'flat' && <div className="w-20 h-10 rounded-none border border-border bg-foreground/20 shadow-none" />}

                    <span className="text-[13px] font-bold uppercase tracking-wider text-foreground/80">{b.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </section>
        </div>
      </div>

      {/* Right Side: Advanced Sticky Mobile Preview */}
      <div className="hidden lg:block sticky top-24 self-start h-fit w-[360px] shrink-0 z-10 pb-8">
        <motion.div
          className="w-full h-fit will-change-transform"
          style={{
            scale: smoothScale,
            y: smoothY,
            perspective: 1200
          }}
        >
          <motion.div
            ref={previewRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{
              rotateX,
              rotateY,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.5 }}
            className="w-full h-fit rounded-[56px] transition-all duration-300 transform-gpu relative"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: shadowProgress as any
            }}
          >
            <MobilePreview store={store} theme={{ ...localTheme, id: '', store_id: '', created_at: '', updated_at: '' } as any} links={links} />
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
