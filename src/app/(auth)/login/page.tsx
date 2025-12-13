import type { Metadata } from "next";
import { LoginForm } from "../_components/LoginForm";
import { createMetadata } from "@/lib/metadata";

export const metadata:Metadata = createMetadata({
  title: "Login",
  description: "Secure access to the Consensus financial learning network.",
});

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <LoginForm />
    </div>
  );
}