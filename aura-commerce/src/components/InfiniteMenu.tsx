import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import './InfiniteMenu.css';

interface MenuItem {
  id: string;
  image: string;
  price: string;
  bgColor: string;
}

interface InfiniteMenuProps {
  items: MenuItem[];
  width?: string;
  height?: string;
}

export const InfiniteMenu = ({ items, width = '420px', height = '500px' }: InfiniteMenuProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Duplicate items for seamless infinite scroll (need at least 2 sets)
  const duplicatedItems = [...items, ...items];

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    
    if (!container || !content) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    let animationId: number;

    const animate = () => {
      scrollPosition += scrollSpeed;
      
      // Reset when we've scrolled through one set of items
      const itemHeight = 120 + 16; // minHeight + gap
      const setHeight = items.length * itemHeight;
      
      if (scrollPosition >= setHeight) {
        scrollPosition = 0;
      }
      
      if (content) {
        content.style.transform = `translateY(-${scrollPosition}px)`;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className="infinite-menu-container"
      style={{
        width,
        height,
      }}
    >
      <div
        ref={contentRef}
        className="infinite-menu-content"
      >
        {duplicatedItems.map((item, index) => (
          <motion.div
            key={`${item.id}-${index}`}
            className="infinite-menu-card"
            style={{
              backgroundColor: item.bgColor,
            }}
            whileHover={{ scale: 1.03 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="flex flex-col items-center justify-center p-6 h-full">
              <div className="w-20 h-20 mb-3 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shadow-md">
                <img
                  src={item.image}
                  alt={`Product ${item.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-xl font-bold">{item.price}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
