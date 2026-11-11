import { Suspense } from "react";
import { Outlet } from "react-router";
import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";



const Root = () => {
    return (
        <div>

            <Navbar />

            <Suspense fallback={<div className="flex h-full min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading…</div>}><Outlet /></Suspense>
            <Footer />
            
        </div>
    );
};

export default Root;