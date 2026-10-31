import { Outlet } from "react-router-dom";
import Navbar from "../components/customer/Navbar";
import Footer from "../components/customer/Footer";
import WhatsAppFloatingButton from "../components/customer/WhatsAppButton";

export default function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory text-charcoal">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
}
