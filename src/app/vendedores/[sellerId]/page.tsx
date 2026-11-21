import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProductHref } from "@/features/catalog/public-products";
import { isSellerProfileAvailable } from "@/features/sellers/seller-profile";
import { prisma } from "@/lib/db";

export default async function PublicSellerProfile({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  if (!await isSellerProfileAvailable()) notFound();
  const profile = await prisma.sellerProfile.findFirst({
    where: { id: sellerId, published: true, owner: { userRoles: { some: { role: "PRODUCER" } } } },
    select: { name: true, description: true, municipality: true, ownerId: true },
  });
  if (!profile) notFound();
  const offers = await prisma.product.findMany({
    where: { ownerId: profile.ownerId, isPublished: true, availableQuantity: { gt: 0 } },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 px-4 py-8">
      <Link className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" href="/catalogo">Volver al catálogo</Link>
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-3xl font-semibold wrap-anywhere">{profile.name}</h1>
        <p className="font-medium wrap-anywhere">{profile.municipality}</p>
        <p className="whitespace-pre-wrap wrap-anywhere">{profile.description}</p>
      </section>
      <section aria-labelledby="seller-offers">
        <h2 className="text-xl font-semibold" id="seller-offers">Ofertas disponibles</h2>
        {offers.length === 0 ? <p className="mt-2">Este vendedor no tiene ofertas disponibles.</p> : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-xl bg-white px-4">
            {offers.map((offer) => (
              <li key={offer.id}><Link className="flex min-h-11 items-center py-2 font-semibold text-emerald-900 underline wrap-anywhere" href={getPublicProductHref(offer.id)}>{offer.name}</Link></li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
