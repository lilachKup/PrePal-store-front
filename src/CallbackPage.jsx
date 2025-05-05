// src/CallbackPage.jsx
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export default function CallbackPage() {
  const auth = useAuth();

  useEffect(() => {
    auth.signinRedirectCallback();
  }, []);

  return <p>Redirecting...</p>;
}
