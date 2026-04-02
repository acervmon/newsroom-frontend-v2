import { NextResponse } from "next/server";
import {
  S3Client,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_S3_UPLOADER_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_UPLOADER_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_UPLOADER_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { key, uploadId, parts } = await req.json();

    console.log("🧩 Comenzando CompleteMultipartUpload");
    console.log("Key:", key);
    console.log("UploadId:", uploadId);
    console.log("Número de partes:", parts?.length);

    if (!parts || parts.length === 0) {
      throw new Error("No se recibieron partes");
    }

    // ✅ Asegurar formato correcto para AWS
    const sortedParts = parts
      .map((p: any) => ({
        ETag: p.ETag, // 🔥 NO modificar ETag
        PartNumber: Number(p.PartNumber), // 🔥 asegurar número
      }))
      .sort(
        (a: { PartNumber: number }, b: { PartNumber: number }) =>
          a.PartNumber - b.PartNumber
      );

    console.log("Parts ordenadas:", sortedParts);

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    });

    const response = await s3.send(command);

    console.log("✅ Multipart completado correctamente");
    console.log("AWS Response:", response);

    return NextResponse.json({
      ok: true,
      response,
    });

  } catch (error: any) {
    console.error("❌ ERROR COMPLETANDO MULTIPART:");
    console.error("Message:", error?.message);
    console.error("Name:", error?.name);
    console.error("Stack:", error?.stack);

    return NextResponse.json(
      {
        error: error?.message || "Error completando Multipart Upload",
      },
      { status: 500 }
    );
  }
}
