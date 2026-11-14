import type { Metadata } from "next";
import { KitchenApp } from "./_components/KitchenApp";
import "../stock/stock.css";
import "./kitchen.css";
export const metadata: Metadata = {
  title: "Stock de cocina",
  robots: { index: false, follow: false },
};
export default function KitchenPage() {
  return <KitchenApp />;
}
