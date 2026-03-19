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
    setProgreso(0);

    if (!videoFile) {
      setMensaje("Debes seleccionar un video");
      return;
    }

    setSubiendo(true);
    setMensaje("");

    try {
      console.log("✅ handleSubmit ejecutándose");

      // 1️⃣ Obtener URL firmada
      console.log("📡 Solicitando URL firmada...");
      const presignRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: videoFile.name,
          fileType: videoFile.type,
        }),
      });

      if (!presignRes.ok) throw new Error("No se pudo obtener URL firmada");

      const { uploadURL, key } = await presignRes.json();
      console.log("🔗 URL firmada recibida:", uploadURL);

      // 2️⃣ Subida directa a S3 con logs completos
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", videoFile.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgreso(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            console.log("✅ Video subido correctamente a S3");
            resolve();
          } else {
            console.error("❌ Error al subir a S3");
            console.error("Status:", xhr.status);
            console.error("Response Text:", xhr.responseText);
            console.error("Response Headers:", xhr.getAllResponseHeaders());
            reject(new Error(`Error subiendo a S3. Status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          console.error("❌ Error de red al subir video");
          reject(new Error("Error de red al subir video"));
        };

        xhr.send(videoFile);
      });

      // 3️⃣ Guardar metadatos en tu backend
      const saveRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tituloES,
          tituloEN,
          descripcionES,
          descripcionEN,
          fecha,
          videoUrl: `https://${process.env.NEXT_PUBLIC_S3_BUCKET_ENTREVISTAS}.s3.${process.env.NEXT_PUBLIC_AWS_REGION_ENTREVISTAS}.amazonaws.com/${key}`,
        }),
      });

      if (!saveRes.ok) throw new Error("Error guardando metadatos");

      setMensaje("✅ Entrevista subida correctamente");

      // Reset formulario
      setTituloES("");
      setTituloEN("");
      setDescripcionES("");
      setDescripcionEN("");
      setFecha("");
      setVideoFile(null);
      setVideoPreview(null);
      setProgreso(0);

    } catch (error: any) {
      console.error("❌ ERROR HANDLE SUBMIT:", error);
      setMensaje(`❌ Error subiendo la entrevista: ${error.message}`);
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
        encType="multipart/form-data"
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

        <input type="file" accept="video/*" onChange={handleVideoChange} />

        {videoFile && (
          <p className="text-sm mt-1">Seleccionado: {videoFile.name}</p>
        )}

        {videoPreview && (
          <video
            src={videoPreview}
            controls
            className="mt-2 w-full max-h-96 rounded-lg border"
          />
        )}

        {subiendo && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-4 overflow-hidden">
              <div
                className="bg-blue-600 h-4"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="font-semibold mt-1 text-blue-700">{progreso}%</p>
          </>
        )}

        <button
          type="submit"
          disabled={subiendo}
          className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          {subiendo ? "Subiendo..." : "Subir Entrevista"}
        </button>

        {mensaje && <p className="mt-2 font-medium">{mensaje}</p>}
      </form>
    </div>
  );
}
