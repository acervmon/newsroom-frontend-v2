"use client";

<<<<<<< Updated upstream
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import SearchResultsPage from "@/components/SearchResultsPage";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function BuscarInner() {
  const searchParams = useSearchParams();
  const keywordFromUrl = searchParams.get("keyword") || "";

  const { keyword, setKeyword } = useSearch();

  useEffect(() => {
    if (keywordFromUrl !== keyword) {
      setKeyword(keywordFromUrl);
    }
  }, [keywordFromUrl, keyword, setKeyword]);

  return <SearchResultsPage />;
=======
import { Suspense } from "react";
import BuscarClient from "./BuscarClient";

export default function BuscarPage() {
  return (
    <Suspense fallback={null}>
      <BuscarClient />
    </Suspense>
  );
>>>>>>> Stashed changes
}

export default function BuscarPage() {
  return (
    <Suspense fallback={null}>
      <BuscarInner />
    </Suspense>
  );
}
