import Header from '../components/Header';
import Footer from '../components/Footer';

export default function SizeGuide() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-light tracking-widest mb-12">Size Guide</h1>
          <p className="text-xl text-gray-600">Find your perfect fit with our detailed size charts.</p>
          {/* You can add a table here later */}
        </div>
      </div>
      <Footer />
    </>
  );
}