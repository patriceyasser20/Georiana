import Header from '../components/Header';
import Footer from '../components/Footer';

export default function About() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-light tracking-widest mb-12">About ZARA</h1>
          <p className="text-xl leading-relaxed text-gray-600">
            ZARA is a global fashion brand offering the latest trends with exceptional quality and affordable prices. 
            Inspired by the fast-paced world of fashion, we bring runway looks to your everyday wardrobe.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}