import { Link } from "react-router-dom";
import { toast } from "sonner";


const CreateOnes = () => {

  const handleVideoClick = () =>{
    toast.info("Demo Video is coming soon! Stay tuned.", {
      position: "top-center",

    });
  }


  
  return (
    <section className="relative overflow-hidden bg-white container mx-auto lg:mt-0 mt-5 lg:p-0 p-2 ">
      <div className="max-w-7xl mx-auto ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-600">
              <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766429319/Icon_21_bieqdu.png" alt="" />
              AI Optimization 2.0
            </div>

            {/* Heading */}
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
              Create <span className="text-blue-600">Once.</span>
              <br />
              Publish <span className="text-blue-600">Everywhere.</span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Create, manage, and optimize ads across Meta, Google, and TikTok
              with a single AI-powered platform. Stop switching tabs, start
              scaling.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/user-dashboard/campaigns"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Launch Campaign 
                <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766429385/Icon_22_btqo8m.png" alt="" />
              </Link>

              <Link
                to="/"
                onClick={handleVideoClick}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >

                <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1766429385/play-circle-line_ifxhuh.png" alt="" />
                 <p>Watch Demo</p>
              </Link>
            </div>

            {/* Trust */}
            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex -space-x-2">
                <img
                  className="h-8 w-8 rounded-full border-2 border-white"
                  src="https://i.pravatar.cc/32?img=1"
                  alt=""
                />
                <img
                  className="h-8 w-8 rounded-full border-2 border-white"
                  src="https://i.pravatar.cc/32?img=2"
                  alt=""
                />
                <img
                  className="h-8 w-8 rounded-full border-2 border-white"
                  src="https://i.pravatar.cc/32?img=3"
                  alt=""
                />
              </div>
              <span>Trusted by 2,000+ marketers</span>
            </div>
          </div>

         
          <div className="relative flex justify-center lg:justify-end">
            {/* Background Glow */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-blue-100 to-transparent blur-3xl"></div>

            {/* Dashboard Image (LCP element: eager + high priority, stable public URL) */}
            <img
              src="/images/hero-v1.webp"
              alt="AdPortal Dashboard"
              width={491}
              height={548}
              fetchPriority="high"
              decoding="async"
              className="relative z-10 w-full max-w-xl rounded-2xl mb-10 "
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateOnes;
