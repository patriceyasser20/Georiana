import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Contact() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-12 text-center">Contact Us</h1>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-medium mb-6">Get In Touch</h2>
              <p className="text-gray-600 mb-8">We'd love to hear from you. Reach out anytime.</p>
              <p className="text-lg">📧 support@zara.com</p>
              <p className="text-lg">📞 +20 123 456 789</p>
            </div>
            <div>
              <h2 className="text-2xl font-medium mb-6">Our Office</h2>
              <p className="text-gray-600">Cairo, Egypt</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}