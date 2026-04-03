"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

// 👇 這裡改用乾淨的 @/ 路徑別名，直接指向 src/utils/...
import { createClient } from "@/utils/supabase/client";

export default function ErrorDisplay({
  message,
  subMessage,
  icon: Icon = ShieldAlert,
}: {
  message: string;
  subMessage: string;
  icon?: React.ElementType;
}) {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 rounded-2xl border border-slate-200">
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-full mb-4 shadow-md">
          <Icon className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{message}</h1>
        <p className="text-slate-500 mt-2 max-w-md">{subMessage}</p>
        {!user && (
          <Link
            href="/login"
            className="mt-6 inline-block bg-admin-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-admin-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
}
