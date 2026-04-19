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
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0b0b]/82 px-3 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-[28px] sm:px-5 sm:py-4">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,95,31,0.08),transparent_28%,transparent_72%,rgba(59,130,246,0.06))]" />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200">Filter shelf</p>
              <h2 className="mt-1 text-base font-bold text-white sm:text-xl">Pick the vibe for your wall</h2>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-300 sm:self-auto sm:py-2 sm:text-xs sm:tracking-[0.2em]">
              <SlidersHorizontal className="h-4 w-4 text-orange-300" />
              {selectedCategory === "ALL" ? "All categories" : selectedCategory}
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[9px] tracking-[0.14em] text-white sm:text-[10px] sm:tracking-[0.16em]">
                {selectedCategoryCount}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0b0b0b] to-transparent md:hidden" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0b0b0b] to-transparent md:hidden" />

            <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 py-1.5 scroll-smooth sm:gap-2">
              {categoryOptions.map((category) => (
                <button
                  key={category.label}
                  onClick={() => setCategory(category.label)}
                  className={`group relative flex shrink-0 snap-start items-center gap-2 overflow-hidden rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-300 sm:px-5 sm:py-3 sm:text-[11px] sm:tracking-[0.22em] ${
                    selectedCategory === category.label
                      ? "border-orange-400/50 bg-orange-500/12 text-white shadow-[0_0_26px_rgba(255,95,31,0.18)]"
                      : "border-white/10 bg-white/[0.04] text-gray-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      selectedCategory === category.label
                        ? "bg-orange-300 shadow-[0_0_14px_rgba(255,95,31,0.55)]"
                        : "bg-white/20"
                    }`}
                  />
                  <span>{category.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-1 text-[9px] font-semibold tracking-[0.1em] sm:px-2 sm:text-[10px] sm:tracking-[0.12em] ${
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
