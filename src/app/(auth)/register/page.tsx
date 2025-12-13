import type { Metadata } from "next";

import { RegisterForm } from "../_components/UserRegistrationForm";
import { createMetadata } from "@/lib/metadata";


export const metadata: Metadata = createMetadata({
  title: "Create Account",
  description: "Join the social learning network for modern investors.",
});



export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center space-y-6">

      <RegisterForm />

    </div>
  );
}