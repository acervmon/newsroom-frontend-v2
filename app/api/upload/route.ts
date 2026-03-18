import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "eu-north-1";
const BUCKET = process.env.S3_BUCKET || "newsroomcache";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get("video") as File;

    if (!videoFile) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const arrayBuffer = await videoFile.arrayBuffer();
    const fileName = `videos/${Date.now()}_${videoFile.name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileName,
        Body: Buffer.from(arrayBuffer),
        ContentType: videoFile.type,
      })
    );

    const videoUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fileName}`;

    return NextResponse.json({ url: videoUrl }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
