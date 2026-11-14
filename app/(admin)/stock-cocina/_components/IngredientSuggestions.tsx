import {
  CATEGORIES,
  type KitchenItem,
} from "../../../../src/kitchen-stock/types";
import { countLabel } from "../../../../src/kitchen-stock/model";
export function IngredientSuggestions({
  matches,
  activeIndex,
  disabled,
  onSelect,
}: {
  matches: KitchenItem[];
  activeIndex: number;
  disabled: boolean;
  onSelect: (item: KitchenItem) => void;
}) {
  return (
    <ul
      id="ingredient-matches"
      className="kitchen-matches"
      role="listbox"
      aria-label="Ingredientes existentes"
    >
      {matches.map((item, index) => (
        <li
          id={`match-${index}`}
          key={item.id}
          role="option"
          aria-selected={index === activeIndex}
          aria-disabled={disabled || undefined}
          onPointerDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            if (!disabled) onSelect(item);
          }}
        >
          <span>
            <strong>{item.name}</strong>
            <small>
              {CATEGORIES.find((c) => c.id === item.category)?.label} ·{" "}
              {countLabel(item)}
            </small>
          </span>
          <span>Usar existente</span>
        </li>
      ))}
    </ul>
  );
}
