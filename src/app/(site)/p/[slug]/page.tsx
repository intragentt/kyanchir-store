// src/app/(site)/p/[slug]/page.tsx
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';
import { createSlug, ensureUniqueSlug } from '@/utils/createSlug';

export const dynamic = 'force-dynamic';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONESIZE'];

const PRODUCT_INCLUDE = {
  variants: {
    include: {
      images: {
        orderBy: {
          order: 'asc' as const,
        },
      },
      // --- НАЧАЛО ИЗМЕНЕНИЙ (1/2): Используем правильное имя связи 'sizes' ---
      sizes: {
        include: {
          size: true,
        },
      },
      // --- КОНЕЦ ИЗМЕНЕНИЙ (1/2) ---
    },
  },
  attributes: true,
  status: true,
} as const;

async function findProduct(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        {
          slug: {
            equals: slug,
            mode: 'insensitive',
          },
        },
        { id: slug },
      ],
    },
    include: PRODUCT_INCLUDE,
  });

  if (product) {
    return product;
  }

  const sluglessProducts = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  const fallbackMatch = sluglessProducts.find(
    (candidate) => createSlug(candidate.name) === slug.toLowerCase(),
  );

  if (!fallbackMatch) {
    return null;
  }

  return prisma.product.findUnique({
    where: { id: fallbackMatch.id },
    include: PRODUCT_INCLUDE,
  });
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  let product = await findProduct(slug);

  if (!product) {
    notFound();
  }

  const resolvedSlug = slug.toLowerCase();
  let canonicalSlug = product.slug ?? createSlug(product.name);

  if (!product.slug) {
    const uniqueSlug = await ensureUniqueSlug(canonicalSlug, async (candidate) => {
      const existing = await prisma.product.findFirst({
        where: {
          slug: candidate,
          NOT: {
            id: product.id,
          },
        },
        select: { id: true },
      });

      return Boolean(existing);
    });

    if (uniqueSlug !== product.slug) {
      await prisma.product.update({
        where: { id: product.id },
        data: { slug: uniqueSlug },
      });

      product = {
        ...product,
        slug: uniqueSlug,
      };
      canonicalSlug = uniqueSlug;
    }
  }

  if (canonicalSlug !== resolvedSlug) {
    redirect(`/p/${canonicalSlug}`);
  }

  const normalizedProduct = product.slug
    ? product
    : { ...product, slug: canonicalSlug };

  // Сортируем размеры внутри каждого варианта
  const sortedProduct = {
    ...normalizedProduct,
    variants: normalizedProduct.variants.map((variant) => ({
      ...variant,
      // --- НАЧАЛО ИЗМЕНЕНИЙ (2/2): Используем правильное имя 'sizes' и для сортировки ---
      sizes: [...variant.sizes].sort((a, b) => {
        const sizeA = a.size.value.toUpperCase();
        const sizeB = b.size.value.toUpperCase();
        // --- КОНЕЦ ИЗМЕНЕНИЙ (2/2) ---
        const indexA = SIZE_ORDER.indexOf(sizeA);
        const indexB = SIZE_ORDER.indexOf(sizeB);

        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      }),
    })),
  };

  return <ProductDetails product={sortedProduct} />;
}
