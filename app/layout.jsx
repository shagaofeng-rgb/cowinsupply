import "./globals.css";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

export const metadata = {
  title: "Cowin Supply",
  description: "Factory direct professional power tools"
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
