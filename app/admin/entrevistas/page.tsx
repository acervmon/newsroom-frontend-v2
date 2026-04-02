"use client";
export const dynamic = "force-dynamic";

import { useState, useContext } from "react";
import { LanguageContext } from "../../RootProviders";

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
  const [progreso, setProgreso] = useState(0);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMensaje("Solo se permiten videos");
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setMensaje("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      setMensaje("Debes seleccionar un video");
      return;
    }

    setSubiendo(true);
    setMensaje("");
    setProgreso(0);

    try {
      // 1️⃣ Obtener URLs Multipart
      const presignRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: videoFile.name,
          fileType: videoFile.type,
          fileSize: videoFile.size,
        }),
      });

      if (!presignRes.ok) {
        throw new Error("No se pudo obtener URL firmada");
      }

      const { key, uploadId, partUrls, fileUrl, partSize } =
        await presignRes.json();

      console.log("🚀 Multipart iniciado");
      console.log("UploadId:", uploadId);
      console.log("Partes:", partUrls.length);

      // 2️⃣ Subir partes
      const etags: { ETag: string; PartNumber: number }[] = [];

      for (let i = 0; i < partUrls.length; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, videoFile.size);

        const blob = videoFile.slice(start, end);

        console.log(`📤 Subiendo parte ${i + 1}/${partUrls.length}`);

        const res = await fetch(partUrls[i], {
          method: "PUT",
          body: blob,
        });

        if (!res.ok) {
          throw new Error(`No se pudo subir la parte ${i + 1}`);
        }

        // 🔥 IMPORTANTE: NO modificar ETag
        const etag =
          res.headers.get("ETag") ||
          res.headers.get("etag");

        if (!etag) {
          throw new Error(`No se recibió ETag de la parte ${i + 1}`);
        }

        console.log(`✅ Parte ${i + 1} subida`, etag);

        etags.push({
          ETag: etag,
          PartNumber: i + 1,
        });

        setProgreso(
          Math.round(((i + 1) / partUrls.length) * 100)
        );
      }

      console.log("🧩 Completando multipart...");

      // 3️⃣ Completar multipart
      const completeRes = await fetch("/api/complete-multipart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          uploadId,
          parts: etags,
        }),
      });

      if (!completeRes.ok) {
        throw new Error("No se pudo completar la subida");
      }

      console.log("✅ Multipart completado");

      // 4️⃣ Guardar entrevista
      const saveRes = await fetch("/api/admin/entrevistas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tituloES,
          tituloEN,
          descripcionES,
          descripcionEN,
          fecha,
          videoUrl: fileUrl,
          videoKey: key,
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Error guardando entrevista");
      }

      setMensaje("✅ Entrevista subida correctamente");

      setTituloES("");
      setTituloEN("");
      setDescripcionES("");
      setDescripcionEN("");
      setFecha("");
      setVideoFile(null);
      setVideoPreview(null);
      setProgreso(0);

    } catch (error: any) {
      console.error("❌ ERROR:", error);
      setMensaje(`❌ Error: ${error.message}`);
    }

    setSubiendo(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">
        {language === "ES"
          ? "Panel de Subida de Entrevistas"
          : "Interviews Upload Panel"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md space-y-4 max-w-2xl"
      >
        <input
          placeholder="Título (ES)"
          value={tituloES}
          onChange={(e) => setTituloES(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Título (EN)"
          value={tituloEN}
          onChange={(e) => setTituloEN(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <textarea
          placeholder="Descripción (ES)"
          value={descripcionES}
          onChange={(e) => setDescripcionES(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <textarea
          placeholder="Descripción (EN)"
          value={descripcionEN}
          onChange={(e) => setDescripcionEN(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
        />

        {videoFile && (
          <p className="text-sm mt-1">
            Seleccionado: {videoFile.name}
          </p>
        )}

        {videoPreview && (
          <video
            src={videoPreview}
            controls
            className="mt-2 w-full max-h-96 rounded-lg border"
          />
        )}

        {subiendo && (
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4"
              style={{ width: `${progreso}%` }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={subiendo}
          className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          {subiendo ? "Subiendo..." : "Subir Entrevista"}
        </button>

        {mensaje && (
          <p className="mt-2 font-medium">
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}
