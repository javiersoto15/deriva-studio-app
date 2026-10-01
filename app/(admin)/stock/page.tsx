import type { Metadata } from "next";
import { StockApp } from "./_components/StockApp";
import "./stock.css";

export const metadata: Metadata = {
  title: "Stock de barra",
  robots: { index: false, follow: false }
};

export default function StockPage() {
  return <StockApp />;
}
