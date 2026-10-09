import Link from "next/link";
import { Card } from "@/components/ui/card";
const COPY: Record<string, [string, string]> = {
  bincheck: ["BinCheck", "Scores bin-level segregation quality and recommends fixes. Planned for the next part of the build."],
  demo: ["Demo", "A guided walkthrough of the full WasteDNA flow. Planned for the next part of the build."],
};
export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(COPY).map((slug) => ({ slug }));
export default function Page({ params }: { params: { slug: string } }) {
  const [title, text] = COPY[params.slug];
  return (
    <div className="mx-auto max-w-2xl px-4 py-20"><Card>
      <h1 className="font-display text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <Link href="/analyze" className="mt-6 inline-block font-semibold text-secondary underline">Go to Analyze</Link>
    </Card></div>
  );
}
