import "./globals.css";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

export const metadata = {
  title: "Cowin Supply",
  description: "Factory direct professional power tools",
  icons: {
    icon: "/favicon.png",
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
