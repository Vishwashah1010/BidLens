import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../firebase";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, CheckCircle2, Sparkles, Loader2, KeyRound } from "lucide-react";
import BidLensLogo from "./BidLensLogo";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Account created successfully! Welcome to BidLens.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Firebase Authentication Error:", err);
      let friendlyMessage = "An error occurred during authentication.";
      
      switch (err.code) {
        case "auth/email-already-in-use":
          friendlyMessage = "This email is already registered. Please sign in instead.";
          break;
        case "auth/invalid-email":
          friendlyMessage = "Please enter a valid email address.";
          break;
        case "auth/user-disabled":
          friendlyMessage = "This account has been disabled. Please contact support.";
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          friendlyMessage = "Invalid email or password. Please try again.";
          break;
        case "auth/weak-password":
          friendlyMessage = "Password should be at least 6 characters.";
          break;
        default:
          friendlyMessage = err.message || friendlyMessage;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === "auth/configuration-not-found") {
        setError(
          "Google Sign-In is not yet enabled for this Firebase Project. To fix this:\n" +
          "1. Go to your Firebase Console (for project 'bidlens-e3b21')\n" +
          "2. Navigate to Build > Authentication > Sign-in method\n" +
          "3. Click 'Add new provider' and select 'Google', then save.\n\n" +
          "In the meantime, you can register and sign in immediately using your Work Email and Password below!"
        );
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1C1E] flex flex-col items-center justify-center font-sans p-6 relative">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />
      <div className="absolute top-10 left-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#E1E4E8] rounded-xl shadow-lg p-8 relative z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl mb-4 shadow-2xs">
            <BidLensLogo size={44} hasBorder={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
            BidLens <span className="text-xs font-bold font-mono px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded">v2.4</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs">
            Enterprise Agentic Bid Auditing & Compliance Verification Portal
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5 font-medium leading-relaxed animate-shake">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2.5 font-medium leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                id="auth-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="animate-fadeIn">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="auth-confirm-password-input"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required={isSignUp}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            <span>{isSignUp ? "Create Account" : "Secure Sign In"}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
            <span className="bg-white px-3">Or connect via</span>
          </div>
        </div>

        {/* Google SSO */}
        <button
          id="auth-google-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.415 0-6.19-2.775-6.19-6.19s2.775-6.19 6.19-6.19c1.55 0 2.964.57 4.047 1.508l3.15-3.15C19.123 2.012 15.892 1 12.24 1 6.032 1 1 6.032 1 12.24s5.032 11.24 11.24 11.24c6.03 0 11.114-4.887 11.114-11.24 0-.648-.065-1.285-.185-1.955H12.24z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Switch mode */}
        <div className="text-center mt-6">
          <button
            id="auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up here"}
          </button>
        </div>
      </div>

      {/* Trust Badge */}
      <p className="text-[10px] text-slate-400 font-semibold mt-6 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
        Zero-trust sandbox verification environment active
      </p>
    </div>
  );
}
