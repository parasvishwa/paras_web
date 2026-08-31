// Vendor profile — SSR metadata + JSON-LD with /vendor/ canonical URL
export { generateMetadata } from '@/app/gaushala/[id]/layout';
import { createProfileLayout } from '@/lib/profile-layout-factory';
export default createProfileLayout('vendor');
