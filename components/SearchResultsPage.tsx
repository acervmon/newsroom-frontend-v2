"use client";

import { useContext, useMemo, useState } from "react";
import { NewsContext, Contenido } from "@/context/NewsContext";
import { SearchContext } from "@/context/SearchContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageContext } from "@/app/RootProviders";

type SortOption = "title-asc" | "title-desc";

export default function SearchResultsPage() {
  const router = useRouter();

  const { articles } = useContext(NewsContext);
  const { keyword, setKeyword, setDateFilter } = useContext(SearchContext);
  const { language } = useContext(LanguageContext);

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");

  /* =========================
     UTILIDADES
  ========================= */
  const cleanText = (text = "") =>
    text
      .replace(/\*\*/g, "")
      .replace(/(Título|Title|Subtítulo|Subtitle|Fecha|Date):/gi, "")
      .trim();

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(
      language === "EN" ? "en-GB" : "es-ES",
      { day: "2-digit", month: "short", year: "numeric" }
    );
  };

  /* =========================
     FILTRADO
  ========================= */
  const results = useMemo(() => {
    let filtered = [...articles];

    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      filtered = filtered.filter(a =>
        `${a.title} ${a.subtitle ?? ""}`.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) =>
      sortBy === "title-asc"
        ? cleanText(a.title).localeCompare(cleanText(b.title))
        : cleanText(b.title).localeCompare(cleanText(a.title))
    );

    return filtered;
  }, [articles, keyword, sortBy]);

  /* =========================
     ACCIONES
  ========================= */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(localKeyword);
    router.push(`/buscar?keyword=${encodeURIComponent(localKeyword)}`);
  };

  const handleReadMore = (article: Contenido) => {
    setDateFilter(article.date);
    router.push(`/secciones/${article.section}`);
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* UI intacta */}
    </div>
  );
}
