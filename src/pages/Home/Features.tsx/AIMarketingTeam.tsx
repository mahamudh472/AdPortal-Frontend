import { Link } from "react-router-dom";

const AIMarketingTeam = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#050B2C] via-[#0A1A4F] to-[#123C8C]">
      <div className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
  
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Meet your new
              <br />
              <span className="text-blue-400">AI Marketing Team</span>
            </h2>

            <p className="mt-6 max-w-xl text-lg text-blue-100 leading-relaxed">
              AdPortal AI doesn’t just report numbers; it understands them.
              Ask complex questions, get strategic answers, and let the AI
              handle the heavy lifting of budget allocation.
            </p>

    
            <ul className="mt-8 space-y-4">
              {[
                "Automatic Budget Shifts based on Performance",
                "Creative Fatigue Detection",
                "Audience Gap Analysis",
                "Real-time Competitor Insights",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-white text-sm">
                    <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766436649/Vector_5_cjcwor.png" alt="" loading="lazy" decoding="async" />

                   
                  </span>
                  <span className="text-blue-100">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-10">
              <Link
                to="/auth/signin"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Try AI Features Now 
                <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766429385/Icon_22_btqo8m.png" alt="" loading="lazy" decoding="async" />
              </Link>
            </div>
          </div>

     
          <div className="relative flex justify-center lg:justify-end">
            {/* Glow */}
            <div className="absolute -inset-8 rounded-3xl bg-blue-500/20 blur-3xl"></div>

            <img
              src="/images/ai-marketing-team-v1.webp"
              alt="AI Dashboard"
              width={745}
              height={570}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full max-w-2xl rounded-2xl "
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIMarketingTeam;
