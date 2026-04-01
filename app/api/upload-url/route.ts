import { NextResponse } from "next/server";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_S3_UPLOADER_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_UPLOADER_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_UPLOADER_SECRET_ACCESS_KEY!,
  },
});

const PART_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  try {
    const { fileName, fileType, fileSize } = await req.json();

    const key = `entrevistas/${Date.now()}-${fileName}`;

    const createCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const createRes = await s3.send(createCommand);

    if (!createRes.UploadId) throw new Error("No se pudo iniciar Multipart Upload");

    const uploadId = createRes.UploadId;
    const numParts = Math.ceil(fileSize / PART_SIZE);

    const partUrls: string[] = [];
    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      const url = await getSignedUrl(
        s3,
        new UploadPartCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        }),
        { expiresIn: 60 * 15 }
      );
      partUrls.push(url);
    }

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_UPLOADER_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ key, uploadId, partUrls, fileUrl, partSize: PART_SIZE });
  } catch (error) {
    console.error("❌ Error generando Multipart Upload:", error);
    return NextResponse.json({ error: "Error generando Multipart Upload" }, { status: 500 });
  }
}
