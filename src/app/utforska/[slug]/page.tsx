import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreTopicView } from "@/components/explore/ExploreViews";
import { EXPLORE_TOPICS, TOPIC_BY_SLUG } from "@/content/explore";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EXPLORE_TOPICS.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: TOPIC_BY_SLUG.get(slug)?.title ?? "Utforska" };
}

export default async function ExploreTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = TOPIC_BY_SLUG.get(slug);
  if (!topic) notFound();
  return <ExploreTopicView topic={topic} />;
}
