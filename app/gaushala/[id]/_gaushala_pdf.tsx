// No 'use client' — dynamically imported client-side only from _pdf_button.tsx
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const C = {
  orange:      '#F07B1D',
  darkOrange:  '#E05A00',
  canvas:      '#FAF5EE',
  dark:        '#2A1A0A',
  text:        '#3D2B1A',
  muted:       '#7A6A5A',
  divider:     '#EDE5D8',
  white:       '#FFFFFF',
  green:       '#1A3A2A',
  greenAccent: '#2ECC71',
  orangeTint:  '#FFF8F0',
};

const PAD = 28;

export interface GaushalaPdfProfile {
  businessName?: string;
  fullname: string;
  legalStatus?: string;
  establishedYear?: number;
  city?: string;
  district?: string;
  state?: string;
  description?: string;
  mobile?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  visitTiming?: string;
  provides80G?: boolean;
  has12A?: boolean;
  darpanNo?: string;
  pan?: string;
  trustRegNo?: string;
  certificate80GNumber?: string;
  branch?: string;
  accountType?: string;
  cowCensus?: {
    nandi?: number;
    milkingCows?: number;
    nonMilking?: number;
    maleCalves?: number;
    femaleCalves?: number;
    total?: number;
  };
  bankName?: string;
  accountHolderName?: string;
  accountNo?: string;
  ifsc?: string;
  upiId?: string;
  upiMerchantName?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

interface Props {
  profile: GaushalaPdfProfile;
  whatsappQrUrl: string;
  storeQrUrl: string;
  upiQrUrl: string;
}

const s = StyleSheet.create({
  page: { backgroundColor: C.canvas, fontFamily: 'Helvetica' },

  // hero
  hero:         { backgroundColor: C.orange, padding: PAD, paddingBottom: 14 },
  gbPill:       { backgroundColor: C.white, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 10 },
  gbPillText:   { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.darkOrange, letterSpacing: 1 },
  heroRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar:       { width: 46, height: 46, borderRadius: 23, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarLetter: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.darkOrange },
  heroInfo:     { flex: 1 },
  heroName:     { fontFamily: 'Helvetica-Bold', fontSize: 14, color: C.white, lineHeight: 1.25, marginBottom: 5 },
  heroBadgeRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 4 },
  heroBadge:    { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.45)' },
  heroBadgeTxt: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.white, letterSpacing: 0.4 },
  heroLoc:      { fontSize: 8, color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 },
  certStrip:    { flexDirection: 'row', gap: 5, marginTop: 8, flexWrap: 'wrap' },
  certBadge:    { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
  certBadgeTxt: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.white, letterSpacing: 0.3 },

  // census
  census:      { backgroundColor: C.dark, flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 16 },
  censusStat:  { flex: 1, alignItems: 'center' },
  censusNum:   { fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.white, lineHeight: 1.1 },
  censusNumHi: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.orange, lineHeight: 1.1 },
  censusLbl:   { fontSize: 6, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 2 },
  censusLblHi: { fontSize: 6, color: 'rgba(240,123,29,0.7)', letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 2 },
  censusSep:   { width: 0.5, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: 4 },

  // body
  body:        { flex: 1, padding: PAD, paddingTop: 14, paddingBottom: 10 },
  secHead:     { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.darkOrange, letterSpacing: 0.8, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: C.orange, paddingBottom: 3, marginBottom: 6 },
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, gap: 6 },
  infoLabel:   { fontSize: 7.5, color: C.muted, width: 70, flexShrink: 0, lineHeight: 1.35 },
  infoVal:     { flex: 1, fontSize: 8.5, color: C.dark, lineHeight: 1.35 },
  infoValLink: { flex: 1, fontSize: 8.5, color: C.darkOrange, lineHeight: 1.35 },
  divider:     { height: 0.5, backgroundColor: C.divider, marginVertical: 10 },
  bodyText:    { fontSize: 8.5, color: C.text, lineHeight: 1.5, marginBottom: 10 },

  // bottom row
  bottomRow:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 'auto', paddingTop: 8 },
  qrCol:       { alignItems: 'center', gap: 3 },
  qrCaption:   { fontSize: 6.5, color: C.muted, textAlign: 'center', maxWidth: 72 },
  gauCol:      { flex: 1 },
  gauHead:     { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.dark, marginBottom: 3 },
  gauDesc:     { fontSize: 7, color: C.muted, lineHeight: 1.45, marginBottom: 6 },
  appBtnsRow:  { flexDirection: 'row', gap: 6 },
  appBtn:      { backgroundColor: C.dark, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  appBtnTxt:   { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.white, letterSpacing: 0.2 },

  // footer
  footerBar:   { height: 3, backgroundColor: C.orange },
  footer:      { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingVertical: 5 },
  footerBrand: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.white, letterSpacing: 0.4 },
  footerDate:  { fontSize: 7, color: 'rgba(255,255,255,0.5)' },

  // page 2 header
  p2Header:    { backgroundColor: C.green, padding: PAD, paddingBottom: 14 },
  p2Bar:       { height: 2, backgroundColor: C.greenAccent },
  p2Title:     { fontFamily: 'Helvetica-Bold', fontSize: 14, color: C.white, marginBottom: 3 },
  p2Sub:       { fontSize: 8, color: 'rgba(255,255,255,0.65)' },

  // bank table
  bankTable:   { borderWidth: 0.5, borderColor: C.divider, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  bankRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.divider, paddingVertical: 5, paddingHorizontal: 8 },
  bankLbl:     { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.muted, width: '36%', textTransform: 'uppercase', letterSpacing: 0.3 },
  bankVal:     { flex: 1, fontSize: 8.5, color: C.dark },
  bankValMono: { flex: 1, fontSize: 9.5, color: C.dark, fontFamily: 'Courier', letterSpacing: 0.5 },

  // UPI
  upiBox:      { backgroundColor: C.orangeTint, borderWidth: 1, borderColor: '#F2DFC2', borderRadius: 4, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  upiPill:     { backgroundColor: C.orange, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  upiPillTxt:  { fontFamily: 'Courier', fontSize: 10, color: C.white, letterSpacing: 0.4 },
  upiMerchant: { fontSize: 7.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },

  // legal
  legalGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  legalCard:   { backgroundColor: C.white, borderWidth: 0.5, borderColor: C.divider, borderRadius: 3, padding: 7, width: '47%' },
  legalLbl:    { fontSize: 6.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  legalVal:    { fontFamily: 'Courier', fontSize: 8.5, color: C.dark, letterSpacing: 0.3 },
  certYesRow:  { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  certYes:     { backgroundColor: '#E6F7EE', borderWidth: 0.5, borderColor: C.greenAccent, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
  certYesTxt:  { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#0F5A2A' },

  // app banner (p2 bottom)
  banner:      { backgroundColor: C.dark, padding: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerHead:  { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.white, marginBottom: 2 },
  bannerSub:   { fontSize: 7, color: 'rgba(255,255,255,0.55)' },
  bannerBtns:  { flexDirection: 'row', gap: 6 },
  bannerBtn:   { backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.28)', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  bannerBtnTxt:{ fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.white },
  p2FooterBar: { height: 3, backgroundColor: C.greenAccent },
  p2Footer:    { backgroundColor: '#0F2A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingVertical: 5 },
});

function InfoRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={link ? s.infoValLink : s.infoVal}>{value}</Text>
    </View>
  );
}

export function GaushalaPdfDocument({ profile, whatsappQrUrl, storeQrUrl, upiQrUrl }: Props) {
  const name = profile.businessName || profile.fullname;
  const initial = name.trim().charAt(0).toUpperCase();
  const location = [profile.city, profile.district, profile.state].filter(Boolean).join(', ');
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const census = profile.cowCensus;
  const total = census
    ? (census.total ?? (census.nandi ?? 0) + (census.milkingCows ?? 0) + (census.nonMilking ?? 0) + (census.maleCalves ?? 0) + (census.femaleCalves ?? 0))
    : 0;
  const hasCensus = total > 0;

  const hasSocial  = profile.instagram || profile.facebook || profile.youtube || profile.twitter;
  const hasBank    = profile.bankName || profile.accountNo;
  const hasUpi     = !!profile.upiId;
  const hasLegal   = profile.pan || profile.trustRegNo || profile.darpanNo || profile.provides80G || profile.has12A || profile.certificate80GNumber;
  const showPage2  = hasBank || hasUpi || hasLegal;

  const censusStats = [
    { label: 'Milking',       value: census?.milkingCows ?? 0,  hi: false },
    { label: 'Non-Milking',   value: census?.nonMilking ?? 0,   hi: false },
    { label: 'Nandi',         value: census?.nandi ?? 0,        hi: false },
    { label: 'Male Calves',   value: census?.maleCalves ?? 0,   hi: false },
    { label: 'Female Calves', value: census?.femaleCalves ?? 0, hi: false },
    { label: 'Total Gauvansh',value: total,                      hi: true  },
  ];

  const bankRows: Array<{ label: string; value: string; mono?: boolean }> = [
    profile.bankName            && { label: 'Bank Name',       value: profile.bankName },
    profile.accountHolderName   && { label: 'Account Holder', value: profile.accountHolderName },
    profile.accountNo           && { label: 'Account Number', value: profile.accountNo, mono: true },
    profile.ifsc                && { label: 'IFSC Code',      value: profile.ifsc, mono: true },
    profile.branch              && { label: 'Branch',         value: profile.branch },
    profile.accountType         && { label: 'Account Type',   value: profile.accountType },
  ].filter(Boolean) as Array<{ label: string; value: string; mono?: boolean }>;

  return (
    <Document>
      {/* ========== PAGE 1 ========== */}
      <Page size="A4" style={s.page}>

        {/* HERO */}
        <View style={s.hero}>
          <View style={s.gbPill}>
            <Text style={s.gbPillText}>GAUBOOK</Text>
          </View>
          <View style={s.heroRow}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{initial}</Text>
            </View>
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{name}</Text>
              <View style={s.heroBadgeRow}>
                {profile.legalStatus && (
                  <View style={s.heroBadge}>
                    <Text style={s.heroBadgeTxt}>{profile.legalStatus.toUpperCase()}</Text>
                  </View>
                )}
                {profile.establishedYear && (
                  <View style={[s.heroBadge, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
                    <Text style={s.heroBadgeTxt}>EST. {profile.establishedYear}</Text>
                  </View>
                )}
              </View>
              {location ? <Text style={s.heroLoc}>{location}</Text> : null}
            </View>
          </View>
          <View style={s.certStrip}>
            {profile.provides80G && <View style={s.certBadge}><Text style={s.certBadgeTxt}>✓ 80G CERTIFIED</Text></View>}
            {profile.has12A      && <View style={s.certBadge}><Text style={s.certBadgeTxt}>✓ 12A REGISTERED</Text></View>}
            {profile.darpanNo    && <View style={s.certBadge}><Text style={s.certBadgeTxt}>DARPAN: {profile.darpanNo}</Text></View>}
          </View>
        </View>

        {/* GAUVANSH CENSUS */}
        {hasCensus && (
          <View style={s.census}>
            {censusStats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <View style={s.censusStat}>
                  <Text style={stat.hi ? s.censusNumHi : s.censusNum}>{stat.value}</Text>
                  <Text style={stat.hi ? s.censusLblHi : s.censusLbl}>{stat.label}</Text>
                </View>
                {i < censusStats.length - 1 && <View style={s.censusSep} />}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* BODY */}
        <View style={s.body}>
          {profile.description ? (
            <>
              <Text style={s.secHead}>About</Text>
              <Text style={s.bodyText}>{profile.description}</Text>
              <View style={s.divider} />
            </>
          ) : null}

          <Text style={s.secHead}>Contact Information</Text>
          {profile.mobile    && <InfoRow label="Phone"        value={profile.mobile} link />}
          {profile.whatsapp && profile.whatsapp !== profile.mobile && (
            <InfoRow label="WhatsApp" value={profile.whatsapp} link />
          )}
          {profile.email       && <InfoRow label="Email"        value={profile.email} link />}
          {profile.website     && <InfoRow label="Website"      value={profile.website} link />}
          {profile.visitTiming && <InfoRow label="Visit Timing" value={profile.visitTiming} />}
          {location            && <InfoRow label="Location"     value={location} />}

          {hasSocial ? (
            <>
              <View style={s.divider} />
              <Text style={s.secHead}>Social Media</Text>
              {profile.instagram && <InfoRow label="Instagram" value={profile.instagram} link />}
              {profile.facebook  && <InfoRow label="Facebook"  value={profile.facebook} link />}
              {profile.youtube   && <InfoRow label="YouTube"   value={profile.youtube} link />}
              {profile.twitter   && <InfoRow label="X/Twitter" value={profile.twitter} link />}
            </>
          ) : null}

          {/* QR codes + App download */}
          <View style={s.divider} />
          <View style={s.bottomRow}>
            {whatsappQrUrl ? (
              <View style={s.qrCol}>
                <Image src={whatsappQrUrl} style={{ width: 72, height: 72 }} />
                <Text style={s.qrCaption}>WhatsApp Contact</Text>
              </View>
            ) : null}
            {storeQrUrl ? (
              <View style={s.qrCol}>
                <Image src={storeQrUrl} style={{ width: 72, height: 72 }} />
                <Text style={s.qrCaption}>Gaubook Store</Text>
              </View>
            ) : null}
            <View style={s.gauCol}>
              <Text style={s.gauHead}>Download Gaubook App</Text>
              <Text style={s.gauDesc}>
                India's largest Gau-seva platform. Find verified gaushalas, donate directly, and track your impact.
              </Text>
              <View style={s.appBtnsRow}>
                <View style={s.appBtn}><Text style={s.appBtnTxt}>Google Play</Text></View>
                <View style={s.appBtn}><Text style={s.appBtnTxt}>App Store</Text></View>
              </View>
            </View>
          </View>
        </View>

        <View style={s.footerBar} />
        <View style={s.footer}>
          <Text style={s.footerBrand}>Gaubook  ·  gaubook.org</Text>
          <Text style={s.footerDate}>{today}</Text>
        </View>
      </Page>

      {/* ========== PAGE 2 (conditional) ========== */}
      {showPage2 && (
        <Page size="A4" style={s.page}>
          <View style={s.p2Header}>
            <Text style={s.p2Title}>Donation &amp; Financial Details</Text>
            <Text style={s.p2Sub}>{name}  ·  {profile.legalStatus || 'Gaushala'}  ·  {location}</Text>
          </View>
          <View style={s.p2Bar} />

          <View style={s.body}>

            {/* Bank */}
            {hasBank && (
              <>
                <Text style={s.secHead}>Bank Account</Text>
                <View style={s.bankTable}>
                  {bankRows.map((row, i) => (
                    <View
                      key={row.label}
                      style={[s.bankRow, i === bankRows.length - 1 ? { borderBottomWidth: 0 } : {}]}
                    >
                      <Text style={s.bankLbl}>{row.label}</Text>
                      <Text style={row.mono ? s.bankValMono : s.bankVal}>{row.value}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.divider} />
              </>
            )}

            {/* UPI */}
            {hasUpi && (
              <>
                <Text style={s.secHead}>UPI Payment</Text>
                <View style={s.upiBox}>
                  {upiQrUrl ? (
                    <Image src={upiQrUrl} style={{ width: 90, height: 90 }} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <View style={s.upiPill}>
                      <Text style={s.upiPillTxt}>{profile.upiId}</Text>
                    </View>
                    {profile.upiMerchantName && (
                      <Text style={s.upiMerchant}>{profile.upiMerchantName}</Text>
                    )}
                  </View>
                </View>
                <View style={s.divider} />
              </>
            )}

            {/* Legal */}
            {hasLegal && (
              <>
                <Text style={s.secHead}>Legal &amp; Certifications</Text>
                <View style={s.legalGrid}>
                  {profile.trustRegNo && (
                    <View style={s.legalCard}>
                      <Text style={s.legalLbl}>Trust Registration No.</Text>
                      <Text style={s.legalVal}>{profile.trustRegNo}</Text>
                    </View>
                  )}
                  {profile.pan && (
                    <View style={s.legalCard}>
                      <Text style={s.legalLbl}>PAN Number</Text>
                      <Text style={s.legalVal}>{profile.pan}</Text>
                    </View>
                  )}
                  {profile.darpanNo && (
                    <View style={s.legalCard}>
                      <Text style={s.legalLbl}>DARPAN ID</Text>
                      <Text style={s.legalVal}>{profile.darpanNo}</Text>
                    </View>
                  )}
                  {profile.certificate80GNumber && (
                    <View style={s.legalCard}>
                      <Text style={s.legalLbl}>80G Certificate No.</Text>
                      <Text style={s.legalVal}>{profile.certificate80GNumber}</Text>
                    </View>
                  )}
                </View>
                <View style={s.certYesRow}>
                  {profile.provides80G && <View style={s.certYes}><Text style={s.certYesTxt}>✓ 80G Tax Exemption</Text></View>}
                  {profile.has12A      && <View style={s.certYes}><Text style={s.certYesTxt}>✓ 12A Registration</Text></View>}
                  {profile.darpanNo    && <View style={s.certYes}><Text style={s.certYesTxt}>✓ DARPAN Verified</Text></View>}
                </View>
              </>
            )}
          </View>

          <View style={s.banner}>
            <View>
              <Text style={s.bannerHead}>Download Gaubook App</Text>
              <Text style={s.bannerSub}>Connect with 3,00,000+ Gauvansh across India</Text>
            </View>
            <View style={s.bannerBtns}>
              <View style={s.bannerBtn}><Text style={s.bannerBtnTxt}>Google Play</Text></View>
              <View style={s.bannerBtn}><Text style={s.bannerBtnTxt}>App Store</Text></View>
            </View>
          </View>

          <View style={s.p2FooterBar} />
          <View style={s.p2Footer}>
            <Text style={[s.footerBrand, { color: C.white }]}>Gaubook  ·  gaubook.org</Text>
            <Text style={s.footerDate}>{today}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
