import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyProductRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/p/${params.slug}`);
}
