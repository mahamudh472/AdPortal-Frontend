// import { Elements } from "@stripe/react-stripe-js";
// import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
// import { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import CheckoutForm from "./CheckoutForm";
// import api from "@/lib/axios";

// const stripePromise = loadStripe(
//   import.meta.env.VITE_payment_gateway_key as string
// );

// type CheckoutResponse = {
//   clientSecret?: string;
//   client_secret?: string;
// };

// const getOrgId = (): string => {
//   try {
//     const selectedOrg = localStorage.getItem("selectedOrganization");
//     if (selectedOrg) {
//       const orgData = JSON.parse(selectedOrg);
//       if (orgData?.id) return orgData.id;
//     }
//   } catch (error) {
//     console.error("Org parse error:", error);
//   }
//   return "";
// };

// const Payment = () => {
//   const [searchParams] = useSearchParams();
//   const planId = searchParams.get("plan_id") || "";
//   const planKey = searchParams.get("plan_key") || "";
//   const org_id = getOrgId();

//   const [clientSecret, setClientSecret] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const createPaymentIntent = async () => {
//       if (!planId || !planKey || !org_id) {
//         setError("Missing plan or organization information");
//         return;
//       }

//       try {
//         setLoading(true);

//         const res = await api.post<CheckoutResponse>(
//           `/finance/buy-plan/?org_id=${org_id}`,
//           {
//             plan_id: planId,
//             plan_key: planKey,
//           }
//         );

//         const secret = res.data.clientSecret || res.data.client_secret;
//         setClientSecret(secret);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to initialize payment");
//       } finally {
//         setLoading(false);
//       }
//     };

//     createPaymentIntent();
//   }, [planId, planKey, org_id]);

//   const options: StripeElementsOptions | undefined = clientSecret
//     ? {
//         clientSecret,
//         appearance: { theme: "stripe" },
//       }
//     : undefined;

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
//       <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8">
//         <h2 className="text-2xl font-bold mb-2">Complete Your Payment</h2>
//         <p className="text-gray-500 mb-6">Secure checkout powered by Stripe</p>

//         {loading && <div className="text-center py-10">Initializing payment...</div>}

//         {error && (
//           <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>
//         )}

//         {clientSecret && options && (
//           <Elements stripe={stripePromise} options={options}>
//             <CheckoutForm />
//           </Elements>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Payment;











import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";

const publishableKey =
    import.meta.env.VITE_payment_gateway_key ||
    import.meta.env.VITE_PAYMENT_GATEWAY_KEY ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "";

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CheckoutResponse = {
    clientSecret?: string;
    client_secret?: string;
    checkout_session_id?: string;
    message?: string;
};

type RouteState = {
    planId?: number;
    planKey?: string;
};

const getOrgId = (): string => {
    try {
        const selectedOrg = localStorage.getItem("selectedOrganization");
        if (selectedOrg) {
            const orgData = JSON.parse(selectedOrg);
            if (orgData?.id) return String(orgData.id);
        }
    } catch (error) {
        console.error("Org parse error:", error);
    }
    return "";
};

const Payment = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const routeState = (location.state as RouteState | null) ?? null;

    const planId = routeState?.planId?.toString() || searchParams.get("plan_id") || "";
    const planKey = routeState?.planKey || searchParams.get("plan_key") || "";
    const org_id = useMemo(() => getOrgId(), []);

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [backendMessage, setBackendMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!publishableKey) {
            setError(
                "Missing Stripe publishable key. Add VITE_payment_gateway_key to your .env file."
            );
            return;
        }

        const createPaymentIntent = async () => {
            if (!planId || !planKey) {
                setError("Missing plan information. Please go back and select a plan.");
                return;
            }

            if (!org_id) {
                setError("Organization not found. Please select an organization first.");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await api.post<CheckoutResponse>(
                    `/finance/buy-plan/?org_id=${org_id}`,
                    {
                        plan_id: Number(planId),
                        plan_key: planKey,
                    }
                );

                if (response.data.message) {
                    setBackendMessage(response.data.message);
                    setLoading(false);
                    return;
                }

                const secret = response.data.clientSecret || response.data.client_secret;
                if (!secret) {
                    setError("Backend did not return a Stripe client secret.");
                    return;
                }

                setClientSecret(secret);
            } catch (err) {
                console.error("Error creating payment intent:", err);
                setError("Failed to load payment form. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        createPaymentIntent();
    }, [org_id, planId, planKey]);

    const fetchClientSecret = async () => {
        if (!clientSecret) {
            throw new Error("Missing checkout client secret");
        }

        return clientSecret;
    };

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto mt-8 w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-blue-900 px-6 py-6 text-white">
                    <h1 className="text-2xl font-bold">Complete Your Payment</h1>
                    <p className="mt-1 text-sm text-blue-100">Secure checkout powered by Stripe</p>
                </div>

                <div className="p-6 space-y-5">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                        <p><span className="font-semibold">Plan ID:</span> {planId || "N/A"}</p>
                        <p><span className="font-semibold">Plan Key:</span> {planKey || "N/A"}</p>
                    </div>

                    {loading && (
                        <div className="rounded-lg border border-slate-200 p-5 text-center text-slate-600">
                            Loading payment form...
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!publishableKey && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Missing Stripe publishable key. Please add <span className="font-semibold">VITE_payment_gateway_key</span> in your .env file and restart the dev server.
                        </div>
                    )}

                    {backendMessage && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">Subscription Update</h3>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                {backendMessage}
                            </p>
                            <button 
                                onClick={() => navigate('/user-dashboard/subscriptions')}
                                className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                            >
                                Back to Subscriptions
                            </button>
                        </div>
                    )}

                    {publishableKey && clientSecret && !error && !backendMessage && stripePromise && (
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{ fetchClientSecret }}
                        >
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                                <EmbeddedCheckout />
                            </div>
                        </EmbeddedCheckoutProvider>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Payment;