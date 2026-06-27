/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle, CreditCard, ShieldCheck, Heart, ArrowRight, Zap, Info, RotateCcw } from 'lucide-react';

interface UpgradePremiumViewProps {
  user: any; // User | null
  isPremium: boolean;
  upgradeUserPremium: (userId?: string, setPremium?: boolean) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  isAdmin?: boolean;
}

export function UpgradePremiumView({
  user,
  isPremium,
  upgradeUserPremium,
  onSignInWithGoogle,
  isAdmin = false
}: UpgradePremiumViewProps) {
  const stripePaymentLink = (import.meta as any).env?.VITE_STRIPE_PAYMENT_LINK || '';
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCelebration, setSuccessCelebration] = useState(false);

  // Benefits list
  const premiumBenefits = [
    {
      title: "Unlimited Activity Quotas",
      desc: "Lifts the standard 1,000 daily database reads to 100,000+ so your large physics/biology logs never freeze."
    },
    {
      title: "Active Recall Analytics",
      desc: "Unlock advanced insights, subject heatmaps, and error-frequency forecasting on your dashboard."
    },
    {
      title: "Priority Cloud Backup",
      desc: "Double-redundant server-side backups ensure your precious mistake logs are never lost."
    },
    {
      title: "Unrestricted Folders & Subjects",
      desc: "Create endless study subjects, nested topics, and customized tags without any structure limits."
    },
    {
      title: "One-Time $20 Price (No Monthly Fee)",
      desc: "Enjoy lifetime access with zero subscription stress. Pay once, use forever."
    }
  ];

  const handleSimulatedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Please sign in with Google first to attach your Lifetime Premium purchase to your account securely.");
      return;
    }

    if (cardNumber.replace(/\s/g, '') !== '4242424242424242') {
      setErrorMessage("For testing, please enter Stripe's official mock test card: '4242 4242 4242 4242'.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Simulate Stripe gateway processing delay
      await new Promise((resolve) => setTimeout(resolve, 1800));
      
      // Update Firestore user document!
      await upgradeUserPremium(user.uid, true);
      
      setSuccessCelebration(true);
    } catch (err: any) {
      setErrorMessage("Payment failed: " + (err.message || "Unknown gateway error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleInstantUpgradeForTesting = async () => {
    if (!user) {
      setErrorMessage("Please sign in first to bind premium status.");
      return;
    }
    setLoading(true);
    try {
      await upgradeUserPremium(user.uid, true);
      setSuccessCelebration(true);
    } catch (err: any) {
      setErrorMessage("Upgrade error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForTesting = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await upgradeUserPremium(user.uid, false);
      setSuccessCelebration(false);
    } catch (err: any) {
      setErrorMessage("Reset error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-16 font-sans">
      
      {/* Visual Header */}
      <section className="text-center space-y-3 py-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase tracking-widest animate-pulse">
          <Sparkles className="w-3.5 h-3.5 fill-current" /> Early Supporter Pricing
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2A26] tracking-tight">
          Unlock StudyFlow Lifetime
        </h2>
        <p className="text-sm text-[#6B6357] leading-relaxed">
          Get lifetime access for a single, one-time payment of <strong className="text-black font-semibold">$20</strong>. Once we reach our first 50 users, we will transition to a <strong className="text-black font-semibold">$9/month</strong> subscription model, but early supporters are grandfathered in forever.
        </p>
      </section>

      {successCelebration || isPremium ? (
        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-3xl text-center space-y-5 shadow-sm animate-scale-up">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8 stroke-[2]" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-[#2D2A26]">You are a Lifetime Partner!</h3>
            <p className="text-sm text-[#6B6357] max-w-md mx-auto leading-relaxed">
              Your account is successfully upgraded. You have unlocked unlimited database resource usage, premium recall analytics, and priority cloud-sync speeds for life.
            </p>
          </div>
          <div className="pt-4 border-t border-emerald-100/60 max-w-sm mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-stone-600 font-mono">
              <span>Account Status:</span>
              <span className="font-bold text-emerald-700 uppercase tracking-wide">★ Active Lifetime</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-600 font-mono">
              <span>Quota Limit:</span>
              <span className="font-bold text-stone-800">100,000 reads/day</span>
            </div>
            {user && (
              <div className="flex items-center justify-between text-xs text-stone-600 font-mono">
                <span>Binding Email:</span>
                <span className="font-bold text-stone-800">{user.email}</span>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={handleResetForTesting}
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Admin only: Click to revert to free plan to test the checkout experience again"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" /> Revert to Free (Admin Test)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Benefits checklist */}
          <div className="md:col-span-7 bg-white border border-[#E8E2D9] p-6 md:p-8 rounded-3xl space-y-6 shadow-xs text-left">
            <h3 className="font-serif text-xl font-bold text-[#2D2A26] border-b border-[#E8E2D9]/40 pb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-current" /> Why Upgrade to Lifetime?
            </h3>
            
            <div className="space-y-5">
              {premiumBenefits.map((b, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-sans text-xs font-bold text-[#2D2A26] uppercase tracking-wider">{b.title}</h4>
                    <p className="text-xs text-[#6B6357] leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-4.5 rounded-2xl flex gap-3 text-left">
              <Info className="w-5 h-5 text-[#5A5A40] shrink-0 mt-0.5" />
              <div className="space-y-1 font-sans">
                <span className="font-bold text-[10px] text-[#5A5A40] uppercase tracking-widest block">Stripe Transition Path</span>
                <p className="text-xs text-[#6B6357] leading-relaxed">
                  When we expand to 50 users and introduce the monthly model, existing lifetime members retain full premium status automatically. Your database ID is permanently flagged.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Widget */}
          <div className="md:col-span-5 space-y-4">
            
            <div className="bg-white border-2 border-[#5A5A40] p-6 rounded-3xl shadow-md text-left space-y-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 bg-[#5A5A40] text-white font-bold uppercase tracking-widest text-[8px] px-3.5 py-1.5 rounded-bl-xl shadow-xs">
                Secure Checkout
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#9A9184] font-bold uppercase tracking-widest block">StudyFlow Premium</span>
                <h3 className="font-serif text-2xl font-black text-[#2D2A26] flex items-baseline gap-1">
                  $20.00 <span className="text-xs font-sans font-semibold text-[#6B6357] uppercase">One-Time</span>
                </h3>
              </div>

              {/* Form block */}
              {stripePaymentLink ? (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-[#6B6357] uppercase tracking-widest">Google Account Link</label>
                    {user ? (
                      <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[11.5px] font-mono text-stone-700 flex items-center justify-between">
                        <span className="truncate">{user.email}</span>
                        <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Linked</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-red-650 leading-tight">
                          You must connect your Google account to unlock cloud premium.
                        </p>
                        <button
                          type="button"
                          onClick={onSignInWithGoogle}
                          className="w-full py-2 bg-[#4285F4] hover:bg-[#357AE8] text-white rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          Sign In First
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[11.5px] text-[#6B6357] leading-relaxed">
                    You will be securely redirected to Stripe to complete your <strong className="text-black">$20.00</strong> payment. Your premium status will instantly activate upon completion.
                  </p>

                  <button
                    onClick={() => {
                      if (!user) {
                        setErrorMessage("Please sign in first to bind your purchase.");
                        return;
                      }
                      let cleanLink = stripePaymentLink.trim();
                      if (cleanLink && !/^https?:\/\//i.test(cleanLink)) {
                        cleanLink = `https://${cleanLink}`;
                      }
                      const separator = cleanLink.includes('?') ? '&' : '?';
                      const finalLink = `${cleanLink}${separator}prefilled_email=${encodeURIComponent(user.email || '')}`;
                      window.open(finalLink, '_blank', 'noopener,noreferrer');
                    }}
                    disabled={!user}
                    className="w-full py-3 bg-[#5A5A40] hover:bg-[#4D4D36] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-45 cursor-pointer active:scale-98"
                  >
                    Proceed to Stripe Checkout <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSimulatedCheckout} className="space-y-3 font-sans text-xs pt-1">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-[#6B6357] uppercase tracking-widest">Google Account Link</label>
                    {user ? (
                      <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[11.5px] font-mono text-stone-700 flex items-center justify-between">
                        <span className="truncate">{user.email}</span>
                        <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Linked</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-red-650 leading-tight">
                          You must connect your Google account to unlock cloud premium.
                        </p>
                        <button
                          type="button"
                          onClick={onSignInWithGoogle}
                          className="w-full py-2 bg-[#4285F4] hover:bg-[#357AE8] text-white rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          Sign In First
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="block text-[9px] font-bold text-[#6B6357] uppercase tracking-widest">Card Details</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242 (Stripe Test)"
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const matches = val.match(/\d{4,16}/g);
                          const match = (matches && matches[0]) || '';
                          const parts = [];
                          for (let i = 0, len = match.length; i < len; i += 4) {
                            parts.push(match.substring(i, i + 4));
                          }
                          setCardNumber(parts.length > 0 ? parts.join(' ') : val);
                        }}
                        className="w-full p-2.5 pl-9 rounded-xl border border-[#E8E2D9] focus:outline-none focus:border-[#5A5A40] text-black font-mono placeholder:font-sans font-bold"
                        required
                      />
                      <CreditCard className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-[#6B6357] uppercase tracking-widest">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (val.length >= 3) {
                            setExpiry(val.substring(0, 2) + '/' + val.substring(2));
                          } else {
                            setExpiry(val);
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-[#E8E2D9] focus:outline-none focus:border-[#5A5A40] text-black font-mono font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-[#6B6357] uppercase tracking-widest">CVC / CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className="w-full p-2.5 rounded-xl border border-[#E8E2D9] focus:outline-none focus:border-[#5A5A40] text-black font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-[11px] text-red-600 font-semibold leading-normal pt-1">
                      ⚠️ {errorMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !user}
                    className="w-full py-3 bg-[#5A5A40] hover:bg-[#4D4D36] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md mt-4 disabled:opacity-45 cursor-pointer active:scale-98"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Pay $20 One-Time <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Quick action block for testing (admin only) */}
            {isAdmin && (
              <div className="bg-amber-500/5 border border-amber-500/25 p-4 rounded-2xl text-left space-y-2">
                <span className="text-[9px] font-extrabold text-amber-700 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" /> Admin Test Panel
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Click below to instantly flag your Firestore account as Premium without typing test cards.
                </p>
                <button
                  onClick={handleInstantUpgradeForTesting}
                  disabled={loading || !user}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
                >
                  Instant Admin Upgrade
                </button>
              </div>
            )}

            <div className="text-center">
              <span className="text-[10px] text-stone-400 font-medium inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Payments secured by 256-bit SSL gateway
              </span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
