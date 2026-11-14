import type { Metadata } from "next";
import { SalonApp } from "./_components/SalonApp";
import "../stock/stock.css";
import "./salon.css";
export const metadata: Metadata = {
  title: "Stock Salón",
  robots: { index: false, follow: false },
};
export default function SalonPage() {
  return <SalonApp />;
}
