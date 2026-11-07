import { Redirect } from 'expo-router';

/** Unknown links (old deep links, typos) just go home. */
export default function NotFound() {
  return <Redirect href="/" />;
}
