'use client';
import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { VendorPdfProfile } from './_vendor_pdf';

interface Props {
  profile: VendorPdfProfile;
  userId: string;
}

function qrSrc(data: string, size = 100) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=4`;
}

export function VendorPdfButton({ profile, userId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ pdf }, { VendorPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./_vendor_pdf'),
      ]);

      const phone         = (profile.mobile || profile.whatsapp || '').replace(/\D/g, '');
      const whatsappQrUrl = phone   ? qrSrc(`https://wa.me/${phone}`) : '';
      const storeQrUrl    = userId  ? qrSrc(`https://app.gaubook.org/market/${userId}`) : '';
      const upiQrUrl      = profile.upiId
        ? qrSrc(`upi://pay?pa=${encodeURIComponent(profile.upiId)}&pn=${encodeURIComponent(profile.upiMerchantName ?? '')}&cu=INR`, 120)
        : '';

      const blob = await pdf(
        <VendorPdfDocument
          profile={profile}
          whatsappQrUrl={whatsappQrUrl}
          storeQrUrl={storeQrUrl}
          upiQrUrl={upiQrUrl}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${(profile.businessName || profile.fullname).replace(/[^a-z0-9]/gi, '_')}_Profile.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Vendor PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="btn-outline"
      style={{ fontSize: 14, padding: '10px 14px' }}
      title="Download Profile PDF"
    >
      {loading ? (
        <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <FileDown size={16} />
      )}
    </button>
  );
}
