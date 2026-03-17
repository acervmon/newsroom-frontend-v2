"use client";

import { useState, useContext } from "react";
import { LanguageContext } from "../../RootProviders";
import axios from "axios";

export default function AdminEntrevistas() {
  const { language } = useContext(LanguageContext);

  const [tituloES, setTituloES] = useState("");
  const [tituloEN, setTituloEN] = useState("");
  const [descripcionES, setDescripcionES] = useState("");
  const [descripcionEN, setDescripcionEN] = useState("");
  const [fecha, setFecha] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMensaje(language === "ES" ? "Solo se permiten archivos de video" : "Only video files allowed");
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setMensaje(language === "ES" ? "El video es demasiado grande (máx 500MB)" : "Video is too large (max 500MB)");
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }

    setMensaje("");
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) return setMensaje("Debes seleccionar un video");

    setSubiendo(true);
    setMensaje("");

    try {
      // 1️⃣ Pedir URL firmada
      const presignRes = await fetch("/api/upload-url", {
        method: "POST",
        body: JSON.stringify({
          fileName: videoFile.name,
          fileType: videoFile.type
        }),
      });

      const { uploadURL, key } = await presignRes.json();

      // 2️⃣ Subir a AWS S3 (directo desde el navegador)
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": videoFile.type },
        body: videoFile
      });

      // 3️⃣ Guardar los metadatos en tu API interna
      await axios.post("/api/upload", {
        tituloES,
        tituloEN,
        descripcionES,
        descripcionEN,
        fecha,
        videoUrl: `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`
      });

      setMensaje("✅ Entrevista subida correctamente");
      setTituloES("");
      setTituloEN("");
      setDescripcionES("");
      setDescripcionEN("");
      setFecha("");
      setVideoFile(null);
      setVideoPreview(null);

    } catch (err) {
      console.error(err);
      setMensaje("❌ Error subiendo el video");
    }

    setSubiendo(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">
        {language === "ES" ? "Panel de Subida de Entrevistas" : "Interviews Upload Panel"}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-4 max-w-2xl">
        <input placeholder={language === "ES" ? "Título (ES)" : "Title (ES)"} value={tituloES} onChange={(e) => setTituloES(e.target.value)} required className="w-full border p-2 rounded"/>
        <input placeholder={language === "ES" ? "Título (EN)" : "Title (EN)"} value={tituloEN} onChange={(e) => setTituloEN(e.target.value)} required className="w-full border p-2 rounded"/>
        <textarea placeholder={language === "ES" ? "Descripción (ES)" : "Description (ES)"} value={descripcionES} onChange={(e) => setDescripcionES(e.target.value)} required className="w-full border p-2 rounded"/>
        <textarea placeholder={language === "ES" ? "Descripción (EN)" : "Description (EN)"} value={descripcionEN} onChange={(e) => setDescripcionEN(e.target.value)} required className="w-full border p-2 rounded"/>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className="border p-2 rounded w-full"/>
        <input type="file" accept="video/*" onChange={handleVideoChange} required />
        {videoFile && <p className="text-sm mt-1">{language === "ES" ? "Seleccionado:" : "Selected:"} {videoFile.name}</p>}
        {videoPreview && (
          <video src={videoPreview} controls className="mt-2 w-full max-h-96 rounded-lg border" />
        )}
        <button type="submit" disabled={subiendo} className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
          {subiendo ? (language === "ES" ? "Subiendo..." : "Uploading...") : (language === "ES" ? "Subir Entrevista" : "Upload Interview")}
        </button>
        {mensaje && <p className="mt-2 font-medium">{mensaje}</p>}
      </form>
    </div>
  );
}
