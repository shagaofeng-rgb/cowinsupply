import "./globals.css";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

export const metadata = {
  title: "Cowin Supply",
  description: "Professional power tools and industrial supply support for global B2B buyers.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" }
    ],
    apple: "/cowin-assets/cowin-logo.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
