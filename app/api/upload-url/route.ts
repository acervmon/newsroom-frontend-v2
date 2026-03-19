import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json();
    if (!fileName) return new Response("Missing fileName", { status: 400 });

    const s3 = new S3Client({
      region: process.env.AWS_S3_UPLOADER_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_S3_UPLOADER_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_S3_UPLOADER_SECRET_ACCESS_KEY!,
      },
    });

    const cleanFileName = fileName.replace(/\s+/g, "_");
    const key = `entrevistas/${Date.now()}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: fileType,       // Content-Type exacto
    });

    const uploadURL = await getSignedUrl(s3, command, {
      expiresIn: 3600,             // 1 hora
    });

    return new Response(JSON.stringify({ uploadURL, key }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error generating presigned URL:", err);
    return new Response("Error generating presigned URL", { status: 500 });
  }
}
