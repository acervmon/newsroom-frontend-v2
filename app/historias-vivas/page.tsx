"use client";
export const dynamic = "force-dynamic";
 
import React, { useState, useEffect, useContext, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LanguageContext } from "../RootProviders";
import { SearchContext } from "@/context/SearchContext";
import { Merriweather } from "next/font/google";
import { EntrevistasContext, Entrevista } from "@/context/EntrevistasContext";
 
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-merriweather",
});
 
// ✅ Normaliza el idioma (ES / EN)
const getLangKey = (lang: string) =>
  lang.toUpperCase() === "ES" ? "ES" : "EN";
 
// --- Función para formatear countdown ---
function formatCountdown(diffMs: number) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
 
export default function HistoriasVivas() {
  const { language } = useContext(LanguageContext);
  const { dateFilter } = useContext(SearchContext);
 
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [recentLikes, setRecentLikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | null>(null);
  const [loading, setLoading] = useState(true);
 
  const targetDate = new Date("2026-03-03T00:00:00");
  const [countdown, setCountdown] = useState("");
  const [beforeNewYear, setBeforeNewYear] = useState(true);
 
  // --- Countdown ---
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      setBeforeNewYear(diff > 0);
      setCountdown(formatCountdown(diff));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
 
  // --- Fetch entrevistas dinámico ---
  useEffect(() => {
    if (beforeNewYear) return;
 
    fetch("/api/entrevistas")
      .then((res) => res.json())
      .then((data) => setEntrevistas(data?.entrevistas || []))
      .catch(() => setEntrevistas([]))
      .finally(() => setLoading(false));
  }, [beforeNewYear]);
 
  // --- Entrevista reciente ---
  const entrevistaReciente = useMemo(() => {
    if (beforeNewYear || entrevistas.length === 0) return null;
 
    if (dateFilter) {
      return entrevistas.find((e) => e.fechaISO === dateFilter) || entrevistas[0];
    }
 
    return [...entrevistas].sort((a, b) =>
      b.fechaISO.localeCompare(a.fechaISO)
    )[0];
  }, [entrevistas, dateFilter, beforeNewYear]);
 
  const otrasEntrevistas = entrevistas.filter((e) => e !== entrevistaReciente);
 
  if (loading && !beforeNewYear) {
    return (
      <p className="text-center py-12 text-[var(--color-foreground)]">
        {language === "ES" ? "Cargando entrevistas..." : "Loading interviews..."}
      </p>
    );
  }
 
  return (
    <EntrevistasContext.Provider value={{ entrevistas }}>
      <div
        className={`${merriweather.variable} bg-white min-h-screen text-[var(--color-foreground)] px-4 md:px-16 py-12 space-y-16`}
      >
        {/* Countdown */}
        {beforeNewYear && (
          <section className="bg-[var(--color-card)]/40 rounded-3xl shadow-lg p-12 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl md:text-4xl mb-4 font-bold">
              {language === "ES"
                ? "Próximamente entrevistas"
                : "Interviews coming soon"}
            </h1>
            <p className="text-lg mb-6">
              {language === "ES"
                ? "Las entrevistas se publicarán aquí:"
                : "Interviews will be published here:"}
            </p>
            <div className="text-4xl md:text-6xl font-bold text-[var(--color-foreground)]">
              {countdown}
            </div>
          </section>
        )}
 
        {/* Entrevista reciente */}
        {!beforeNewYear && entrevistaReciente && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-[var(--color-card)] rounded-3xl shadow-md p-6 md:p-10 hover:shadow-[var(--color-accent)]/50 transition cursor-pointer"
          >
            <h1 className="text-3xl md:text-4xl mb-2">
              {entrevistaReciente.titulo[getLangKey(language)]}
            </h1>
 
            <h2 className="text-md md:text-lg text-gray-700 mb-4">
              {entrevistaReciente.fecha}
            </h2>
 
            {entrevistaReciente.videoUrl ? (
              <video
                className="w-full h-64 md:h-80 rounded-lg mb-4"
                controls
                src={entrevistaReciente.videoUrl}
              />
            ) : (
              <div className="w-full h-64 md:h-80 bg-gray-300 rounded-lg flex items-center justify-center font-semibold text-gray-600 mb-4">
                {language === "ES" ? "Video no disponible" : "Video not available"}
              </div>
            )}
 
            <p className="text-lg leading-relaxed line-clamp-4">
              {entrevistaReciente.descripcion[getLangKey(language)]}
            </p>
 
            <div className="flex items-center space-x-4 mt-4">
              <button
                disabled={!!userVote}
                onClick={() => {
                  if (!userVote) {
                    setRecentLikes(recentLikes + 1);
                    setUserVote("like");
                  }
                }}
                className="flex items-center space-x-1 px-4 py-2 rounded-md border-2 border-[var(--color-foreground)] hover:bg-[var(--color-accent)] hover:text-white transition"
              >
                👍 <span>{recentLikes + entrevistaReciente.likes}</span>
              </button>
            </div>
          </motion.section>
        )}
 
        {/* Otras entrevistas */}
        {!beforeNewYear && otrasEntrevistas.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl mb-6">
              {language === "ES"
                ? "Otras entrevistas que podrían interesarte"
                : "Other interviews you might be interested in"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {otrasEntrevistas.map((e) => (
                <Link
                  key={e.id}
                  href={`/historias-vivas/${e.id}`}
                  className="group"
                >
                  <motion.div
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    }}
                    className="flex flex-col md:flex-row bg-[var(--color-card)] rounded-2xl shadow-md p-4 transition cursor-pointer"
                  >
                    <div className="w-full md:w-48 h-32 bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 mb-2 md:mb-0 md:mr-4">
                      {language === "ES" ? "Video" : "Video"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl mb-1 line-clamp-2">
                        {e.titulo[getLangKey(language)]}
                      </h3>
 
                      <p className="text-gray-700 text-sm mb-2">
                        {language === "ES" ? "Fecha" : "Date"}: {e.fecha}
                      </p>
 
                      <p className="text-gray-700 line-clamp-3 mb-2">
                        {e.descripcion[getLangKey(language)]}
                      </p>
 
                      <span className="text-sm text-[var(--color-foreground)]">
                        👍 {e.likes}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}
 
        {!beforeNewYear && entrevistaReciente === null && (
          <section className="text-center py-12">
            {language === "ES"
              ? "No hay entrevistas disponibles"
              : "No interviews available"}
          </section>
        )}
      </div>
    </EntrevistasContext.Provider>
  );
}
 