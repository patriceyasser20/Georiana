import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CustomerService() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-light tracking-widest mb-12">Customer Service</h1>
          <p className="text-xl text-gray-600">We're here to help 24/7.</p>
          <p className="mt-8 text-lg">Email: support@zara.com</p>
          <p className="text-lg">Phone: +20 123 456 789</p>
        </div>
      </div>
      <Footer />
    </>
  );
}