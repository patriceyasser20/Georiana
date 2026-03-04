import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ReturnExchange() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-12 text-center">Return & Exchange</h1>
          <div className="prose max-w-none">
            <h2>Our Policy</h2>
            <p>We offer free returns within 30 days of purchase. Items must be unworn with tags attached.</p>
            <p>Exchanges are available for size or color issues.</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}