import { NextApiRequest, NextApiResponse } from "next";

let comments: any[] = []; 
// ❗ IMPORTANTE: Esto se pierde al reiniciar el servidor.
// Si quieres persistencia real necesitas DB (Postgres, Mongo, etc.).
// Por ahora sirve para desarrollo.

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { articleId } = req.query;
    const filtered = comments.filter((c) => c.articleId === articleId);
    return res.status(200).json(filtered);
  }

  if (req.method === "POST") {
    const comment = { 
      id: Date.now(), 
      ...req.body,
      likes: 0 
    };

    comments.push(comment);
    return res.status(201).json(comment);
  }

  if (req.method === "PUT") {
    const { id } = req.body;
    const c = comments.find((n) => n.id === id);
    if (!c) return res.status(404).json({ error: "Not found" });
    c.likes++;
    return res.status(200).json(c);
  }

  res.status(405).json({ error: "Method not allowed" });
}