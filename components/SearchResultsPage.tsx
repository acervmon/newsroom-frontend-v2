"use client";

import { useContext, useMemo, useState } from "react";
<<<<<<< Updated upstream
import { NewsContext, Contenido } from "@/context/NewsContext";
import { SearchContext } from "@/context/SearchContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageContext } from "@/app/RootProviders";
=======
import { NewsContext, Contenido } from "../context/NewsContext";
import { SearchContext } from "../context/SearchContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageContext } from "../app/RootProviders";
>>>>>>> Stashed changes

type SortOption = "title-asc" | "title-desc";

export default function SearchResultsPage() {
  const router = useRouter();

  const { articles } = useContext(NewsContext);
  const { keyword, setKeyword, setDateFilter } = useContext(SearchContext);
  const { language } = useContext(LanguageContext);

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");

  /* =========================
<<<<<<< Updated upstream
=======
     TRADUCCIONES
  ========================= */
  const t = {
    es: {
      resultsFor: "Resultados para",
      goBack: "← Volver",
      sortBy: "Ordenar por:",
      noResults: "No se encontraron artículos relacionados.",
      readMore: "Leer artículo",
      titleAsc: "Título A–Z",
      titleDesc: "Título Z–A",
      searchPlaceholder: "Buscar noticias…",
    },
    en: {
      resultsFor: "Results for",
      goBack: "← Go back",
      sortBy: "Sort by:",
      noResults: "No related articles found.",
      readMore: "Read article",
      titleAsc: "Title A–Z",
      titleDesc: "Title Z–A",
      searchPlaceholder: "Search news…",
    },
  };

  const tr = language === "EN" ? t.en : t.es;

  /* =========================
     PROTECCIÓN CLAVE PARA AMPLIFY
  ========================= */
  if (!articles || articles.length === 0) {
    return null;
  }

  /* =========================
>>>>>>> Stashed changes
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
    if (!articles || articles.length === 0) return [];

    let filtered = [...articles];

    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      filtered = filtered.filter(a =>
        `${a.title} ${a.subtitle ?? ""} ${a.body ?? ""}`
          .toLowerCase()
          .includes(q)
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
<<<<<<< Updated upstream
      {/* UI intacta */}
=======

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {tr.resultsFor} “{keyword}”
        </h1>

        <button
          onClick={handleGoBack}
          className="text-[var(--color-accent)] font-medium hover:underline"
        >
          {tr.goBack}
        </button>
      </div>

      {/* BUSCADOR */}
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <input
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
          placeholder={tr.searchPlaceholder}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:opacity-90 transition"
        >
          Buscar
        </button>
      </form>

      {/* ORDENAR */}
      <div className="flex items-center gap-2">
        <span className="font-medium">{tr.sortBy}</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="title-asc">{tr.titleAsc}</option>
          <option value="title-desc">{tr.titleDesc}</option>
        </select>
      </div>

      {/* RESULTADOS */}
      {results.length === 0 ? (
        <p className="text-[var(--color-gray)] text-lg">
          {tr.noResults}
        </p>
      ) : (
        <AnimatePresence>
          <div className="space-y-6">
            {results.map(article => (
              <motion.div
                key={article.url}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="bg-[var(--color-card)] border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  {cleanText(article.title)}
                </h2>

                {article.subtitle && (
                  <p className="text-[var(--color-gray)] mt-2">
                    {cleanText(article.subtitle)}
                  </p>
                )}

                {formatDate(article.date) && (
                  <p className="text-sm text-[var(--color-gray)] mt-1">
                    {formatDate(article.date)}
                  </p>
                )}

                <button
                  onClick={() => handleReadMore(article)}
                  className="mt-4 inline-block text-[var(--color-accent)] font-semibold hover:underline"
                >
                  {tr.readMore}
                </button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
>>>>>>> Stashed changes
    </div>
  );
}
