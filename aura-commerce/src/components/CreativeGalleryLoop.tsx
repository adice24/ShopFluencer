import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/* ─── Poster Data ────────────────────────────────────────────────── */
const POSTER_CARDS = [
    {
        id: 1,
        tag: "LIVE · COMMERCE",
        headline: "Sell While\nThey Scroll",
        sub: "Real-time revenue, zero effort",
        bg: "linear-gradient(155deg, #2d0a4e 0%, #5b21b6 50%, #7c3aed 85%, #9333ea 100%)",
        accent: "#c4b5fd",
        glow: "rgba(139,92,246,0.65)",
        emoji: "⚡",
        issue: "VOL. 01",
    },
    {
        id: 2,
        tag: "ANALYTICS · DATA",
        headline: "Timing Is\nEverything",
        sub: "Post when it counts most",
        bg: "linear-gradient(155deg, #7c2d12 0%, #c2410c 50%, #ea580c 85%, #f97316 100%)",
        accent: "#fed7aa",
        glow: "rgba(234,88,12,0.65)",
        emoji: "📈",
        issue: "VOL. 02",
    },
    {
        id: 3,
        tag: "BRANDING · IDENTITY",
        headline: "Be The Brand\nThey Notice",
        sub: "Stand out in every scroll",
        bg: "linear-gradient(155deg, #09090b 0%, #18181b 50%, #27272a 85%, #3f3f46 100%)",
        accent: "#f4f4f5",
        glow: "rgba(244,244,245,0.2)",
        emoji: "◆",
        issue: "VOL. 03",
    },
    {
        id: 4,
        tag: "MONETIZE · GROW",
        headline: "Your Link.\nYour Empire.",
        sub: "One link. Infinite reach.",
        bg: "linear-gradient(155deg, #052e16 0%, #064e3b 50%, #059669 85%, #10b981 100%)",
        accent: "#a7f3d0",
        glow: "rgba(16,185,129,0.65)",
        emoji: "🔗",
        issue: "VOL. 04",
    },
    {
        id: 5,
        tag: "STRATEGY · CONTENT",
        headline: "Viral\nBy Design",
        sub: "Engineered for the algorithm",
        bg: "linear-gradient(155deg, #1e0546 0%, #2e1065 50%, #4c1d95 85%, #5b21b6 100%)",
        accent: "#ddd6fe",
        glow: "rgba(109,40,217,0.65)",
        emoji: "🚀",
        issue: "VOL. 05",
    },
    {
        id: 6,
        tag: "SALES · CONVERSION",
        headline: "Content\nThat Converts",
        sub: "Turn views into revenue",
        bg: "linear-gradient(155deg, #4c0519 0%, #881337 50%, #be123c 85%, #e11d48 100%)",
        accent: "#fecdd3",
        glow: "rgba(190,18,60,0.65)",
        emoji: "🎯",
        issue: "VOL. 06",
    },
];

/* ─── Individual Poster Card ────────────────────────────────────── */
interface PosterCardProps {
    card: (typeof POSTER_CARDS)[0];
}

const PosterCard = ({ card }: PosterCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            style={{
                position: "relative",
                flexShrink: 0,
                width: "210px",
                height: "310px",
                cursor: "default",
                willChange: "transform",
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{
                scale: 1.07,
                rotateY: 6,
                rotateX: -3,
                z: 50,
                transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
            }}
        >
            {/* ── Ambient glow orb ── */}
            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: "-25%",
                    borderRadius: "50%",
                    background: card.glow,
                    filter: "blur(36px)",
                    pointerEvents: "none",
                    willChange: "opacity",
                }}
                animate={{ opacity: isHovered ? 0.9 : 0.28 }}
                transition={{ duration: 0.38 }}
            />

            {/* ── Card body ── */}
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: "20px",
                    overflow: "hidden",
                    background: card.bg,
                    border: `1px solid ${card.accent}1a`,
                    willChange: "box-shadow",
                }}
                animate={{
                    boxShadow: isHovered
                        ? `0 28px 70px rgba(0,0,0,0.75), 0 0 0 1px ${card.accent}28, inset 0 1px 0 ${card.accent}30`
                        : `0 8px 36px rgba(0,0,0,0.55), inset 0 1px 0 ${card.accent}18`,
                }}
                transition={{ duration: 0.38 }}
            >
                {/* Top shine layer */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "45%",
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Noise texture overlay via SVG data URI */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0.055,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundSize: "140px",
                        pointerEvents: "none",
                    }}
                />

                {/* ── Card Content ── */}
                <div
                    style={{
                        position: "relative",
                        padding: "22px 20px 18px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        zIndex: 1,
                    }}
                >
                    {/* Top row: tag + issue number */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "8.5px",
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                color: card.accent,
                                opacity: 0.78,
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                textTransform: "uppercase",
                            }}
                        >
                            {card.tag}
                        </span>
                        <span
                            style={{
                                fontSize: "8.5px",
                                color: card.accent,
                                opacity: 0.38,
                                fontFamily: "system-ui, sans-serif",
                                letterSpacing: "0.06em",
                            }}
                        >
                            {card.issue}
                        </span>
                    </div>

                    {/* Middle: emoji + bold headline */}
                    <div>
                        <motion.div
                            style={{
                                fontSize: "30px",
                                marginBottom: "12px",
                                filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.6))",
                                display: "inline-block",
                            }}
                            animate={{ y: isHovered ? -4 : 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {card.emoji}
                        </motion.div>
                        <h3
                            style={{
                                color: "#ffffff",
                                fontSize: "24px",
                                fontWeight: 900,
                                lineHeight: 1.08,
                                letterSpacing: "-0.025em",
                                fontFamily:
                                    "'Arial Black', 'Helvetica Neue', system-ui, sans-serif",
                                whiteSpace: "pre-line",
                                textShadow: "0 2px 20px rgba(0,0,0,0.7)",
                                margin: 0,
                            }}
                        >
                            {card.headline}
                        </h3>
                    </div>

                    {/* Bottom: frosted glass data strip */}
                    <div
                        style={{
                            background: "rgba(0,0,0,0.38)",
                            backdropFilter: "blur(14px)",
                            WebkitBackdropFilter: "blur(14px)",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.07)",
                            padding: "10px 14px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                color: card.accent,
                                fontSize: "10px",
                                fontWeight: 500,
                                opacity: 0.82,
                                fontFamily: "system-ui, sans-serif",
                                lineHeight: 1.4,
                            }}
                        >
                            {card.sub}
                        </span>
                        <motion.span
                            style={{
                                color: card.accent,
                                fontSize: "15px",
                                opacity: 0.65,
                                display: "inline-block",
                            }}
                            animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.65 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                        >
                            →
                        </motion.span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ─── Main Section Export ───────────────────────────────────────── */
export const CreativeGalleryLoop = () => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const inView = useInView(sectionRef, { once: true, margin: "-80px" });

    const row1 = [...POSTER_CARDS, ...POSTER_CARDS]; // 12 → seamless loop
    const row2 = [
        ...[...POSTER_CARDS].reverse(),
        ...[...POSTER_CARDS].reverse(),
    ];

    return (
        <>
            {/* ── CSS Keyframes injected once ── */}
            <style>{`
        @keyframes cgl-scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes cgl-scroll-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .cgl-track-left {
          animation: cgl-scroll-left 48s linear infinite;
          will-change: transform;
        }
        .cgl-track-right {
          animation: cgl-scroll-right 54s linear infinite;
          will-change: transform;
        }
        .cgl-track-left:hover,
        .cgl-track-right:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .cgl-track-left, .cgl-track-right {
            animation: none !important;
          }
        }
      `}</style>

            <section
                ref={sectionRef}
                aria-label="Creative showcase gallery"
                style={{
                    background: "#060606",
                    padding: "88px 0 80px",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* ── Background ambient glow blob ── */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "42%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "700px",
                        height: "350px",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, rgba(99,102,241,0.04) 50%, transparent 75%)",
                        filter: "blur(80px)",
                        pointerEvents: "none",
                    }}
                />

                {/* ── Section Header ── */}
                <motion.div
                    style={{ textAlign: "center", marginBottom: "56px", padding: "0 24px" }}
                    initial={{ opacity: 0, y: 32 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Pill badge */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "rgba(52,211,153,0.09)",
                            border: "1px solid rgba(52,211,153,0.22)",
                            borderRadius: "100px",
                            padding: "6px 18px",
                            marginBottom: "20px",
                        }}
                    >
                        <span
                            style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: "#34d399",
                                display: "inline-block",
                                boxShadow: "0 0 8px rgba(52,211,153,0.8)",
                            }}
                        />
                        <span
                            style={{
                                color: "#34d399",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                fontFamily: "system-ui, sans-serif",
                            }}
                        >
                            Creative Showcase
                        </span>
                    </div>

                    {/* Heading */}
                    <h2
                        style={{
                            color: "#f8fafc",
                            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                            fontWeight: 900,
                            letterSpacing: "-0.035em",
                            lineHeight: 1.08,
                            fontFamily:
                                "'Arial Black', 'Helvetica Neue', system-ui, sans-serif",
                            margin: "0 0 14px",
                        }}
                    >
                        Content That Wins.{" "}
                        <br />
                        <span
                            style={{
                                background:
                                    "linear-gradient(90deg, #34d399 0%, #6ee7b7 50%, #a7f3d0 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            Built on ShopFluence.
                        </span>
                    </h2>

                    {/* Subtext */}
                    <p
                        style={{
                            color: "rgba(248,250,252,0.42)",
                            fontSize: "16px",
                            maxWidth: "440px",
                            margin: "0 auto",
                            lineHeight: 1.65,
                            fontFamily: "system-ui, sans-serif",
                        }}
                    >
                        Thousands of creators turn their influence into income — every post,
                        every link, every sale.
                    </p>
                </motion.div>

                {/* ── Marquee rows ── */}
                <motion.div
                    style={{ position: "relative" }}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.9, delay: 0.28 }}
                >
                    {/* Left edge gradient mask */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "140px",
                            background:
                                "linear-gradient(to right, #060606 0%, transparent 100%)",
                            zIndex: 10,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Right edge gradient mask */}
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: "140px",
                            background:
                                "linear-gradient(to left, #060606 0%, transparent 100%)",
                            zIndex: 10,
                            pointerEvents: "none",
                        }}
                    />

                    {/* ── Row 1: scroll left ── */}
                    <div style={{ marginBottom: "22px", paddingTop: "16px" }}>
                        <div
                            className="cgl-track-left"
                            style={{
                                display: "flex",
                                gap: "22px",
                                width: "max-content",
                                perspective: "1400px",
                            }}
                        >
                            {row1.map((card, i) => (
                                <PosterCard key={`r1-${card.id}-${i}`} card={card} />
                            ))}
                        </div>
                    </div>

                    {/* ── Row 2: scroll right ── */}
                    <div style={{ paddingBottom: "16px" }}>
                        <div
                            className="cgl-track-right"
                            style={{
                                display: "flex",
                                gap: "22px",
                                width: "max-content",
                                perspective: "1400px",
                            }}
                        >
                            {row2.map((card, i) => (
                                <PosterCard key={`r2-${card.id}-${i}`} card={card} />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>
        </>
    );
};

export default CreativeGalleryLoop;
