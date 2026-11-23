import { QRCodeSVG } from 'qrcode.react';

interface Props {
  value: string;
  size: number;
  label: string;
}

/** Vrai QR code (SVG). Le libellé accessible décrit son rôle, pas son contenu. */
export function QrCode({ value, size, label }: Props) {
  return (
    <div className="qr" role="img" aria-label={label}>
      <QRCodeSVG value={value} size={size} level="M" marginSize={0} />
    </div>
  );
}
