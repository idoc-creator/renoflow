"use client";
import Link from "next/link";

interface TemplateCardProps {
  id: string;
  title: string;
  coverImageUrl: string | null;
  buildCount: number;
  estimatedCost: number | null;
  difficultyLevel: string | null;
}

const difficultyStyles: Record<string, string> = {
  beginner: "bg-sage/10 text-sage",
  intermediate: "bg-amber-100 text-amber-800",
  advanced: "bg-terracotta/10 text-terracotta",
};

export default function TemplateCard({
  id,
  title,
  coverImageUrl,
  buildCount,
  estimatedCost,
  difficultyLevel,
}: TemplateCardProps) {
  return (
    <Link
      href={`/project/${id}`}
      className="mb-4 break-inside-avoid block group"
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[4/5] bg-warm-gray/10 flex items-center justify-center text-warm-gray">
            No image
          </div>
        )}
        <div className="p-3">
          <h3 className="font-serif text-lg text-charcoal leading-tight mb-2">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {difficultyLevel && (
              <span
                className={`px-2 py-0.5 rounded-full ${
                  difficultyStyles[difficultyLevel] ??
                  "bg-warm-gray/10 text-warm-gray"
                }`}
              >
                {difficultyLevel}
              </span>
            )}
            <span className="text-warm-gray">· {buildCount} built</span>
          </div>
          {estimatedCost !== null && (
            <p className="text-warm-gray text-sm mt-1">
              ~${Math.round(estimatedCost)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
