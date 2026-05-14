"use client";

import { useEffect, useState } from "react";
import type { MenuSection } from "../../data/menu";

type Props = {
  sections: MenuSection[];
};

export function MenuChipNav({ sections }: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const elements = ids
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
  }, [sections]);

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
            {section.id === "desayunos"
              ? "Desayunos"
              : section.id === "pasteleria"
                ? "Pastelería"
                : section.title.replace(".", "")}
          </a>
        ))}
      </div>
    </nav>
  );
}
