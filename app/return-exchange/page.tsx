'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTranslation } from '../context/LanguageContext';

export default function ReturnExchange() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-5xl font-light tracking-widest mb-6 text-center">
            {t('returnExchange.title')}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16">
            {t('returnExchange.text')}
          </p>

          <div className="space-y-12">
            {/* 1. Right of Return */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.section1Title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-2">{t('returnExchange.section1Text1')}</p>
              <p className="text-gray-600 leading-relaxed">{t('returnExchange.section1Text2')}</p>
            </section>

            {/* 2. Conditions for Accepting Return/Exchange */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.section2Title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{t('returnExchange.section2Intro')}</p>
              <ul className="space-y-2 text-gray-600 list-disc ps-5">
                <li>{t('returnExchange.section2Condition1')}</li>
                <li>{t('returnExchange.section2Condition2')}</li>
                <li>{t('returnExchange.section2Condition3')}</li>
                <li>{t('returnExchange.section2Condition4')}</li>
              </ul>
            </section>

            {/* 3. Defects or Shipping Errors */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.section3Title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-2">{t('returnExchange.section3Intro')}</p>
              <ul className="space-y-2 text-gray-600 list-disc ps-5 mb-4">
                <li>{t('returnExchange.section3Case1')}</li>
                <li>{t('returnExchange.section3Case2')}</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-2">{t('returnExchange.section3Text')}</p>
              <p className="text-gray-500 text-sm leading-relaxed italic">{t('returnExchange.section3Note')}</p>
            </section>

            {/* 4. Who Bears Shipping Cost — table */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.section4Title')}</h2>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full text-start">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-start font-medium text-gray-700">
                        {t('returnExchange.section4TableHeaderParty')}
                      </th>
                      <th className="px-6 py-4 text-start font-medium text-gray-700">
                        {t('returnExchange.section4TableHeaderCase')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-6 py-4 text-gray-600">{t('returnExchange.section4Row1Party')}</td>
                      <td className="px-6 py-4 text-gray-600">{t('returnExchange.section4Row1Case')}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-600">{t('returnExchange.section4Row2Party')}</td>
                      <td className="px-6 py-4 text-gray-600">{t('returnExchange.section4Row2Case')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Return/Exchange Request Process — numbered steps */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.section5Title')}</h2>
              <ol className="space-y-4 text-gray-600 list-decimal ps-5">
                <li className="leading-relaxed">{t('returnExchange.section5Step1')}</li>
                <li className="leading-relaxed">{t('returnExchange.section5Step2')}</li>
                <li className="leading-relaxed">{t('returnExchange.section5Step3')}</li>
              </ol>
            </section>

            {/* 6. Refund Mechanism */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.section6Title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-2">{t('returnExchange.section6Text1')}</p>
              <p className="text-gray-600 leading-relaxed mb-2">{t('returnExchange.section6Text2')}</p>
              <p className="text-gray-600 leading-relaxed">{t('returnExchange.section6Text3')}</p>
            </section>

            {/* 7. Exchange */}
            <section>
              <h2 className="text-2xl font-medium mb-4">{t('returnExchange.section7Title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-2">{t('returnExchange.section7Text1')}</p>
              <p className="text-gray-600 leading-relaxed">{t('returnExchange.section7Text2')}</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}