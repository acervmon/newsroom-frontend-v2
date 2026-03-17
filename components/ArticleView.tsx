"use client";

import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import RecommendationsGrid from "./RecommendationsGrid";
import { LanguageContext } from "../app/RootProviders";




/* ───────── ICONOS FLASHCARDS ───────── */
const iconMap: Record<string, string> = {
  Economía: "/icons/Economy.png",
  Economy: "/icons/Economy.png",
  Sociedad: "/icons/Society.png",
  Society: "/icons/Society.png",
  Futuro: "/icons/Future.png",
  Future: "/icons/Future.png",
};

/* ───────── LABELS ───────── */
const labels = {
  es: {
    brief: "En breve",
    why: "¿Por qué importa?",
    opinion: "¿Qué opinas?",
    debate: "Debate",
    placeholder: "Escribe tu opinión…",
    anonymous: "Publicar como anónimo",
    send: "Enviar",
    name: "Tu nombre (opcional)",
    votes: "votos",
  },
  en: {
    brief: "In brief",
    why: "Why it matters",
    opinion: "What do you think?",
    debate: "Discussion",
    placeholder: "Write your opinion…",
    anonymous: "Post anonymously",
    send: "Send",
    name: "Your name (optional)",
    votes: "votes",
  },
};

type Flashcard = {
  title: string;
  summary: string;
};

type Poll = {
  question: string;
  options: string[];
  votes: number[];
};

export default function ArticleView({ article, allArticles }: any) {
  const { language } = useContext(LanguageContext);
  const lang = language.toLowerCase() as "es" | "en";
  const t = labels[lang];

  const [bullets, setBullets] = useState<string[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [anonymous, setAnonymous] = useState(true);
  const [comment, setComment] = useState("");

  /* ───────── HELPERS ───────── */
  const cleanText = (text?: string) =>
    text?.replace(/^(Título:|Title:|Subtítulo:|Subtitle:)\s*/i, "") || "";

  const title =
    cleanText(lang === "en" ? article.title_en : article.title_es) ||
    cleanText(article.title) ||
    "Sin título";

  const subtitle =
    cleanText(lang === "en" ? article.subtitle_en : article.subtitle_es) ||
    cleanText(article.subtitle) ||
    "";

  const txtUrl =
    (lang === "en" ? article.txtUrl_en : article.txtUrl_es) ||
    article.txtUrl ||
    "";

  const imageUrl = txtUrl
    ? txtUrl.replace("article.txt", "image.jpg")
    : "/default-image.jpg";

  /* ───────── PARSE TXT ───────── */
  useEffect(() => {
    if (!txtUrl) return;

    fetch(txtUrl)
      .then((r) => r.text())
      .then((txt) => {
        const lines = txt.split("\n");

        const b: string[] = [];
        const f: Flashcard[] = [];
        const p: Poll[] = [];

        let section = "";
        let currentFlashcard: Flashcard | null = null;
        let currentPoll: Poll | null = null;

        lines.forEach((raw) => {
          const line = raw.trim();
          if (!line) return;

          /* CAMBIO DE SECCIÓN */
          if (line.startsWith("---")) {
            if (currentFlashcard) {
              f.push(currentFlashcard);
              currentFlashcard = null;
            }
            if (currentPoll) {
              p.push(currentPoll);
              currentPoll = null;
            }
            section = line;
            return;
          }

          /* BULLETS */
          if (section === "---BULLETS---" && line.startsWith("-")) {
            b.push(line.replace(/^-\s*/, ""));
          }

          /* FLASHCARDS */
          if (section === "---FLASHCARDS---") {
            // 1. Economía - Texto o Economía: Texto o Economía - Texto
            const flashcardMatch = line.match(/^\d*\.\s*([^-:]+)[-:]?\s*(.*)$/);
            if (flashcardMatch) {
              if (currentFlashcard) f.push(currentFlashcard);
              currentFlashcard = {
                title: flashcardMatch[1].trim(),
                summary: flashcardMatch[2].trim(),
              };
              return;
            }

            // NUEVO FORMATO: solo Título: Texto (como el ejemplo que me pasaste)
            const simpleMatch = line.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ ]+)\s*[:]\s*(.*)$/);
            if (simpleMatch) {
              if (currentFlashcard) f.push(currentFlashcard);
              currentFlashcard = {
                title: simpleMatch[1].trim(),
                summary: simpleMatch[2].trim(),
              };
              return;
            }

            // Continúa agregando texto si ya existe (para multilinea)
            if (currentFlashcard) {
              currentFlashcard.summary +=
                (currentFlashcard.summary ? " " : "") + line;
            }
          }

          /* POLLS */
          if (section === "---POLLS---") {
            // Detecta formato: 1. Pregunta Sí/No o 1) Pregunta
            const pollMatch = line.match(/^\d+[\.\)]\s*(.*)$/);
            if (pollMatch) {
              if (currentPoll) p.push(currentPoll);

              let question = pollMatch[1].trim();
              const inlineYesNo = question.match(/\b(Sí\/No|Si\/No|Yes\/No)\b/i);
              if (inlineYesNo) {
                const options = inlineYesNo[0].split("/").map((o) => o.trim());
                question = question.replace(inlineYesNo[0], "").trim();
                currentPoll = { question, options, votes: Array(options.length).fill(0) };
              } else {
                currentPoll = { question, options: [], votes: [] };
              }
              return;
            }

            // Detecta opciones con guion -
            if (currentPoll && line.startsWith("-")) {
              const option = line.replace(/^-\s*/, "");
              currentPoll.options.push(option);
              currentPoll.votes.push(0);
            }
          }
        });

        if (currentFlashcard) f.push(currentFlashcard);
        if (currentPoll) p.push(currentPoll);

        setBullets(b);
        setFlashcards(f);
        setPolls(p);
      });
  }, [txtUrl, lang]);

  /* ───────── VOTAR ───────── */
  const vote = (pollIndex: number, optionIndex: number) => {
    if (answers[pollIndex] !== undefined) return;

    setAnswers({ ...answers, [pollIndex]: optionIndex });

    setPolls((prev) =>
      prev.map((poll, i) =>
        i === pollIndex
          ? {
              ...poll,
              votes: poll.votes.map((v, j) =>
                j === optionIndex ? v + 1 : v
              ),
            }
          : poll
      )
    );
  };

  return (
    <article className="max-w-6xl mx-auto px-6 py-20 space-y-28">
      {/* HEADER */}
      <header>
        <h1 className="text-6xl font-extrabold mb-4">{title}</h1>
        {subtitle && <p className="text-3xl text-gray-600">{subtitle}</p>}
      </header>

      {/* EN BREVE + IMAGEN */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-300/50 rounded-3xl p-8 shadow-xl">
          <h3 className="font-extrabold text-3xl mb-4">{t.brief}</h3>
          <ul className="list-disc list-inside space-y-3 text-lg">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl shadow-xl overflow-hidden">
          <img src={imageUrl} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* FLASHCARDS */}
      {flashcards.length > 0 && (
        <section>
          <h2 className="text-4xl font-extrabold mb-14">{t.why}</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {flashcards.map((c, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.07 }}
                className="bg-white rounded-3xl p-12 text-center shadow-xl"
              >
                <img
                  src={iconMap[c.title] || "/icons/Future.png"}
                  className="w-24 h-24 mx-auto mb-8"
                />
                <h3 className="font-bold text-2xl mb-5">{c.title}</h3>
                <p className="text-gray-600 text-lg">{c.summary}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* POLLS */}
      {polls.length > 0 && (
        <section>
          <h2 className="text-4xl font-extrabold mb-14">{t.opinion}</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {polls.map((poll, pi) => {
              const maxVotes = Math.max(...poll.votes, 0);

              return (
                <div key={pi} className="bg-white p-12 rounded-3xl shadow-xl">
                  <p className="text-2xl font-semibold mb-10 text-center">
                    {poll.question}
                  </p>

                  <div className="flex gap-6 justify-center">
                    {poll.options.map((o, oi) => (
                      <div key={oi} className="text-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={answers[pi] !== undefined}
                          onClick={() => vote(pi, oi)}
                          className={`px-10 py-5 rounded-full font-bold text-xl ${
                            answers[pi] === oi
                              ? "bg-gray-500 text-white"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {o}
                        </motion.button>

                        {maxVotes > 0 && (
                          <p className="mt-2 text-sm text-gray-600">
                            {poll.votes[oi]} {t.votes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}


      {/* DEBATE */}
      <section>
        <h2 className="text-4xl font-extrabold mb-8">{t.debate}</h2>

        {/* ---------- ESTADOS EXTRAS PARA EL DEBATE ---------- */}
        {/* Los defines aquí mismo para que puedas copiar/pegar sin buscar */}
        {(() => {
          const [comments, setComments] = useState<any[]>([]);
          const [name, setName] = useState("");

          /* Cargar comentarios al abrir */
          useEffect(() => {
            fetch(`/api/comments?articleId=${article.id}`)
              .then((r) => r.json())
              .then((data) => setComments(data));
          }, [article.id]);

          /* Enviar comentario */
          const sendComment = async () => {
            if (!comment.trim()) return;

            const body = {
              articleId: article.id,
              name: anonymous ? "Anónimo" : name || "Sin nombre",
              text: comment.trim(),
            };

            const res = await fetch("/api/comments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

            const saved = await res.json();
            setComments([...comments, saved]);

            setComment("");
            setName("");
          };

          /* Like */
          const like = async (id: number) => {
            const res = await fetch("/api/comments", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });

            const updated = await res.json();

            setComments((prev) =>
              prev.map((c) => (c.id === id ? updated : c))
            );
          };

          /* ---------- DEVUELVE EL JSX ORIGINAL + NUEVO HISTÓRICO ---------- */
          return (
            <>
              {!anonymous && (
                <input
                  placeholder={t.name}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mb-6 p-5 rounded-xl border text-xl"
                />
              )}

              <textarea
                placeholder={t.placeholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-6 rounded-xl border min-h-[160px] text-xl mb-6"
              />

              <label className="flex items-center gap-3 mb-8 text-lg">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={() => setAnonymous(!anonymous)}
                />
                {t.anonymous}
              </label>

              <button
                disabled={!comment.trim()}
                onClick={sendComment}
                className={`px-10 py-5 rounded-full text-xl font-bold ${
                  comment.trim()
                    ? "bg-gray-500 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {t.send}
              </button>

              {/* HISTÓRICO */}
              <div className="mt-10 space-y-6">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-gray-100 p-6 rounded-xl shadow flex flex-col"
                  >
                    <p className="font-semibold text-lg">{c.name}</p>
                    <p className="text-gray-700 text-lg mt-2">{c.text}</p>

                    <button
                      onClick={() => like(c.id)}
                      className="mt-3 flex items-center gap-2 text-red-500 hover:scale-110 transition"
                    >
                      ❤️ {c.likes}
                    </button>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </section>

      {/* RECOMMENDATIONS */}
      {allArticles?.length > 0 && (
        <RecommendationsGrid articles={allArticles} currentArticle={article} />
      )}
    </article>
  );
}
