export const runtime = "nodejs";
// app/api/news/route.ts
import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = "newsroomcache";
const S3_BASE_URL = `https://${BUCKET}.s3.eu-north-1.amazonaws.com/`;

// --------------------------------------------------
// helpers
// --------------------------------------------------

const streamToString = async (stream: any): Promise<string> => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
};

const getTodayParts = () => {
  const d = new Date();
  return {
    year: d.getFullYear().toString(),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0"),
  };
};

// Busca el último día disponible en S3
const getLatestDay = async (year: string, month: string): Promise<string | null> => {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `data/news/${year}/${month}/`,
      Delimiter: "/",
    })
  );

  const days =
    res.CommonPrefixes?.map((p) => p.Prefix!.split("/").slice(-2)[0]) || [];

  return days.sort().pop() || null;
};

// --------------------------------------------------
// API
// --------------------------------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const latestOnly = searchParams.get("latestOnly");
    const lang = searchParams.get("lang") || "en";
    const sectionFilter = searchParams.get("section");

    let year = searchParams.get("year");
    let month = searchParams.get("month");
    let day = searchParams.get("day");

    // 📅 fecha automática
    if (!year || !month) {
      const today = getTodayParts();
      year = today.year;
      month = today.month;
    }

    if (!day) {
      const latestDay = await getLatestDay(year, month);
      if (!latestDay) return NextResponse.json({ articles: [] });
      day = latestDay;
    }

    const basePrefix = `data/news/${year}/${month}/${day}/${lang}/`;

    // Listar secciones
    const sectionsRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: basePrefix,
        Delimiter: "/",
      })
    );

    const sections =
      sectionsRes.CommonPrefixes?.map((p) =>
        p.Prefix!.replace(basePrefix, "").replace("/", "")
      ) || [];

    const articles = [];

    for (const section of sections) {
      if (sectionFilter && section !== sectionFilter) continue;

      const prefix = `${basePrefix}${section}/`;

      const filesRes = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: prefix,
        })
      );

      const files = filesRes.Contents?.map((o) => o.Key!) || [];

      const txtKey = files.find((f) => f.endsWith("article.txt"));
      const imageKey = files.find((f) => f.endsWith(".jpg"));
      if (!txtKey) continue;

      // Leer TXT
      const txtObj = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: txtKey })
      );
      const text = await streamToString(txtObj.Body);

      // Extraer título y subtítulo: primeras dos líneas no vacías
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const title = lines[0] || "";
      const subtitle = lines[1] || "";

      const imageUrl = imageKey ? `${S3_BASE_URL}${imageKey}` : undefined;
      const txtUrl = txtKey ? `${S3_BASE_URL}${txtKey}` : undefined;

      articles.push({
        section,
        title,
        subtitle,
        date: `${year}-${month}-${day}`,
        txtUrl,
        imageUrl,
        url: `/secciones/${section}`,
      });
    }

    if (latestOnly) {
      // homepage: solo 1 artículo por sección
      return NextResponse.json({
        articles,
        date: `${year}-${month}-${day}`,
      });
    }

    // histórico o sección específica
    return NextResponse.json({
      articles,
      date: `${year}-${month}-${day}`,
      year,
      month,
      day,
      lang,
    });
  } catch (err) {
    console.error("❌ /api/news error:", err);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
