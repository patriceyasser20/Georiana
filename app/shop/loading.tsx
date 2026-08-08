import Header from '../components/Header';
import { ProductCardSkeleton } from '../components/Skeleton';

export default function ShopLoading() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-11 w-32 bg-gray-200 rounded-lg animate-pulse mb-10" />
          <div className="mb-10 max-w-xl">
            <div className="h-[60px] w-full bg-gray-200 rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </>
  );
}