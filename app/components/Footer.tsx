export default function Footer() {
  return (
    <footer className="bg-[#111] text-[#ddd] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
        
        {/* Column 1 - Shop */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">Shop</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Woman</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Man</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Kids</a></li>
            <li><a href="#" className="hover:text-white transition-colors">New Collection</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Sale</a></li>
          </ul>
        </div>

        {/* Column 2 - Help */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">Help</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Customer Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Track Order</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Returns & Exchanges</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>

        {/* Column 3 - About Zara */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">About Zara</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Our Story</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
          </ul>
        </div>

        {/* Column 4 - Newsletter */}
        <div className="footer-col">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-5">Newsletter</h3>
          <p className="mb-4 leading-relaxed text-sm">
            Subscribe and get 10% off your first order + exclusive offers.
          </p>
          
          <div className="newsletter">
            <form id="newsletterForm" className="space-y-3">
              <input
                type="email"
                id="newsEmail"
                placeholder="Your email address"
                required
                className="w-full px-4 py-3 bg-[#222] border border-[#444] text-white placeholder-gray-500 focus:outline-none focus:border-white rounded-sm"
              />
              <button
                type="submit"
                className="w-full py-3 bg-white text-black font-medium tracking-wider hover:bg-gray-200 transition-colors rounded-sm"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>

          {/* Payment icons */}
          <div className="payment-icons flex flex-wrap gap-4 mt-8">
            <img src="/images/visa.jpg" alt="Visa" className="h-6 opacity-80" />
            <img src="/images/mastercard.jpg" alt="Mastercard" className="h-6 opacity-80" />
            <img src="/images/fawry.jpg" alt="Fawry" className="h-6 opacity-80" />
            <img src="/images/paypal.jpg" alt="PayPal" className="h-6 opacity-80" />
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="mt-16 pt-8 border-t border-[#333] text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-6">
          © 2026 Pawlo • All Rights Reserved • Made in Egypt with ❤️
          <span className="float-right">
            <a href="#" className="text-gray-500 hover:text-gray-300 mx-1">Egypt</a> |
            <a href="#" className="text-gray-500 hover:text-gray-300 mx-1">United Arab Emirates</a>
          </span>
        </div>
      </div>
    </footer>
  );
}