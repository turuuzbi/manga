import React from "react";
import { Play } from "lucide-react";

interface MangaCardProps {
  title: string;
  chapter: string;
  image: string;
  isHot?: boolean;
  isNew?: boolean;
}

export const MangaCard = ({
  title,
  chapter,
  image,
  isHot,
  isNew,
}: MangaCardProps) => {
  return (
    <div className="group relative cursor-pointer">
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-zinc-900">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:blur-[2px]"
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isHot && (
            <span className="bg-red-600 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-lg">
              HOT
            </span>
          )}
          {isNew && (
            <span className="bg-blue-600 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-lg">
              NEW
            </span>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-full bg-red-600 p-3 text-white shadow-xl">
            <Play size={24} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100 transition-colors group-hover:text-red-500">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">Chapter {chapter}</p>
      </div>
    </div>
  );
};
