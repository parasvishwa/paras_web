import { NextResponse } from 'next/server';

const AASA = {
  applinks: {
    details: [
      {
        appIDs: ['LB9HDD7RV2.com.gaubook.app'],
        components: [
          { '/': '/open/*' },
          { '/': '/gaushala/*' },
          { '/': '/expert/*' },
          { '/': '/vendor/*' },
          { '/': '/profile/*' },
          { '/': '/events/*' },
          { '/': '/market/*' },
        ],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(AASA, {
    headers: { 'Content-Type': 'application/json' },
  });
}
