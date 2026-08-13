import { Home } from "@/components/ui/chat-template";
import { SidebarProvider } from "@/components/blocks/sidebar";

function Demo() {
  return (
    <SidebarProvider>
      <Home />
    </SidebarProvider>
  );
}

export { Demo };
