"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CategoryTabs({ categories, active, onChange }: { categories: string[]; active: string; onChange: (category: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => ref.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  return (
    <div className="category-tabs-wrap">
      <button className="category-scroll left" onClick={() => scroll(-1)} aria-label="Scroll categories left"><ChevronLeft size={17} /></button>
      <div className="category-tabs" ref={ref}>
        {categories.map((category) => (
          <button className={active === category ? "active" : ""} key={category} onClick={() => onChange(category)}>{category}</button>
        ))}
      </div>
      <button className="category-scroll right" onClick={() => scroll(1)} aria-label="Scroll categories right"><ChevronRight size={17} /></button>
    </div>
  );
}
