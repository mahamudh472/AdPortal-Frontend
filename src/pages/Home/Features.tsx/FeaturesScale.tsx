const FeaturesScale = () => {
  return (
    <section className="w-full bg-gradient-to-b from-slate-50 to-white py-20">
      <div className=" container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Everything you <span className="text-blue-600">need</span> to scale
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-slate-600">
            We've combined the power of an agency media buyer with the speed of AI.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="rounded-2xl border border-blue-200 bg-white p-8 shadow-sm hover:shadow-md transition">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
             <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766436076/Home_1_dcywoa.png" alt="" loading="lazy" decoding="async" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Multi-Platform Publishing
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Create one ad creative and publish it instantly to Meta, Google,
              and TikTok. Automatic formatting included.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-blue-200 bg-white p-8 shadow-sm hover:shadow-md transition">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766436076/Home_2_mjyila.png" alt="" loading="lazy" decoding="async" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              AI Copywriter & Creative
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Never write another headline. Our Gemini-powered AI generates
              high-converting copy and suggests visuals.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-blue-200 bg-white p-8 shadow-sm hover:shadow-md transition">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766436076/Home_3_ifls2r.png" alt="" loading="lazy" decoding="async" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Unified Analytics
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Stop manually aggregating CSVs. See your blended ROAS and CPA
              across all platforms in one real-time dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesScale;
