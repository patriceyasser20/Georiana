import Header from '../../components/Header';

export default function ProductDetailLoading() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20 md:py-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:grid md:grid-cols-2 md:gap-12">

            {/* ── Image gallery skeleton ── */}
            <div className="mb-6 md:mb-0">
              <div className="w-full aspect-[3/4.3] bg-gray-200 rounded-2xl md:rounded-3xl animate-pulse" />
              <div className="flex gap-2 mt-3 px-15 overflow-hidden pb-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-200 animate-pulse" />
                ))}
              </div>
            </div>

            {/* ── Details skeleton ── */}
            <div>
              {/* Title */}
              <div className="h-9 md:h-10 w-3/4 bg-gray-200 rounded-lg animate-pulse mb-4" />

              {/* Price */}
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse mt-2" />

              {/* Rating */}
              <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse mt-5" />

              {/* Description */}
              <div className="mt-6 border-t pt-6 space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Color selector */}
              <div className="mt-8">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 w-20 bg-gray-200 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div className="mt-6">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 w-14 bg-gray-200 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-8">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
              </div>

              {/* Add to order button */}
              <div className="mt-10 h-14 w-full bg-gray-200 rounded-full animate-pulse" />

              {/* Trust badges row */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}