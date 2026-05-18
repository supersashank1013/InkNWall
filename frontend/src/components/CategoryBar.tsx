import { SlidersHorizontal } from "lucide-react";

interface CategoryOption {
  label: string;
  count: number;
}

export default function CategoryBar({
  categoryOptions,
  selectedCategory,
  selectedCategoryCount,
  setCategory,
}: {
  categoryOptions: CategoryOption[];
  selectedCategory: string;
  selectedCategoryCount: number;
  setCategory: (c: string) => void;
}) {
  return (
    <section className="relative z-30 lg:sticky lg:top-16">
      <div className="relative overflow-hidden rounded-[16px] border border-white/10 bg-[#0b0b0b]/82 px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:rounded-[20px] sm:px-4 sm:py-2.5">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,95,31,0.08),transparent_28%,transparent_72%,rgba(59,130,246,0.06))]" />

        <div className="relative flex flex-col gap-2.5">
          {/* Header row */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-orange-200">Filter shelf</p>
              <h2 className="mt-0.5 text-sm font-bold text-white sm:text-base">Pick the vibe for your wall</h2>
            </div>

            <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-300 sm:self-auto sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]">
              <SlidersHorizontal className="h-3 w-3 text-orange-300" />
              {selectedCategory === "ALL" ? "All categories" : selectedCategory}
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[8px] tracking-[0.12em] text-white sm:text-[9px]">
                {selectedCategoryCount}
              </span>
            </div>
          </div>

          {/* Scroll strip */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0b0b0b] to-transparent md:hidden" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0b0b0b] to-transparent md:hidden" />

            <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto px-0.5 py-1 scroll-smooth sm:gap-1.5">
              {categoryOptions.map((category) => (
                <button
                  key={category.label}
                  onClick={() => setCategory(category.label)}
                  className={`group relative flex shrink-0 snap-start items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] transition-all duration-300 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.2em] ${
                    selectedCategory === category.label
                      ? "border-orange-400/50 bg-orange-500/12 text-white shadow-[0_0_20px_rgba(255,95,31,0.16)]"
                      : "border-white/10 bg-white/[0.04] text-gray-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                      selectedCategory === category.label
                        ? "bg-orange-300 shadow-[0_0_10px_rgba(255,95,31,0.55)]"
                        : "bg-white/20"
                    }`}
                  />
                  <span>{category.label}</span>
                  <span
                    className={`rounded-full px-1 py-0.5 text-[8px] font-semibold tracking-[0.08em] sm:px-1.5 sm:text-[9px] sm:tracking-[0.1em] ${
                      selectedCategory === category.label
                        ? "bg-white/10 text-white"
                        : "bg-black/20 text-gray-300"
                    }`}
                  >
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}