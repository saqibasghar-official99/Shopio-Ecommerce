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
//       <div className="flex gap-2.5 pb-1 lg:w-full">
//         {activeCategories.map((category, index) => (
//           <Link
//             key={category.id}
//             href={`/products?category=${category.slug}`}
//             className={`
//               group relative flex-shrink-0
//               w-[110px] sm:w-[125px]
//               lg:w-[calc((100%-20px)/3)]
//               lg:flex-shrink
//               h-[85px] sm:h-[95px] lg:h-[110px]
//               overflow-hidden rounded-lg
//               border border-gray-100 bg-white shadow-sm
//               hover:shadow-md transition-all duration-200
//             `}
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

//             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

//             <div className="absolute inset-x-0 bottom-0 z-10 p-2">
//               <span className="block text-[11px] sm:text-xs lg:text-sm font-semibold text-white text-center line-clamp-2 leading-tight">
//                 {category.name}
//               </span>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }


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
      <div className="flex items-start gap-4 pt-2 px-1 lg:justify-center lg:gap-12">
        {activeCategories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="
              pt-2
              group
              flex
              flex-col
              items-center
              flex-shrink-0
              w-[88px]
              sm:w-[105px]
              lg:w-[130px]
            "
          >
            {/* Circular Category Image */}
            <div
              className="
                relative
                w-[78px] h-[78px]
                sm:w-[92px] sm:h-[92px]
                lg:w-[115px] lg:h-[115px]
                overflow-hidden
                rounded-full
                border-2
                border-gray-100
                bg-white
                shadow-sm
                transition-all
                duration-300
                group-hover:scale-105
                group-hover:shadow-md
                group-hover:border-[#7A1F3D]/30
              "
            >
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  decoding="async"
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-500
                    group-hover:scale-110
                  "
                />
              ) : (
                <div className="absolute inset-0 bg-[#f8eef2]" />
              )}

              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Category Name */}
            <span
              className="
                mt-2.5
                text-[11px]
                sm:text-xs
                lg:text-sm
                font-medium
                text-gray-800
                text-center
                line-clamp-2
                leading-tight
                group-hover:text-[#7A1F3D]
                transition-colors
              "
            >
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}