import Header from '../../components/Header';
import { ProductCardSkeleton } from '../../components/Skeleton';

export default function CategoryLoading() {
  return (
    <>
      
      <div className="min-h-screen bg-gray-50 py-22">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-11 w-72 bg-gray-200 rounded-lg animate-pulse mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </>
  );
}