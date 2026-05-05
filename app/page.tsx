import { PdlcConsole } from "@/components/PdlcConsole";
import { loadBrain } from "@/lib/server/brain-store";

interface HomeProps {
  searchParams?: { merchant?: string };
}

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomeProps) {
  const merchantId = searchParams?.merchant ?? "A1";
  const { brain, source, path } = await loadBrain(merchantId);
  // The Workbench types still call source "file"/"fallback-demo"; treat KV as
  // file for UI purposes (it's "stored brain" either way).
  const uiSource = source === "fallback-demo" ? "fallback-demo" : "file";
  return (
    <PdlcConsole
      initialBrain={brain}
      brainSource={uiSource}
      brainPath={path}
      activeMerchantId={merchantId}
    />
  );
}
