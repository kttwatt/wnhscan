"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ProfileIncomplete() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="card-whitespace max-w-md text-center">
        <h1 className="text-xl font-bold text-navy-900">บัญชียังไม่ได้รับการตั้งค่า</h1>
        <p className="mt-2 text-sm text-text-secondary">
          บัญชีของคุณยังไม่มีข้อมูลสิทธิ์ในระบบ กรุณาติดต่อผู้ดูแลระบบ
        </p>
        <Button variant="secondary" className="mt-6" onClick={handleLogout}>
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );
}
