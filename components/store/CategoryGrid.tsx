'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const activeCategories = categories.filter((c) => c.is_active);

  if (activeCategories.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2.5 pb-1 lg:w-full">
        {activeCategories.map((category, index) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className={`
              group relative flex-shrink-0
              w-[110px] sm:w-[125px]
              lg:w-[calc((100%-20px)/3)]
              lg:flex-shrink
              h-[85px] sm:h-[95px] lg:h-[110px]
              overflow-hidden rounded-lg
              border border-gray-100 bg-white shadow-sm
              hover:shadow-md transition-all duration-200
            `}
          >
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-green-50" />
            )}

            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

            <div className="absolute inset-x-0 bottom-0 z-10 p-2">
              <span className="block text-[11px] sm:text-xs lg:text-sm font-semibold text-white text-center line-clamp-2 leading-tight">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


// 'use client';

// import React from 'react';
// import Link from 'next/link';
// import { Category } from '@/lib/types';

// interface CategoryGridProps {
//   categories: Category[];
// }

// export default function CategoryGrid({ categories }: CategoryGridProps) {
//   const activeCategories = categories.filter((c) => c.is_active);

//   if (activeCategories.length === 0) return null;

//   return (
//     <div className="w-full overflow-x-auto scrollbar-hide">
//       <div className="flex gap-2.5 w-max pb-1">
//         {activeCategories.map((category) => (
//           <Link
//             key={category.id}
//             href={`/products?category=${category.slug}`}
//             className="group relative flex-shrink-0 w-[110px] sm:w-[125px] h-[85px] sm:h-[95px] overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200"
//           >
//             {category.image ? (
//               <img
//                 src={category.image}
//                 alt={category.name}
//                 loading="lazy"
//                 decoding="async"
//                 className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
//               />
//             ) : (
//               <div className="absolute inset-0 bg-green-50" />
//             )}

//             {/* Overlay */}
//             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

//             {/* Category name */}
//             <div className="absolute inset-x-0 bottom-0 z-10 p-2">
//               <span className="block text-[11px] sm:text-xs font-semibold text-white text-center line-clamp-2 leading-tight">
//                 {category.name}
//               </span>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }