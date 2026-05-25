"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicMenuSection } from "../../api/server";

type Props = {
  sections: PublicMenuSection[];
};

// Friendlier labels per section id — falls back to the section title with the
// trailing "." stripped.
const SECTION_CHIP_LABELS: Record<string, string> = {
  cafeteria: "Cafetería",
  "desayunos-weekday": "Desayunos",
  "desayunos-weekend": "Desayunos y Once",
  pasteleria: "Pastelería",
  "menu-ejecutivo": "Menu Ejecutivo",
  onces: "Onces"
};

function chipLabel(section: PublicMenuSection): string {
  return SECTION_CHIP_LABELS[section.id] ?? section.title.replace(/\.$/, "");
}

export function MenuChipNav({ sections }: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const trackedIds = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    const elements = trackedIds
      .map((id) => document.getElementById(`section-${id}`))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id.replace("section-", "");
          setActiveId(id);
        }
      },
      {
        rootMargin: "-120px 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [trackedIds]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav className="menu-chipnav" aria-label="Categorías de la carta">
      <div className="menu-chipnav__row">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#section-${section.id}`}
            onClick={(e) => handleClick(e, section.id)}
            className={`menu-chip ${activeId === section.id ? "menu-chip--active" : ""}`}
            aria-current={activeId === section.id ? "true" : undefined}
          >
            {chipLabel(section)}
          </a>
        ))}
      </div>
    </nav>
  );
}
