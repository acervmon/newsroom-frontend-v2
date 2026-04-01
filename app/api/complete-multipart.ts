import { NextResponse } from "next/server";
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

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

    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    await s3.send(completeCommand);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error completando Multipart Upload:", error);
    return NextResponse.json({ error: "Error completando Multipart Upload" }, { status: 500 });
  }
}
