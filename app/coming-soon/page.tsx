export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-[#f8f4f0] flex items-center justify-center px-6">
      <div className="text-center">
        <img src="/images/logo.svg" alt="GEORIANA" className="h-14 mx-auto mb-8" />
        <h1 className="text-4xl md:text-5xl font-light tracking-widest text-[#3a2f2f] mb-4">
          Coming Soon
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          We're putting the finishing touches on something beautiful. Check back shortly.
        </p>
      </div>
    </div>
  );
}