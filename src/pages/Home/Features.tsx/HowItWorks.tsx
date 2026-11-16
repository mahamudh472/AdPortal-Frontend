import { Link } from "react-router-dom";

const HowItWorks = () => {
  return (
    <section className="w-full bg-white py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          <div className="flex justify-center lg:justify-start">
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766437895/Image_8_cen8bi.png"
              alt="How it works"
              className=""
              loading="lazy"
              decoding="async"
            />
          </div>


          <div>
            {/* Step 1 */}
            <div className="flex items-start gap-4 mb-8">
            
              
              <div>
                <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766438043/Frame_1000003616_lixrhk.png" alt="" loading="lazy" decoding="async" />
                <h3 className="text-lg font-bold text-slate-900">
                 1. Connect Accounts
                </h3>
                <p className="mt-1 text-slate-600">
                  Meta, Google, TikTok — all linked securely in minutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 mb-8">
              
              <div>

                <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766438128/Frame_1000003616_1_k5bgo3.png" alt="" loading="lazy" decoding="async" />
                <h3 className="text-lg font-bold text-slate-900">
                 2. Create & Optimize
                </h3>
                <p className="mt-1 text-slate-600">
                  Build smarter campaigns with AI copy, targeting, and budget
                  tips.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 mb-10">
          
              <div>

                <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766438127/Frame_1000003616_2_uukplv.png" alt="" loading="lazy" decoding="async" />
                <h3 className="text-lg font-bold text-slate-900">
                 3. Track & Grow
                </h3>
                <p className="mt-1 text-slate-600">
                  Monitor results, get insights, and scale winning campaigns
                  fast.
                </p>
              </div>
            </div>

            {/* CTA */}
                                <Link
  to="/user-dashboard/dashboard"
  className="
    inline-flex items-center justify-center
    rounded-xl
    bg-[#3B6FF5]
    px-8 py-4
    text-base font-semibold text-white
    shadow-[0_12px_30px_rgba(59,111,245,0.45)]
    transition-all duration-300
    hover:bg-[#2F5DE0]
    hover:shadow-[0_16px_40px_rgba(59,111,245,0.6)]
    active:scale-[0.98]
  "
>
  Start Free Trial
</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
