// Expert profile — SSR metadata + JSON-LD with /expert/ canonical URL
export { generateMetadata } from '@/app/gaushala/[id]/layout';
import { createProfileLayout } from '@/lib/profile-layout-factory';
export default createProfileLayout('expert');
