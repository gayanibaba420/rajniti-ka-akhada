"use client";

import { Suspense } from "react";
import AdminLoginForm from "./login-form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">लोड हो रहा है...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
