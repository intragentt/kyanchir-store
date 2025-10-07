import 'server-only';

import { createElement } from 'react';
import type { SVGProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as sharedIcons from '@/components/shared/icons';

export interface IconCatalogEntry {
  name: string;
  svg: string;
}

export function buildIconCatalog(): IconCatalogEntry[] {
  return Object.entries(sharedIcons)
    .filter((entry): entry is [string, (props: SVGProps<SVGSVGElement>) => JSX.Element] => {
      const [, component] = entry;
      return typeof component === 'function';
    })
    .map(([name, Icon]) => {
      const svg = renderToStaticMarkup(
        createElement(Icon, {
          width: 32,
          height: 32,
          strokeWidth: 1.5,
        }),
      );
      return {
        name,
        svg,
      } satisfies IconCatalogEntry;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
