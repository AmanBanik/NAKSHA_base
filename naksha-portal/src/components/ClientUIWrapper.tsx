'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import CopilotChat from "@/components/CopilotChat";

export default function ClientUIWrapper() {
   const pathname = usePathname();
   
   // Hide Admin UI on public routes (Public Validator and Certificate QR views)
   const isPublicRoute = pathname.startsWith('/certificate') || pathname.startsWith('/verify');
   
   if (isPublicRoute) {
       return null;
   }
   
   return (
      <>
         <Sidebar />
         <CopilotChat />
      </>
   );
}
