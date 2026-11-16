import { Link } from "react-router-dom";

const PowerfulFeatures = () => {
  return (
   <div>
     <section className="w-full bg-white mt-10 ">
      <div className="container mx-auto px-6">

        <div className="mb-20 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Powerful <span className="text-blue-600">Features</span>
          </h2>
          <p className="mt-3 text-slate-600">
            Advanced features built for modern advertisers
          </p>
        </div>

       
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-20 ">
          {/* Left Feature */}
          <div>
            <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766437021/Payment_Icon_Container_nuoyvf.png" alt=""  className="mb-5" loading="lazy" decoding="async"/>

            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Dashboard
            </h3>

            <p className="max-w-md text-slate-600 leading-relaxed mb-8">
              Get a unified, real-time overview of all your ad accounts,
              performance metrics, budgets, and platform activities — all in
              one powerful dashboard.
            </p>

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

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Soft background */}
            <div className="absolute -inset-6 rounded-3xl bg-blue-100/40 blur-3xl"></div>

            <img
              src="/images/feature-dashboard-v1.webp"
              alt="AdPortal Dashboard"
              width={656}
              height={490}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full max-w-3xl rounded-2xl "
            />
          </div>
        </div>





              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-20 ">
          {/* Left Feature */}
         

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Soft background */}
            <div className="absolute -inset-6 rounded-3xl bg-blue-100/40 blur-3xl"></div>

            <img
              src="/images/feature-campaigns-v1.webp"
              alt="AdPortal Dashboard"
              width={656}
              height={490}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full max-w-3xl rounded-2xl "
            />
          </div>


           <div>
            <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766437610/Payment_Icon_Container_3_zzcnyx.png" alt=""  className="mb-5" loading="lazy" decoding="async"/>

            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Campaigns
            </h3>

            <p className="max-w-md text-slate-600 leading-relaxed mb-8">
             Effortlessly create, manage, and optimize campaigns across multiple platforms with a streamlined workflow designed for speed, clarity, and better results.
            </p>

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













          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-20 ">
          {/* Left Feature */}
          <div>
            <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766437614/Payment_Icon_Container_2_wsaraa.png" alt=""  className="mb-5" loading="lazy" decoding="async"/>

            <h3 className="text-xl font-bold text-slate-900 mb-4">
              AI Tools
            </h3>

            <p className="max-w-md text-slate-600 leading-relaxed mb-8">
              Leverage advanced AI to generate high-performing ad copy, improve targeting, optimize budgets, and automate smart decisions that boost your campaign performance.
            </p>

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

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Soft background */}
            <div className="absolute -inset-6 rounded-3xl bg-blue-100/40 blur-3xl"></div>

            <img
              src="/images/feature-ai-tools-v1.webp"
              alt="AdPortal Dashboard"
              width={656}
              height={490}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full max-w-3xl rounded-2xl "
            />
          </div>
        </div>









        

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-20 ">
          {/* Left Feature */}
         

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Soft background */}
            <div className="absolute -inset-6 rounded-3xl bg-blue-100/40 blur-3xl"></div>

            <img
              src="/images/feature-analytics-v1.webp"
              alt="AdPortal Dashboard"
              width={656}
              height={490}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full max-w-3xl rounded-2xl "
            />
          </div>


           <div>
            <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766437615/Payment_Icon_Container_1_j9p7ww.png" alt=""  className="mb-5" loading="lazy" decoding="async"/>

            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Analytics
            </h3>

            <p className="max-w-md text-slate-600 leading-relaxed mb-8">
             Dive deep into your ad performance with clear, actionable insights that help you track results, understand trends, and make smarter growth decisions.
            </p>

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


    




   </div>
  );
};

export default PowerfulFeatures;
