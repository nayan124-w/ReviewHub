/**
 * 🔒 MONETIZATION SERVICE (DISABLED BY DEFAULT)
 * 
 * This module contains the structure for ReviewHub's monetization features.
 * All functions are COMMENTED and should only be activated when payment
 * integration (Razorpay / Stripe) is configured.
 * 
 * Features:
 * 1. Paid Job Postings — Companies pay to post/boost jobs
 * 2. Featured Company Listings — Companies pay for homepage prominence
 * 3. Premium Company Badge — Verified/premium badge on company profile
 * 
 * To activate:
 * 1. Set up Razorpay/Stripe keys in .env
 * 2. Uncomment the functions below
 * 3. Uncomment the UI buttons in CompanyDashboard, PostJob, Jobs pages
 */

// import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from './firebase';
// import { createJob } from './jobs';

/* ──────────────────────────────────────────────
   PRICING CONFIGURATION
   ────────────────────────────────────────────── */

// export const PRICING = {
//   JOB_BOOST: {
//     amount: 499,       // ₹499
//     currency: 'INR',
//     label: 'Boost Job Listing',
//     description: 'Get 5x more visibility for 30 days',
//     durationDays: 30,
//   },
//   FEATURED_COMPANY: {
//     amount: 999,       // ₹999/month
//     currency: 'INR',
//     label: 'Featured Company',
//     description: 'Appear on homepage featured section',
//     durationDays: 30,
//   },
//   PREMIUM_BADGE: {
//     amount: 1999,      // ₹1999/quarter
//     currency: 'INR',
//     label: 'Premium Badge',
//     description: 'Verified premium badge on your profile',
//     durationDays: 90,
//   },
// };

/* ──────────────────────────────────────────────
   1. PAID JOB POSTING
   ────────────────────────────────────────────── */

// /**
//  * Create a paid/boosted job listing.
//  * @param {Object} jobData - Job details
//  * @param {string} paymentToken - Payment gateway token
//  * @returns {Object} Created job with boost metadata
//  */
// export const createPaidJob = async (jobData, paymentToken) => {
//   // Step 1: Verify payment with Razorpay/Stripe
//   // const paymentResult = await verifyPayment(paymentToken, PRICING.JOB_BOOST.amount);
//   // if (!paymentResult.success) {
//   //   throw new Error('Payment verification failed');
//   // }
//
//   // Step 2: Create job with boost metadata
//   // const job = await createJob({
//   //   ...jobData,
//   //   isPaid: true,
//   //   boosted: true,
//   //   boostedAt: serverTimestamp(),
//   //   boostExpiresAt: new Date(Date.now() + PRICING.JOB_BOOST.durationDays * 86400000),
//   //   paymentId: paymentResult.paymentId,
//   // });
//   // return job;
// };

// /**
//  * Boost an existing job listing.
//  * @param {string} jobId - ID of job to boost
//  * @param {string} paymentToken - Payment gateway token
//  */
// export const boostJob = async (jobId, paymentToken) => {
//   // const paymentResult = await verifyPayment(paymentToken, PRICING.JOB_BOOST.amount);
//   // if (!paymentResult.success) throw new Error('Payment failed');
//   //
//   // const jobRef = doc(db, 'jobs', jobId);
//   // await updateDoc(jobRef, {
//   //   boosted: true,
//   //   boostedAt: serverTimestamp(),
//   //   boostExpiresAt: new Date(Date.now() + PRICING.JOB_BOOST.durationDays * 86400000),
//   //   paymentId: paymentResult.paymentId,
//   // });
// };

/* ──────────────────────────────────────────────
   2. FEATURED COMPANY LISTING
   ────────────────────────────────────────────── */

// /**
//  * Make a company featured on the homepage.
//  * @param {string} companyId - Company profile ID
//  * @param {string} paymentToken - Payment gateway token
//  */
// export const purchaseFeaturedListing = async (companyId, paymentToken) => {
//   // const paymentResult = await verifyPayment(paymentToken, PRICING.FEATURED_COMPANY.amount);
//   // if (!paymentResult.success) throw new Error('Payment failed');
//   //
//   // const profileRef = doc(db, 'companyProfiles', companyId);
//   // await updateDoc(profileRef, {
//   //   isFeatured: true,
//   //   featuredAt: serverTimestamp(),
//   //   featuredExpiresAt: new Date(Date.now() + PRICING.FEATURED_COMPANY.durationDays * 86400000),
//   //   featuredPaymentId: paymentResult.paymentId,
//   // });
// };

/* ──────────────────────────────────────────────
   3. PREMIUM BADGE
   ────────────────────────────────────────────── */

// /**
//  * Purchase a premium/verified badge for a company.
//  * @param {string} companyId - Company profile ID
//  * @param {string} paymentToken - Payment gateway token
//  */
// export const purchasePremiumBadge = async (companyId, paymentToken) => {
//   // const paymentResult = await verifyPayment(paymentToken, PRICING.PREMIUM_BADGE.amount);
//   // if (!paymentResult.success) throw new Error('Payment failed');
//   //
//   // const profileRef = doc(db, 'companyProfiles', companyId);
//   // await updateDoc(profileRef, {
//   //   isPremium: true,
//   //   premiumSince: serverTimestamp(),
//   //   premiumExpiresAt: new Date(Date.now() + PRICING.PREMIUM_BADGE.durationDays * 86400000),
//   //   premiumPaymentId: paymentResult.paymentId,
//   // });
// };

/* ──────────────────────────────────────────────
   PAYMENT GATEWAY INTEGRATION
   ────────────────────────────────────────────── */

// /**
//  * Initialize Razorpay payment.
//  * @param {number} amount - Amount in smallest currency unit (paise for INR)
//  * @param {string} description - Payment description
//  * @param {Function} onSuccess - Callback on successful payment
//  * @param {Function} onFailure - Callback on failed payment
//  */
// export const initRazorpayPayment = (amount, description, onSuccess, onFailure) => {
//   // const options = {
//   //   key: import.meta.env.VITE_RAZORPAY_KEY_ID,
//   //   amount: amount * 100, // Convert to paise
//   //   currency: 'INR',
//   //   name: 'ReviewHub',
//   //   description,
//   //   theme: { color: '#6366f1' },
//   //   handler: (response) => {
//   //     onSuccess(response.razorpay_payment_id);
//   //   },
//   //   modal: {
//   //     ondismiss: () => onFailure('Payment cancelled'),
//   //   },
//   // };
//   // const rzp = new window.Razorpay(options);
//   // rzp.open();
// };

// /**
//  * Verify payment on server side (should be done via Cloud Function).
//  * @param {string} paymentToken
//  * @param {number} expectedAmount
//  * @returns {{ success: boolean, paymentId: string }}
//  */
// export const verifyPayment = async (paymentToken, expectedAmount) => {
//   // In production, verify via Cloud Function:
//   // const result = await fetch('/api/verify-payment', {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ paymentToken, expectedAmount }),
//   // });
//   // return result.json();
//   //
//   // For now, return mock:
//   // return { success: true, paymentId: paymentToken };
// };

/* ──────────────────────────────────────────────
   UI COMPONENTS (to be uncommented in pages)
   ────────────────────────────────────────────── */

// PostJob.jsx — Add after the submit button:
// {/*
// <div className="max-w-2xl mx-auto mt-6">
//   <div className="glass rounded-2xl p-6 text-center">
//     <p className="text-sm text-slate-400 mb-3">Want more visibility?</p>
//     <button className="btn-primary bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500">
//       ⚡ Boost Job (₹499)
//     </button>
//   </div>
// </div>
// */}

// CompanyDashboard.jsx — Add in overview tab:
// {/*
// <div className="glass rounded-2xl p-6 text-center">
//   <h3 className="text-lg font-bold text-white mb-2">Premium Company Features</h3>
//   <p className="text-sm text-slate-400 mb-4">Get featured on the homepage and unlock premium badge</p>
//   <div className="flex gap-3 justify-center flex-wrap">
//     <button className="btn-primary bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500">
//       ⭐ Featured Listing (₹999/mo)
//     </button>
//     <button className="btn-primary bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500">
//       💎 Premium Badge (₹1999/qtr)
//     </button>
//   </div>
// </div>
// */}

// Jobs.jsx — Add at the bottom:
// {/*
// <div className="glass rounded-2xl p-6 mt-8 text-center">
//   <h3 className="text-lg font-bold text-white mb-2">Boost Your Job Listing</h3>
//   <p className="text-sm text-slate-400 mb-4">Get 5x more visibility with a featured listing</p>
//   <button className="btn-primary bg-gradient-to-r from-amber-500 to-orange-600">
//     ⚡ Boost Job (₹499)
//   </button>
// </div>
// */}
