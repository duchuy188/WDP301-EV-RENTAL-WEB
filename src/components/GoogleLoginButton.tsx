
import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "@/lib/firebase";

interface GoogleLoginButtonProps {
  onSuccess?: (idToken: string) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const handleGoogleLogin = async () => {
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        const idToken = await user.getIdToken();
        console.log('Google idToken:', idToken);
        if (onSuccess) onSuccess(idToken);
      }
    } catch (error) {
      // Có thể thêm xử lý lỗi nếu cần
      console.error("Google login error", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 h-12 mt-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 shadow transition-all duration-200"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <g>
          <path fill="#4285F4" d="M12 11.7v2.6h7.4c-.3 1.6-2 4.7-7.4 4.7-4.4 0-8-3.6-8-8s3.6-8 8-8c2.5 0 4.2 1 5.2 1.9l-2.1 2.1C14.2 6.5 13.2 6 12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6c3.4 0 4.7-2.2 4.9-3.3H12z"/>
          <path fill="#34A853" d="M21.6 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h5.3c-.2 1.1-1.3 3.1-5.3 3.1-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6c1.7 0 2.8.7 3.4 1.3l2.3-2.3C16.2 4.7 14.3 4 12 4 6.5 4 2 8.5 2 14s4.5 10 10 10c5.5 0 10-4.5 10-10 0-.7-.1-1.3-.2-1.8z"/>
          <path fill="#FBBC05" d="M3.6 7.7l2.7 2c.7-1.2 2.1-2.7 5.7-2.7 1.7 0 3.2.7 4.2 1.7l2.3-2.3C16.2 4.7 14.3 4 12 4c-3.9 0-7.2 2.5-8.4 6.1z"/>
          <path fill="#EA4335" d="M12 22c2.3 0 4.2-.7 5.7-2l-2.7-2.1c-.7.5-1.7.8-3 .8-3.2 0-5.9-2.1-6.8-5.1l-2.7 2.1C4.8 19.5 8.1 22 12 22z"/>
        </g>
      </svg>
      <span className="text-base font-medium text-gray-700">Đăng nhập với Google</span>
    </button>
  );
};

export default GoogleLoginButton;
