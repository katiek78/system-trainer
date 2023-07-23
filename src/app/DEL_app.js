
import Index from './page';
import { UserProvider } from '@auth0/nextjs-auth0/client';

export default function App({ Index, pageProps }) {
  return (
    <UserProvider>
      <Index {...pageProps} />
    </UserProvider>
  );
}