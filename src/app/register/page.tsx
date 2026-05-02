import { redirect } from 'next/navigation';

/**
 * Legacy /register route — registration now lives as a tab on /login.
 * Bounce visitors there with the right tab pre-selected.
 */
export default function RegisterRedirect() {
  redirect('/login?tab=register');
}
