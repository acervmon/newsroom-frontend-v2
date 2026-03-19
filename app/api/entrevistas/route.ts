import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
 
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "entrevistas.json");
    const file = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(file);
 
    return NextResponse.json({ entrevistas: json.entrevistas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ entrevistas: [] });
  }
}
